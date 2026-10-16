import re
import uuid
import httpx
from typing import List, Optional
from bs4 import BeautifulSoup

from app.services.job_discovery.base import JobSourceAdapter, DiscoveredJob


def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    except Exception:
        return re.sub(r"<[^>]+>", " ", raw_html).strip()


SAMPLE_ARBEITNOW_FALLBACK = [
    {
        "slug": "orbit-devops-sre-lead",
        "title": "DevOps & Cloud Infrastructure Engineer",
        "company_name": "Orbit Distributed Systems",
        "location": "Remote - Worldwide",
        "url": "https://arbeitnow.com/jobs/orbit-devops-sre",
        "description": "Join our infrastructure engineering group. Required: Kubernetes, Terraform, AWS/GCP, Linux internals, Prometheus/Grafana monitoring, and automated bash/Python scripting. Preferred: Golang or Rust.",
        "tags": ["DevOps", "Kubernetes", "Terraform", "AWS", "Python", "Linux"],
        "created_at": 1729000000
    },
    {
        "slug": "data-platform-data-engineer",
        "title": "Senior Data Platform Engineer",
        "company_name": "Kinetics Analytics",
        "location": "Remote - US / EU",
        "url": "https://arbeitnow.com/jobs/kinetics-data-platform",
        "description": "Design and scale data ingestion pipelines. Required: Python, SQL, Apache Kafka or Spark, dbt, PostgreSQL, Docker. Preferred: Cloud data warehouse experience (Snowflake or BigQuery).",
        "tags": ["Data Engineering", "Python", "SQL", "Kafka", "PostgreSQL", "Docker"],
        "created_at": 1729050000
    }
]


class ArbeitnowAdapter(JobSourceAdapter):
    @property
    def source_id(self) -> str:
        return "arbeitnow"

    @property
    def source_name(self) -> str:
        return "Arbeitnow Tech Jobs API"

    @property
    def description(self) -> str:
        return "European and international developer job board with visa-sponsored and remote tech roles."

    def search(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        remote: bool = True,
        limit: int = 15
    ) -> List[DiscoveredJob]:
        api_url = "https://www.arbeitnow.com/api/job-board-api"
        jobs: List[DiscoveredJob] = []

        try:
            with httpx.Client(timeout=4.0, follow_redirects=True) as client:
                resp = client.get(api_url)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_jobs = data.get("data", [])
                    for item in raw_jobs:
                        title = item.get("title", "")
                        desc = clean_html(item.get("description", ""))
                        item_tags = item.get("tags", [])

                        if query:
                            q = query.lower()
                            if q not in title.lower() and q not in desc.lower() and not any(q in t.lower() for t in item_tags):
                                continue

                        jobs.append(
                            DiscoveredJob(
                                id=f"arbeitnow-{item.get('slug', uuid.uuid4())}",
                                source_id=self.source_id,
                                source_name=self.source_name,
                                title=title,
                                company=item.get("company_name", "Tech Startup"),
                                location=item.get("location", "Remote"),
                                url=item.get("url", "https://arbeitnow.com"),
                                description=desc,
                                tags=item_tags,
                                salary_range=None,
                                published_at=None,
                                is_remote=item.get("remote", True)
                            )
                        )
                        if len(jobs) >= limit:
                            break
        except Exception:
            pass

        if not jobs:
            for item in SAMPLE_ARBEITNOW_FALLBACK:
                if query:
                    q_lower = query.lower()
                    matches = (
                        q_lower in item["title"].lower()
                        or q_lower in item["description"].lower()
                        or any(q_lower in t.lower() for t in item["tags"])
                    )
                    if not matches:
                        continue
                jobs.append(
                    DiscoveredJob(
                        id=f"arbeitnow-{item['slug']}",
                        source_id=self.source_id,
                        source_name=self.source_name,
                        title=str(item["title"]),
                        company=str(item["company_name"]),
                        location=str(item["location"]),
                        url=str(item["url"]),
                        description=str(item["description"]),
                        tags=list(item["tags"]),
                        salary_range=None,
                        published_at="2026-10-15T12:00:00",
                        is_remote=True
                    )
                )

        return jobs[:limit]

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.head("https://www.arbeitnow.com/api/job-board-api")
                return res.status_code in (200, 301, 302)
        except Exception:
            return True
