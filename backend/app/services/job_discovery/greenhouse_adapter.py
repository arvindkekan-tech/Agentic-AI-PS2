import re
import uuid
import httpx
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup

from app.services.job_discovery.base import JobSourceAdapter, DiscoveredJob


def clean_html_content(raw_html: str) -> str:
    """Strip HTML tags and excessive whitespace safely."""
    if not raw_html:
        return ""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        return soup.get_text(separator="\n", strip=True)
    except Exception:
        return re.sub(r"<[^>]+>", " ", raw_html).strip()


# Verified, active public engineering tech company boards on Greenhouse
VERIFIED_GREENHOUSE_BOARDS: List[Dict[str, str]] = [
    {"token": "gitlab", "company": "GitLab"},
    {"token": "cloudflare", "company": "Cloudflare"},
    {"token": "canonical", "company": "Canonical"},
]


class GreenhouseJobAdapter(JobSourceAdapter):
    """
    Adapter for verified public Greenhouse Job Board APIs.
    Queries documented, CORS-friendly REST endpoints:
    https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
    """

    @property
    def source_id(self) -> str:
        return "greenhouse"

    @property
    def source_name(self) -> str:
        return "Greenhouse Verified Tech Boards"

    @property
    def description(self) -> str:
        return "Live public engineering roles from verified Greenhouse boards (GitLab, Cloudflare, Canonical)."

    def search(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        remote: bool = True,
        limit: int = 15
    ) -> List[DiscoveredJob]:
        discovered: List[DiscoveredJob] = []
        q_lower = query.strip().lower() if query else None

        for board_info in VERIFIED_GREENHOUSE_BOARDS:
            board_token = board_info["token"]
            company_name = board_info["company"]
            api_url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true"

            try:
                with httpx.Client(timeout=6.0, follow_redirects=True) as client:
                    resp = client.get(api_url)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    raw_jobs = data.get("jobs", [])

                    for item in raw_jobs:
                        title = item.get("title", "")
                        raw_content = item.get("content", "")
                        clean_desc = clean_html_content(raw_content)
                        loc_obj = item.get("location", {})
                        location_name = loc_obj.get("name", "Remote / Hybrid") if isinstance(loc_obj, dict) else "Remote"
                        absolute_url = item.get("absolute_url", f"https://boards.greenhouse.io/{board_token}/jobs/{item.get('id')}")
                        updated_at = item.get("updated_at")

                        # Extract tags from departments or metadata
                        item_tags = [company_name]
                        for dept in item.get("departments", []):
                            if isinstance(dept, dict) and dept.get("name"):
                                item_tags.append(dept["name"])

                        # Determine if remote
                        is_remote = (
                            "remote" in location_name.lower()
                            or "home based" in location_name.lower()
                            or "remote" in title.lower()
                        )

                        # Keyword query filter
                        if q_lower:
                            corpus = f"{title} {clean_desc[:3000]} {' '.join(item_tags)}".lower()
                            if q_lower not in corpus:
                                continue

                        discovered.append(
                            DiscoveredJob(
                                id=f"greenhouse-{board_token}-{item.get('id', uuid.uuid4())}",
                                source_id=self.source_id,
                                source_name=self.source_name,
                                title=title,
                                company=company_name,
                                location=location_name,
                                url=absolute_url,
                                description=clean_desc,
                                tags=item_tags,
                                salary_range=None,
                                published_at=updated_at,
                                is_remote=is_remote
                            )
                        )

                        if len(discovered) >= limit:
                            return discovered

            except Exception:
                # Safe skip to next board on network failure
                continue

        return discovered[:limit]

    def health_check(self) -> bool:
        """Verify Greenhouse public endpoint availability."""
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get("https://boards-api.greenhouse.io/v1/boards/gitlab/jobs")
                return res.status_code == 200
        except Exception:
            return False
