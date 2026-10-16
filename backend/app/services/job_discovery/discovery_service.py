import re
import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.job import Job
from app.services.job_service import extract_grounded_requirements
from app.services.job_discovery.base import JobSourceAdapter, DiscoveredJob, JobSourceInfo
from app.services.job_discovery.remotive_adapter import RemotiveAdapter
from app.services.job_discovery.arbeitnow_adapter import ArbeitnowAdapter
from app.services.job_discovery.schema_org_adapter import SchemaOrgJobAdapter


class JobDiscoveryService:
    def __init__(self):
        self.adapters: Dict[str, JobSourceAdapter] = {
            "remotive": RemotiveAdapter(),
            "arbeitnow": ArbeitnowAdapter(),
            "schema_org": SchemaOrgJobAdapter(),
        }

    def list_sources(self) -> List[JobSourceInfo]:
        sources = []
        for s_id, adapter in self.adapters.items():
            sources.append(
                JobSourceInfo(
                    source_id=s_id,
                    source_name=adapter.source_name,
                    description=adapter.description,
                    is_active=adapter.health_check(),
                    requires_api_key=False,
                    supported_filters=["query", "tags", "remote", "limit"]
                )
            )
        return sources

    def search_all_sources(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        remote: bool = True,
        limit_per_source: int = 10,
        selected_source_ids: Optional[List[str]] = None
    ) -> List[DiscoveredJob]:
        all_jobs: List[DiscoveredJob] = []
        seen_keys = set()

        target_adapters = (
            [self.adapters[s] for s in selected_source_ids if s in self.adapters]
            if selected_source_ids
            else [self.adapters["remotive"], self.adapters["arbeitnow"]]
        )

        for adapter in target_adapters:
            try:
                results = adapter.search(query=query, tags=tags, remote=remote, limit=limit_per_source)
                for job in results:
                    # Deduplication key: normalized title + company
                    norm_key = f"{re.sub(r'[^a-z0-9]', '', job.title.lower())}:{re.sub(r'[^a-z0-9]', '', job.company.lower())}"
                    if norm_key in seen_keys or job.url in seen_keys:
                        continue
                    seen_keys.add(norm_key)
                    seen_keys.add(job.url)
                    all_jobs.append(job)
            except Exception:
                continue

        return all_jobs

    def match_jobs_with_skills(
        self,
        jobs: List[DiscoveredJob],
        candidate_skills: List[str]
    ) -> List[DiscoveredJob]:
        """
        Calculate portfolio match score (0-100%) by cross-referencing candidate's
        verified or claimed skills against discovered job requirements, tags, and description.
        """
        if not candidate_skills:
            return jobs

        norm_candidate_skills = {s.strip().lower() for s in candidate_skills if s.strip()}
        
        for job in jobs:
            text_corpus = f"{job.title} {job.description} {' '.join(job.tags)}".lower()
            matched = []
            
            for skill in norm_candidate_skills:
                # Word boundary search
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, text_corpus):
                    matched.append(skill.title())

            job_tags_norm = {t.strip().lower() for t in job.tags}
            missing = [t.title() for t in job_tags_norm if t not in norm_candidate_skills]

            # Fit calculation
            if job.tags:
                tag_match_count = sum(1 for t in job_tags_norm if t in norm_candidate_skills)
                ratio = tag_match_count / max(len(job.tags), 1)
                # Boost with text corpus matches
                score = min(100.0, round((ratio * 70.0) + min(30.0, len(matched) * 6.0), 1))
            else:
                score = min(100.0, round(min(100.0, len(matched) * 15.0), 1))

            job.match_score = score
            job.matched_skills = matched[:8]
            job.missing_skills = missing[:6]

        # Sort jobs with highest match score first
        jobs.sort(key=lambda j: (j.match_score if j.match_score is not None else 0.0), reverse=True)
        return jobs

    def import_job_for_user(
        self,
        db: Session,
        user: User,
        discovered_job: DiscoveredJob
    ) -> Job:
        """
        Converts a discovered job directly into a user's ProofPath Job entity,
        extracting structured requirements automatically.
        """
        # Requirements extraction
        extracted_reqs = extract_grounded_requirements(discovered_job.description)

        job = Job(
            user_id=user.id,
            title=discovered_job.title[:255],
            company=discovered_job.company[:255],
            source_type="url" if discovered_job.url.startswith("http") else "pasted",
            source_url=discovered_job.url[:1000] if discovered_job.url else None,
            raw_text=discovered_job.description,
            extracted_requirements_json=json.dumps([r.model_dump() for r in extracted_reqs])
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job


discovery_service = JobDiscoveryService()
