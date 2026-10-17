from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.job_discovery.discovery_service import discovery_service
from app.services.job_discovery.base import DiscoveredJob, JobSourceInfo
from app.schemas.job import JobResponse
from app.api.v1.endpoints.jobs import format_job_response

router = APIRouter(tags=["Job Discovery"])


class SkillMatchRequest(BaseModel):
    candidate_skills: List[str]
    query: Optional[str] = None
    limit: int = 15
    remote: bool = True
    sources: Optional[List[str]] = None


@router.get("/job-sources", response_model=List[JobSourceInfo], summary="List available job discovery providers")
def get_job_sources():
    """Returns active job aggregator adapters (Remotive, Arbeitnow, Schema.org)."""
    return discovery_service.list_sources()


@router.get("/job-discovery/search", response_model=List[DiscoveredJob], summary="Search discovered tech jobs across sources")
def search_discovered_jobs(
    query: Optional[str] = Query(None, description="Keywords such as 'Python', 'FastAPI', 'React'"),
    remote: bool = Query(True, description="Filter for remote roles"),
    limit: int = Query(15, ge=1, le=50, description="Max results per source"),
    sources: Optional[List[str]] = Query(None, description="Specific sources to query")
):
    """
    Search live developer jobs across public aggregators with deduplication and HTML cleaning.
    """
    return discovery_service.search_all_sources(
        query=query,
        remote=remote,
        limit_per_source=limit,
        selected_source_ids=sources
    )


@router.post("/job-discovery/match", response_model=List[DiscoveredJob], summary="Match discovered jobs against candidate verified skills")
def match_jobs_with_portfolio(
    match_req: SkillMatchRequest
):
    """
    Calculate candidate portfolio fit scores (0-100%) against discovered opportunities.
    """
    jobs = discovery_service.search_all_sources(
        query=match_req.query,
        remote=match_req.remote,
        limit_per_source=match_req.limit,
        selected_source_ids=match_req.sources
    )
    return discovery_service.match_jobs_with_skills(
        jobs=jobs,
        candidate_skills=match_req.candidate_skills
    )


@router.post("/jobs/import-discovered", response_model=JobResponse, status_code=status.HTTP_201_CREATED, summary="Import a discovered job for assessment")
def import_discovered_job(
    discovered_job: DiscoveredJob,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import a discovered job directly into the user's saved jobs, extracting structured requirements
    so it can be assessed immediately with the candidate's repository and résumé.
    """
    job = discovery_service.import_job_for_user(
        db=db,
        user=current_user,
        discovered_job=discovered_job
    )
    return format_job_response(job)
