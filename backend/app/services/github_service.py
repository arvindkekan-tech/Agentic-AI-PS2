import re
import urllib.parse
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.repository import InspectedFileItem, ExcludedFileItem, SnapshotCoverage


# Language detection mapping
LANG_MAP = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".cs": "C#",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".json": "JSON",
    ".toml": "TOML",
    ".md": "Markdown",
}

EXCLUDED_DIRS = {
    ".git", "node_modules", "dist", "build", "out", "target", "bin", "obj",
    ".venv", "venv", "env", "__pycache__", ".vscode", ".idea", "vendor",
    "coverage", ".next", ".nuxt", "storybook-static"
}

EXCLUDED_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".bmp",
    ".mp4", ".mov", ".avi", ".webm", ".mp3", ".wav",
    ".pdf", ".zip", ".tar", ".gz", ".7z", ".rar",
    ".woff", ".woff2", ".ttf", ".eot",
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".min.js", ".min.css", ".map", ".lock",
    ".pyc", ".pyd", ".class", ".jar"
}

EXCLUDED_EXACT_NAMES = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock",
    "cargo.lock", "composer.lock", "gemfile.lock"
}

MAX_INSPECTED_FILES = 30
MAX_FILE_SIZE_BYTES = 50 * 1024  # 50 KB


def parse_github_url(url: str) -> Tuple[str, str]:
    """Parse GitHub repository URL and return (owner, repo)."""
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    parsed = urllib.parse.urlparse(clean_url)
    if parsed.netloc.lower() not in ("github.com", "www.github.com"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid host. ProofPath Phase 1 only analyzes public GitHub repositories."
        )

    parts = [p for p in parsed.path.strip("/").split("/") if p]
    if len(parts) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid repository URL. Expected format: https://github.com/owner/repository"
        )

    owner = parts[0]
    repo = parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]

    if not re.match(r"^[a-zA-Z0-9_\.-]+$", owner) or not re.match(r"^[a-zA-Z0-9_\.-]+$", repo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed repository owner or name."
        )

    return owner, repo


def get_github_client() -> httpx.Client:
    """Create httpx client with optional GitHub authorization."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ProofPath-CodeEvidence-Inspector/1.0"
    }
    tok = settings.GITHUB_TOKEN.strip() if settings.GITHUB_TOKEN else ""
    if tok and not tok.startswith(("YOUR_", "REPLACE_")) and "YOUR_" not in tok and len(tok) >= 10:
        headers["Authorization"] = f"Bearer {tok}"
    return httpx.Client(base_url="https://api.github.com", headers=headers, timeout=15.0)



def fetch_repository_snapshot(repo_url: str, branch_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch repository metadata, exact commit SHA, and bounded file snapshot.
    Does NOT clone repository or execute code.
    """
    owner, repo_name = parse_github_url(repo_url)

    with get_github_client() as client:
        # 1. Fetch repo metadata
        try:
            repo_res = client.get(f"/repos/{owner}/{repo_name}")
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Network error contacting GitHub API: {str(e)}"
            )

        if repo_res.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Repository '{owner}/{repo_name}' not found on GitHub or is private."
            )
        elif repo_res.status_code in (403, 429):
            rate_limit_rem = repo_res.headers.get("x-ratelimit-remaining", "")
            if rate_limit_rem == "0":
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="GitHub API rate limit exceeded. Configure GITHUB_TOKEN in backend environment to increase quota."
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="GitHub API access forbidden."
            )
        elif repo_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub API error: status {repo_res.status_code}"
            )

        repo_info = repo_res.json()
        target_branch = branch_name or repo_info.get("default_branch") or "main"

        # 2. Get branch commit SHA
        branch_res = client.get(f"/repos/{owner}/{repo_name}/branches/{target_branch}")
        if branch_res.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch '{target_branch}' not found in repository '{owner}/{repo_name}'."
            )
        elif branch_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch branch details: status {branch_res.status_code}"
            )

        branch_data = branch_res.json()
        commit_sha = branch_data["commit"]["sha"]

        # 3. Get recursive tree
        tree_res = client.get(f"/repos/{owner}/{repo_name}/git/trees/{commit_sha}?recursive=1")
        if tree_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch Git tree for commit {commit_sha[:7]}."
            )

        tree_data = tree_res.json()
        all_tree_items = tree_data.get("tree", [])

        # Filter and classify files
        inspected_files_meta: List[InspectedFileItem] = []
        excluded_files_meta: List[ExcludedFileItem] = []
        eligible_items = []

        total_files = 0
        for item in all_tree_items:
            if item.get("type") != "blob":
                continue
            total_files += 1
            path = item.get("path", "")
            path_parts = path.split("/")
            filename = path_parts[-1]
            size = item.get("size", 0)
            ext = Path(filename).suffix.lower()

            # Check directory exclusion
            if any(part in EXCLUDED_DIRS for part in path_parts[:-1]):
                excluded_files_meta.append(ExcludedFileItem(path=path, reason="Dependency, build artifact, or environment folder"))
                continue

            # Check filename / extension exclusions
            if filename in EXCLUDED_EXACT_NAMES or any(filename.startswith(p) for p in [".env", ".DS_Store"]):
                excluded_files_meta.append(ExcludedFileItem(path=path, reason="Lockfile or environment configuration"))
                continue

            if ext in EXCLUDED_EXTS or (ext == "" and "." in filename and filename.startswith(".")):
                excluded_files_meta.append(ExcludedFileItem(path=path, reason="Binary, font, media asset, or compiled file"))
                continue

            if ext not in LANG_MAP:
                excluded_files_meta.append(ExcludedFileItem(path=path, reason=f"Unsupported format '{ext or 'unknown'}'"))
                continue

            if size > MAX_FILE_SIZE_BYTES:
                excluded_files_meta.append(ExcludedFileItem(path=path, reason=f"Oversized file ({size // 1024}KB > 50KB limit)"))
                continue

            eligible_items.append((item, ext, size))

        # Select bounded subset: prioritize code files in src/, app/, lib/, root, test
        def sort_priority(item_tuple):
            path = item_tuple[0]["path"]
            score = 0
            if any(p in path.lower() for p in ["src/", "app/", "lib/", "core/"]):
                score -= 10
            if "test" in path.lower():
                score -= 5
            if path.count("/") <= 2:
                score -= 3
            return (score, path)

        eligible_items.sort(key=sort_priority)
        selected_items = eligible_items[:MAX_INSPECTED_FILES]
        
        for item, ext, size in eligible_items[MAX_INSPECTED_FILES:]:
            excluded_files_meta.append(ExcludedFileItem(path=item["path"], reason="Snapshot file limit reached (capped at 30 files)"))

        # 4. Fetch content for selected files
        files_dict: Dict[str, Dict[str, Any]] = {}
        inspected_lines_total = 0
        languages_detected = set()

        for item, ext, size in selected_items:
            path = item["path"]
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{commit_sha}/{path}"
            try:
                raw_res = client.get(raw_url)
                if raw_res.status_code == 200:
                    text_content = raw_res.text
                    lines = text_content.splitlines()
                    lines_count = len(lines)
                    lang = LANG_MAP.get(ext, "Plain Text")
                    languages_detected.add(lang)

                    files_dict[path] = {
                        "path": path,
                        "size": size,
                        "lines": lines,
                        "lines_count": lines_count,
                        "language": lang
                    }
                    inspected_lines_total += lines_count
                    inspected_files_meta.append(InspectedFileItem(
                        path=path,
                        size=size,
                        lines_count=lines_count,
                        language=lang
                    ))
                else:
                    excluded_files_meta.append(ExcludedFileItem(path=path, reason=f"Failed to fetch content (HTTP {raw_res.status_code})"))
            except Exception as e:
                excluded_files_meta.append(ExcludedFileItem(path=path, reason=f"Error reading file: {str(e)}"))

        limitations = [
            f"Snapshot bounded to {len(inspected_files_meta)} source files ({inspected_lines_total} lines) across {len(languages_detected)} languages.",
            f"Analyzed exact commit SHA {commit_sha}.",
            "External dependencies, binaries, build outputs, and files exceeding 50KB were excluded.",
            "Static source analysis only; no code was executed or tests run."
        ]

        coverage = SnapshotCoverage(
            inspected_files_count=len(inspected_files_meta),
            excluded_files_count=len(excluded_files_meta),
            total_files_count=total_files,
            inspected_lines_total=inspected_lines_total,
            languages_detected=sorted(list(languages_detected)),
            limitations=limitations
        )

        return {
            "owner": owner,
            "name": repo_name,
            "branch": target_branch,
            "analyzed_sha": commit_sha,
            "repo_url": f"https://github.com/{owner}/{repo_name}",
            "files": files_dict,
            "inspected_files": inspected_files_meta,
            "excluded_files": excluded_files_meta,
            "coverage": coverage
        }


def get_branch_head_sha(repo_url: str, branch_name: Optional[str] = None) -> Tuple[str, str]:
    """
    Get the latest head commit SHA for a repository branch.
    Returns (branch, sha).
    """
    owner, repo_name = parse_github_url(repo_url)
    with get_github_client() as client:
        target_branch = branch_name
        if not target_branch:
            try:
                repo_res = client.get(f"/repos/{owner}/{repo_name}")
                if repo_res.status_code == 200:
                    target_branch = repo_res.json().get("default_branch") or "main"
                else:
                    target_branch = "main"
            except Exception:
                target_branch = "main"

        try:
            branch_res = client.get(f"/repos/{owner}/{repo_name}/branches/{target_branch}")
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Network error contacting GitHub API: {str(e)}"
            )

        if branch_res.status_code == 200:
            branch_data = branch_res.json()
            return target_branch, branch_data["commit"]["sha"]
        elif branch_res.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch '{target_branch}' not found in repository '{owner}/{repo_name}'."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch branch head: HTTP {branch_res.status_code}"
            )


def get_commit_details_or_compare(
    repo_url: str,
    branch: str,
    head_sha: str,
    base_sha: Optional[str] = None
) -> Dict[str, Any]:
    """
    Fetch commit information and changed files between base_sha and head_sha.
    If base_sha is not provided or compare fails, falls back to inspecting head_sha single commit.
    """
    owner, repo_name = parse_github_url(repo_url)
    changed_files: List[Dict[str, Any]] = []
    commit_msg = None
    commit_author = None
    commit_url = f"https://github.com/{owner}/{repo_name}/commit/{head_sha}"

    with get_github_client() as client:
        compared = False
        if base_sha and base_sha != head_sha:
            try:
                comp_res = client.get(f"/repos/{owner}/{repo_name}/compare/{base_sha}...{head_sha}")
                if comp_res.status_code == 200:
                    comp_data = comp_res.json()
                    for f in comp_data.get("files", []):
                        changed_files.append({
                            "filename": f.get("filename", ""),
                            "status": f.get("status", "modified"),
                            "additions": f.get("additions", 0),
                            "deletions": f.get("deletions", 0)
                        })
                    commits = comp_data.get("commits", [])
                    if commits:
                        latest_commit = commits[-1]
                        commit_msg = latest_commit.get("commit", {}).get("message", "")
                        commit_author = (
                            latest_commit.get("commit", {}).get("author", {}).get("name")
                            or latest_commit.get("author", {}).get("login")
                        )
                        commit_url = latest_commit.get("html_url") or commit_url
                    compared = True
            except Exception:
                pass

        if not compared:
            try:
                c_res = client.get(f"/repos/{owner}/{repo_name}/commits/{head_sha}")
                if c_res.status_code == 200:
                    c_data = c_res.json()
                    commit_msg = c_data.get("commit", {}).get("message", "")
                    commit_author = (
                        c_data.get("commit", {}).get("author", {}).get("name")
                        or c_data.get("author", {}).get("login")
                    )
                    commit_url = c_data.get("html_url") or commit_url
                    for f in c_data.get("files", []):
                        changed_files.append({
                            "filename": f.get("filename", ""),
                            "status": f.get("status", "modified"),
                            "additions": f.get("additions", 0),
                            "deletions": f.get("deletions", 0)
                        })
            except Exception:
                pass

    return {
        "commit_sha": head_sha,
        "parent_sha": base_sha,
        "commit_message": commit_msg or f"Commit {head_sha[:7]}",
        "commit_author": commit_author or "GitHub Author",
        "commit_url": commit_url,
        "changed_files": changed_files
    }

