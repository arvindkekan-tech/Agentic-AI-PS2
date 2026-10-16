from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DiscoveredJob(BaseModel):
    id: str
    source_id: str
    source_name: str
    title: str
    company: str
    location: Optional[str] = "Remote"
    url: str
    description: str
    tags: List[str] = []
    salary_range: Optional[str] = None
    published_at: Optional[str] = None
    is_remote: bool = True
    match_score: Optional[float] = None
    matched_skills: List[str] = []
    missing_skills: List[str] = []


class JobSourceInfo(BaseModel):
    source_id: str
    source_name: str
    description: str
    is_active: bool
    requires_api_key: bool = False
    supported_filters: List[str] = ["query", "tags", "remote", "limit"]


class JobSourceAdapter(ABC):
    """Abstract Base Class for external Job Discovery Providers."""

    @property
    @abstractmethod
    def source_id(self) -> str:
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    def search(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        remote: bool = True,
        limit: int = 15
    ) -> List[DiscoveredJob]:
        """Fetch and normalize job postings from external source."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Check if source is reachable."""
        pass
