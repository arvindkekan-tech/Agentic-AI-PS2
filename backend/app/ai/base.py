from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseAIProvider(ABC):
    """Abstract base class for AI Assessment Providers."""

    @abstractmethod
    def assess_requirements(
        self,
        requirements: List[Dict[str, Any]],
        resume_text: str,
        repository_snapshot: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate requirements against résumé text and repository file snapshot.
        Must return list of findings matching the requirement assessment schema.
        """
        pass
