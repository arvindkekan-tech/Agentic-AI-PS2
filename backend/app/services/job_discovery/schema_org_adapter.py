import json
import uuid
import httpx
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup
from fastapi import HTTPException, status

from app.services.job_discovery.base import JobSourceAdapter, DiscoveredJob
from app.services.job_service import validate_url_for_ssrf


class SchemaOrgJobAdapter(JobSourceAdapter):
    @property
    def source_id(self) -> str:
        return "schema_org"

    @property
    def source_name(self) -> str:
        return "Schema.org JobPosting Parser"

    @property
    def description(self) -> str:
        return "Extracts structured Schema.org JobPosting JSON-LD metadata from public career page URLs (Greenhouse, Ashby, Lever, Workable)."

    def search(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        remote: bool = True,
        limit: int = 15
    ) -> List[DiscoveredJob]:
        # SchemaOrg adapter is primarily on-demand URL-based extraction
        return []

    def extract_from_url(self, target_url: str) -> DiscoveredJob:
        """
        Safely fetch and parse Schema.org JobPosting metadata from a given URL with SSRF protection.
        """
        validate_url_for_ssrf(target_url)

        headers = {
            "User-Agent": "ProofPath-CareerIntelligence/2.0 (+https://proofpath.dev/bot)",
            "Accept": "text/html,application/xhtml+xml,application/json"
        }

        try:
            with httpx.Client(timeout=8.0, follow_redirects=True, headers=headers) as client:
                resp = client.get(target_url)
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to reach career page (HTTP {resp.status_code})."
                    )
                html_text = resp.text
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Network error fetching job URL: {str(e)}"
            )

        soup = BeautifulSoup(html_text, "html.parser")
        
        # Look for <script type="application/ld+json">
        json_ld_scripts = soup.find_all("script", type="application/ld+json")
        job_data: Optional[Dict[str, Any]] = None

        for script in json_ld_scripts:
            try:
                data = json.loads(script.string or "{}")
                if isinstance(data, list):
                    for item in data:
                        if item.get("@type") == "JobPosting":
                            job_data = item
                            break
                elif isinstance(data, dict):
                    if data.get("@type") == "JobPosting":
                        job_data = data
                        break
                    elif "@graph" in data:
                        for item in data["@graph"]:
                            if item.get("@type") == "JobPosting":
                                job_data = item
                                break
            except Exception:
                continue

        if job_data:
            title = job_data.get("title") or "Software Engineer"
            org = job_data.get("hiringOrganization", {})
            company = org.get("name") if isinstance(org, dict) else str(org) or "Company"
            raw_desc = job_data.get("description", "")
            desc_soup = BeautifulSoup(raw_desc, "html.parser")
            clean_desc = desc_soup.get_text(separator="\n", strip=True) or raw_desc
            location = "Remote"
            job_loc = job_data.get("jobLocation")
            if isinstance(job_loc, dict):
                address = job_loc.get("address", {})
                if isinstance(address, dict):
                    location = address.get("addressLocality") or address.get("addressCountry") or "Remote"
            
            salary = None
            base_sal = job_data.get("baseSalary")
            if isinstance(base_sal, dict):
                val = base_sal.get("value", {})
                if isinstance(val, dict):
                    salary = f"{val.get('minValue', '')} - {val.get('maxValue', '')} {val.get('unitText', '')}".strip()

            tags = []
            skills = job_data.get("skills")
            if isinstance(skills, list):
                tags = [str(s) for s in skills[:8]]
            elif isinstance(skills, str):
                tags = [s.strip() for s in skills.split(",")[:8]]

            return DiscoveredJob(
                id=f"schema-{uuid.uuid4()}",
                source_id=self.source_id,
                source_name=self.source_name,
                title=title,
                company=company,
                location=location,
                url=target_url,
                description=clean_desc,
                tags=tags,
                salary_range=salary,
                published_at=job_data.get("datePosted"),
                is_remote=True
            )
        else:
            # Fallback to standard meta tags & page title
            title = soup.title.string.strip() if soup.title and soup.title.string else "Discovered Opportunity"
            og_company = soup.find("meta", property="og:site_name")
            company = og_company["content"].strip() if og_company and og_company.get("content") else "Engineering Team"
            
            # Clean body text
            for elem in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                elem.extract()
            body_text = soup.get_text(separator="\n", strip=True)

            return DiscoveredJob(
                id=f"page-{uuid.uuid4()}",
                source_id=self.source_id,
                source_name=self.source_name,
                title=title,
                company=company,
                location="Remote / Verified",
                url=target_url,
                description=body_text[:4000],
                tags=[],
                salary_range=None,
                published_at=None,
                is_remote=True
            )

    def health_check(self) -> bool:
        return True
