# ProofPath 2.0 — Implementation Roadmap

This roadmap tracks engineering milestones from stabilization through AI/RAG intelligence, trust engine, and hackathon release candidate.

---

## Milestone Checklist

- [x] **Milestone 0: Diagnose and Stabilize the Existing Product**
  - [x] Identify root cause of SQLite `OperationalError: no such column: repositories.last_checked_at`
  - [x] Back up existing database (`proofpath.db.backup_m0`)
  - [x] Build safe, idempotent schema migration engine (`backend/app/db/migrations.py`)
  - [x] Execute migrations before repository watcher starts
  - [x] Preserve all existing users, jobs, resumes, and assessments
  - [x] Write and pass unit tests for migration engine (`test_migrations.py`)
  - [x] Verify backend startup and health check against real persistent database

- [x] **Milestone 1: Professional Product Design and Working UI**
  - [x] Warm, developer-intelligence aesthetic with accessible contrast and clean typography
  - [x] Reusable UI components: StatusBadge, CodeCitationCard, CoverageModal, TrustReportCard
  - [x] Student Dashboard, Requirement Review, Evidence Inspector, and Evidence Change Ledger
  - [x] Recruiter/Mentor Shared Assessment View with authorization isolation (`/shared/assessments/:id`)
  - [x] Responsive layout with zero dead buttons, instant link sharing, and full TypeScript typing

- [x] **Milestone 2: Real Job Source Ingestion and Web Scraping**
  - [x] Multi-mode ingestion: direct URL, JSON-LD structured JobPosting extraction, pasted text fallback
  - [x] SSRF security hardening: private IP blocking, redirect destination validation, timeout & size limits
  - [x] Grounded requirement extraction preserving source traceability (URL, excerpt, method)
  - [x] User review and editing of extracted requirements before assessment launch (`PUT /api/v1/jobs/{job_id}/requirements`)

- [x] **Milestone 3: Evidence RAG and Code Intelligence**
  - [x] AST and lexical code chunking preserving exact 1-based line numbers and metadata
  - [x] Deterministic keyword/symbol retrieval layer with provider interface for embeddings
  - [x] Bounded context construction: inject only relevant chunks into model prompt
  - [x] Structured evaluation schema conforming to strict Pydantic models
  - [x] Reproducible labeled evaluation test pack measuring precision and citation validity (`test_rag.py`)

- [x] **Milestone 4: Trust and Evidence Integrity Engine**
  - [x] Decoupled 5-dimensional trust report: Evidence Coverage, Citation Validity, Assessment Confidence, Provenance, and Integrity Signals
  - [x] Explainable integrity warning flags (e.g. unverified claims, commit inconsistencies)
  - [x] Transparent scoring formula with clear disclaimers (never a "fraud score" or honesty metric)
  - [x] Comprehensive test suite (`test_trust_engine.py`) covering all dimensions, unverified claims, and invalid citations

- [x] **Milestone 5: Automatic GitHub Change Detection & Evidence Change Ledger**
  - [x] Server-side polling worker with deduplication and backoff (`watcher_service.py`)
  - [x] Non-destructive reassessment of affected requirements upon commit detection
  - [x] Evidence Change Ledger before/after diff table in UI and API

- [x] **Milestone 6: AI Provider, API Key, and Usage Management**
  - [x] Google Gemini structured adapter with rate limit (429) & timeout handling
  - [x] Diagnostic endpoint (`GET /api/v1/health/ai`) reporting model status without exposing secrets
  - [x] Transparent deterministic heuristic fallback when unconfigured

- [x] **Milestone 7: Security, Data Quality, and Reliability**
  - [x] Ownership authorization verification across all endpoints
  - [x] Safe error messages preventing internal trace leaks or credential exposure
  - [x] Input size and content verification on files, URLs, and text inputs

- [ ] **Milestone 8: Integration and End-to-End Acceptance**
  - [x] Full automated test suite execution (52 backend tests passing, 0 errors in frontend build)
  - [ ] Live end-to-end acceptance run with real job URL and GitHub repository

- [ ] **Milestone 9: Deployment and Demo Readiness**
  - [x] Production build and bundle verification
  - [ ] 5-minute demo script and presentation checklist
