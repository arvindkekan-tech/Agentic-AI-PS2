import pytest
from app.services.citation_validator import (
    validate_repository_citation,
    validate_resume_citation,
    validate_and_adjust_finding
)


@pytest.fixture
def mock_snapshot():
    return {
        "owner": "proofpath-org",
        "name": "sample-repo",
        "branch": "main",
        "analyzed_sha": "abc1234567890abcdef1234567890abcdef1234",
        "repo_url": "https://github.com/proofpath-org/sample-repo",
        "files": {
            "src/api/auth.py": {
                "path": "src/api/auth.py",
                "size": 500,
                "lines_count": 10,
                "language": "Python",
                "lines": [
                    "from fastapi import FastAPI, Depends",
                    "from argon2 import PasswordHasher",
                    "",
                    "ph = PasswordHasher()",
                    "",
                    "def hash_password(password: str) -> str:",
                    "    return ph.hash(password)",
                    "",
                    "def verify_password(plain: str, hashed: str) -> bool:",
                    "    return ph.verify(hashed, plain)"
                ]
            }
        }
    }


def test_validate_repository_citation_valid(mock_snapshot):
    citation = {
        "commit_sha": "abc1234567890abcdef1234567890abcdef1234",
        "file_path": "src/api/auth.py",
        "start_line": 6,
        "end_line": 7,
        "excerpt": "def hash_password(password: str) -> str:\n    return ph.hash(password)"
    }
    is_valid, note, commit_url = validate_repository_citation(citation, mock_snapshot)
    assert is_valid is True
    assert "successfully verified" in note
    assert commit_url == "https://github.com/proofpath-org/sample-repo/blob/abc1234567890abcdef1234567890abcdef1234/src/api/auth.py#L6-L7"


def test_validate_repository_citation_sha_mismatch(mock_snapshot):
    citation = {
        "commit_sha": "different_sha_0000000000000000000000000",
        "file_path": "src/api/auth.py",
        "start_line": 6,
        "end_line": 7,
        "excerpt": "def hash_password(password: str) -> str:\n    return ph.hash(password)"
    }
    is_valid, note, commit_url = validate_repository_citation(citation, mock_snapshot)
    assert is_valid is False
    assert "SHA mismatch" in note


def test_validate_repository_citation_file_not_found(mock_snapshot):
    citation = {
        "commit_sha": "abc1234567890abcdef1234567890abcdef1234",
        "file_path": "nonexistent/file.py",
        "start_line": 1,
        "end_line": 2,
        "excerpt": "code"
    }
    is_valid, note, commit_url = validate_repository_citation(citation, mock_snapshot)
    assert is_valid is False
    assert "does not exist" in note


def test_validate_repository_citation_lines_out_of_bounds(mock_snapshot):
    citation = {
        "commit_sha": "abc1234567890abcdef1234567890abcdef1234",
        "file_path": "src/api/auth.py",
        "start_line": 9,
        "end_line": 25,  # Only 10 lines in file
        "excerpt": "code"
    }
    is_valid, note, commit_url = validate_repository_citation(citation, mock_snapshot)
    assert is_valid is False
    assert "out of bounds" in note


def test_validate_repository_citation_excerpt_mismatch(mock_snapshot):
    citation = {
        "commit_sha": "abc1234567890abcdef1234567890abcdef1234",
        "file_path": "src/api/auth.py",
        "start_line": 6,
        "end_line": 7,
        "excerpt": "completely different fabricated content that was never in the repo"
    }
    is_valid, note, commit_url = validate_repository_citation(citation, mock_snapshot)
    assert is_valid is False
    assert "does not match" in note


def test_demonstrated_downgrade_when_citations_invalid(mock_snapshot):
    # Finding claims 'demonstrated' repo status, but provides an invalid citation
    finding = {
        "requirement_id": "REQ-1",
        "normalized_skill": "Security & Authentication",
        "resume_status": "demonstrated",
        "repo_status": "demonstrated",
        "limitations_note": "Initial note.",
        "repo_explanation": "Claims capability.",
        "combined_interpretation": "Interp.",
        "citations": [
            {
                "evidence_type": "implementation",
                "commit_sha": "wrong_sha",
                "file_path": "src/api/auth.py",
                "start_line": 6,
                "end_line": 7,
                "excerpt": "def hash_password"
            }
        ]
    }
    resume_text = "I have extensive experience with Security & Authentication in backend systems."

    audited = validate_and_adjust_finding(finding, mock_snapshot, resume_text)
    # repo_status must be downgraded because 0 valid citations exist
    assert audited["repo_status"] == "partial_or_needs_review"
    assert "downgraded" in audited["limitations_note"]
    assert audited["citations"][0]["is_valid"] is False
