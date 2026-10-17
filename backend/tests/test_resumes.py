import io
import pytest
import docx
from pypdf import PdfWriter


def create_sample_docx_bytes() -> bytes:
    doc = docx.Document()
    doc.add_heading("Alex River - Senior Full Stack Engineer", level=1)
    doc.add_paragraph("Summary: Experienced software engineer specializing in Python, FastAPI, React, and TypeScript.")
    doc.add_paragraph("Experience: Built RESTful web APIs and microservices backed by PostgreSQL and SQLite databases.")
    doc.add_paragraph("Skills: Automated Testing with pytest, Git version control, Docker containerization, CI/CD.")
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()


def create_sample_pdf_bytes() -> bytes:
    # Minimal standard PDF stream
    writer = PdfWriter()
    # Add a blank page with text annotation or metadata
    page = writer.add_blank_page(width=612, height=792)
    # pypdf blank page doesn't have font stream unless drawn, but we can write synthetic PDF with content stream
    buffer = io.BytesIO()
    # Let's write a simple PDF raw format with a text stream
    pdf_raw = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n"
        b"4 0 obj<</Length 120>>stream\n"
        b"BT\n/F1 12 Tf\n100 700 Td\n(Alex River - Software Engineer with Python, FastAPI, React, and TypeScript expertise) Tj\nET\n"
        b"endstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000192 00000 n \n"
        b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n362\n%%EOF"
    )
    return pdf_raw


def test_upload_docx_resume_success(client, auth_headers):
    docx_bytes = create_sample_docx_bytes()
    files = {
        "file": ("resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 201
    data = res.json()
    assert data["filename"] == "resume.docx"
    assert data["word_count"] > 10
    assert "Python" in data["preview_text"]


def test_upload_empty_resume_fails(client, auth_headers):
    files = {
        "file": ("empty.pdf", b"", "application/pdf")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_upload_unsupported_file_fails(client, auth_headers):
    files = {
        "file": ("script.sh", b"#!/bin/bash\necho test", "text/plain")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 400
    assert "unsupported" in res.json()["detail"].lower()


def test_resume_ownership_isolation(client, auth_headers, second_auth_headers):
    docx_bytes = create_sample_docx_bytes()
    files = {
        "file": ("my_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    }
    res1 = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    resume1_id = res1.json()["id"]

    # User 2 lists resumes
    res2 = client.get("/api/v1/resumes", headers=second_auth_headers)
    assert res2.status_code == 200
    user2_resume_ids = [r["id"] for r in res2.json()]
    assert resume1_id not in user2_resume_ids

    # User 2 tries to fetch resume 1
    res3 = client.get(f"/api/v1/resumes/{resume1_id}", headers=second_auth_headers)
    assert res3.status_code == 404


def generate_valid_test_pdf_bytes() -> bytes:
    parts = [
        b'%PDF-1.4\n',
        b'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        b'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        b'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        b'4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    ]
    stream_content = (
        b'BT\n/F1 12 Tf\n50 700 Td\n'
        b'(Arvind Sharma - Full-Stack Platform Engineer) Tj\n0 -20 Td\n'
        b'(Email: arvind@example.com - github.com/arvindsharma) Tj\n0 -20 Td\n'
        b'(Skills: Python, FastAPI, React, TypeScript, SQL, Docker, Automated Testing) Tj\n0 -20 Td\n'
        b'(Education: Bachelor of Technology from National Institute of Technology, 2024) Tj\nET\n'
    )
    obj5 = b'5 0 obj\n<< /Length ' + str(len(stream_content)).encode() + b' >>\nstream\n' + stream_content + b'endstream\nendobj\n'
    parts.append(obj5)

    offsets = [0]
    cur = len(parts[0])
    for p in parts[1:]:
        offsets.append(cur)
        cur += len(p)

    xref = b'xref\n0 6\n0000000000 65535 f \n'
    for off in offsets[1:]:
        xref += f'{off:010d} 00000 n \n'.encode()

    trailer = b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + str(cur).encode() + b'\n%%EOF\n'
    return b''.join(parts) + xref + trailer


def test_upload_valid_pdf_and_parse_structured_profile(client, auth_headers):
    pdf_bytes = generate_valid_test_pdf_bytes()
    files = {
        "file": ("candidate_resume.pdf", pdf_bytes, "application/pdf")
    }
    res = client.post("/api/v1/resumes/upload-and-parse", headers=auth_headers, files=files)
    assert res.status_code == 201
    data = res.json()
    assert "resume" in data
    assert "parsed_profile" in data
    profile = data["parsed_profile"]
    assert profile["name"] == "Arvind Sharma"
    assert profile["email"] == "arvind@example.com"
    assert profile["github_username"] == "arvindsharma"
    skill_names = [s["name"] for s in profile["skills"]]
    assert "Python" in skill_names
    assert "React" in skill_names
    assert "FastAPI" in skill_names


def test_upload_pdf_missing_magic_bytes_fails(client, auth_headers):
    # Spoofed PDF file with invalid header
    corrupt_bytes = b"NOT_A_REAL_PDF_STREAM_1234567890"
    files = {
        "file": ("spoofed.pdf", corrupt_bytes, "application/pdf")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 400
    assert "missing the standard %pdf header" in res.json()["detail"].lower()


def test_upload_pdf_dangerous_script_rejected(client, auth_headers):
    # PDF containing dangerous executable triggers
    unsafe_bytes = b"%PDF-1.4\n1 0 obj<</Type/Action/S/JavaScript/JS (app.alert('exploit'))>>endobj\n%%EOF"
    files = {
        "file": ("unsafe.pdf", unsafe_bytes, "application/pdf")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 400
    assert "potentially unsafe embedded scripts" in res.json()["detail"].lower()


def test_upload_scanned_image_only_pdf_explains_ocr_unavailable(client, auth_headers):
    # PDF with blank/image-only page without text layer
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)
    scanned_bytes = buffer.getvalue()

    files = {
        "file": ("scanned_document.pdf", scanned_bytes, "application/pdf")
    }
    res = client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert "scanned or image-only" in detail.lower()
    assert "ocr extraction is currently unavailable" in detail.lower()
