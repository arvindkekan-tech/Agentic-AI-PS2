import re
import socket
import ipaddress
import urllib.parse
from typing import List, Tuple, Optional
import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.job import ExtractedRequirementItem


def is_safe_ip(ip_str: str) -> bool:
    """Validate whether an IP address is a safe public IP (prevents SSRF)."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            return False
        # Disallow IPv4-mapped IPv6 addresses representing private ranges
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            return is_safe_ip(str(ip.ipv4_mapped))
        return True
    except ValueError:
        return False


def validate_url_for_ssrf(url: str) -> urllib.parse.ParseResult:
    """Validate URL scheme and ensure hostname does not resolve to private/internal IPs."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are allowed."
        )
    
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL: Missing hostname."
        )
    
    # Block obvious local names
    lower_host = hostname.lower()
    if lower_host in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "internal", "local"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forbidden URL: Access to localhost and internal hostnames is prohibited."
        )

    # Resolve IP addresses
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        resolved_ips = {item[4][0] for item in addr_info}
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not resolve hostname '{hostname}'. Check the URL and try again."
        )

    if not resolved_ips:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No IP addresses resolved for hostname '{hostname}'."
        )

    for ip_str in resolved_ips:
        if not is_safe_ip(ip_str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security rejection: URL resolves to a private, loopback, or internal IP address."
            )

    return parsed


def fetch_job_url_safely(url: str) -> Tuple[str, Optional[str]]:
    """
    Safely retrieve content from a public job posting URL.
    Enforces SSRF prevention on initial URL and each redirect, timeouts, and response size limits.
    Returns (cleaned_text, extracted_title).
    """
    current_url = url
    max_redirects = 3
    redirect_count = 0

    with httpx.Client(
        timeout=settings.SSRF_TIMEOUT_SECONDS,
        headers={"User-Agent": "ProofPath-JobImporter/1.0 (+https://proofpath.dev)"},
        follow_redirects=False
    ) as client:
        while redirect_count <= max_redirects:
            validate_url_for_ssrf(current_url)
            
            try:
                # Stream to enforce size limit
                with client.stream("GET", current_url) as response:
                    if response.status_code in (301, 302, 303, 307, 308):
                        location = response.headers.get("Location")
                        if not location:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Redirect received with no Location header."
                            )
                        current_url = urllib.parse.urljoin(current_url, location)
                        redirect_count += 1
                        continue

                    if response.status_code >= 400:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Target page returned HTTP error {response.status_code}."
                        )

                    total_bytes = 0
                    chunks = []
                    for chunk in response.iter_bytes():
                        total_bytes += len(chunk)
                        if total_bytes > settings.SSRF_MAX_RESPONSE_BYTES:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Response size exceeded {settings.SSRF_MAX_RESPONSE_BYTES // (1024*1024)}MB limit."
                            )
                        chunks.append(chunk)
                    
                    content = b"".join(chunks).decode("utf-8", errors="replace")
                    break

            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Connection timed out while fetching job URL."
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Network error while connecting to job URL: {str(e)}"
                )

    if redirect_count > max_redirects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many redirects encountered while fetching job URL."
        )

    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(content, "html.parser")
    for script_or_style in soup(["script", "style", "nav", "header", "footer", "aside"]):
        script_or_style.decompose()

    page_title = None
    if soup.title and soup.title.string:
        page_title = soup.title.string.strip()

    text = soup.get_text(separator="\n")
    # Clean excessive whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned_text = "\n".join(lines)

    if len(cleaned_text) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The target URL did not return sufficient job description text. Please paste the job description directly."
        )

    return cleaned_text, page_title


def extract_grounded_requirements(job_text: str) -> List[ExtractedRequirementItem]:
    """
    Extract 4-6 grounded requirements from job text.
    Preserves original wording, extracts normalized skill, and detects priority.
    """
    if not job_text or len(job_text.strip()) < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job text is too brief to extract requirements. Please provide a complete job posting."
        )

    # Common technical skills and domain keywords for grounding
    skill_patterns = [
        ("Python", [r"\bpython\b", r"\bpython3\b"]),
        ("FastAPI", [r"\bfastapi\b", r"\bfast\s*api\b"]),
        ("React", [r"\breact\b", r"\breact\.?js\b", r"\breact\s*native\b"]),
        ("TypeScript", [r"\btypescript\b", r"\bts\b"]),
        ("JavaScript", [r"\bjavascript\b", r"\bes6\b", r"\bnode\.?js\b"]),
        ("SQL / Database Management", [r"\bsql\b", r"\bpostgresql\b", r"\bpostgres\b", r"\bsqlite\b", r"\bmysql\b", r"\bdatabase\b"]),
        ("REST API Architecture", [r"\brest\b", r"\brestful\b", r"\bapi\s*design\b", r"\bapi\b"]),
        ("Automated Testing", [r"\btesting\b", r"\bpytest\b", r"\bjest\b", r"\bunit\s*tests?\b", r"\btdd\b", r"\bintegration\s*tests?\b"]),
        ("Git & Version Control", [r"\bgit\b", r"\bgithub\b", r"\bversion\s*control\b"]),
        ("Docker & Containerization", [r"\bdocker\b", r"\bcontainer\b", r"\bk8s\b", r"\bkubernetes\b"]),
        ("Cloud Infrastructure", [r"\baws\b", r"\bgcp\b", r"\bazure\b", r"\bcloud\b"]),
        ("CI/CD Automation", [r"\bci/cd\b", r"\bgithub\s*actions\b", r"\bpipelines?\b"]),
        ("Data Structures & Algorithms", [r"\balgorithms?\b", r"\bdata\s*structures?\b", r"\bsystem\s*design\b"]),
        ("Security & Authentication", [r"\bauth\b", r"\bjwt\b", r"\boauth\b", r"\bsecurity\b", r"\bargon2\b", r"\bhashing\b"]),
    ]

    lines = [line.strip() for line in job_text.splitlines() if line.strip()]
    
    extracted: List[ExtractedRequirementItem] = []
    found_skills = set()
    req_index = 1

    # First pass: look for bullet points or lines containing skill keywords
    for line in lines:
        if len(line) < 15 or len(line) > 300:
            continue

        lower_line = line.lower()
        for normalized_skill, patterns in skill_patterns:
            if normalized_skill in found_skills:
                continue

            for pat in patterns:
                if re.search(pat, lower_line):
                    # Check priority
                    is_preferred = bool(re.search(r"\b(prefer|plus|bonus|nice\s*to\s*have|optional|advantage)\b", lower_line))
                    priority = "preferred" if is_preferred else "required"
                    
                    extracted.append(
                        ExtractedRequirementItem(
                            id=f"REQ-{req_index}",
                            original_wording=line,
                            normalized_skill=normalized_skill,
                            priority_type=priority
                        )
                    )
                    found_skills.add(normalized_skill)
                    req_index += 1
                    break

            if len(extracted) >= 6:
                break
        if len(extracted) >= 6:
            break

    # If fewer than 4 found, look for general requirement sentences
    if len(extracted) < 4:
        for line in lines:
            if len(extracted) >= 6:
                break
            if len(line) < 20 or len(line) > 250:
                continue
            lower_line = line.lower()
            if any(term in lower_line for term in ["experience", "ability to", "knowledge of", "understanding", "proficient", "responsible for"]):
                # Ensure this line isn't already used
                if not any(item.original_wording == line for item in extracted):
                    skill_name = line[:40].strip()
                    if ":" in skill_name:
                        skill_name = skill_name.split(":")[0].strip()
                    extracted.append(
                        ExtractedRequirementItem(
                            id=f"REQ-{req_index}",
                            original_wording=line,
                            normalized_skill=skill_name or f"Technical Competency {req_index}",
                            priority_type="required"
                        )
                    )
                    req_index += 1

    # Final check: we require between 4 and 6 requirements grounded in text
    if not extracted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract technical requirements from the provided job text. Please ensure the job description lists required technical skills or responsibilities."
        )

    # Return top 4 to 6 items
    return extracted[:6]
