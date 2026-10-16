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
