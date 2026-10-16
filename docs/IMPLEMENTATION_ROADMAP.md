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

- [ ] **Milestone 1: Professional Product Design and Working UI**
  - [ ] Refine palette: warm light background, deep slate/navy typography, restrained accents
  - [ ] Design reusable UI components: buttons, badges, tables, evidence cards, empty/error/loading states
  - [ ] Polish Student Dashboard, Requirement Review, Evidence Inspector, and Evidence Change Ledger
  - [ ] Implement Recruiter/Mentor Shared Assessment View with authorization barriers
  - [ ] Verify responsive layouts, accessible contrast, and zero dead buttons

- [ ] **Milestone 2: Real Job Source Ingestion and Web Scraping**
  - [ ] Multi-mode ingestion: direct URL, JSON-LD structured JobPosting extraction, pasted text fallback
  - [ ] SSRF security hardening: private IP blocking, redirect destination validation, timeout & size limits
  - [ ] Grounded requirement extraction preserving source traceability (URL, excerpt, method)
  - [ ] User review and editing of extracted requirements before assessment launch

- [ ] **Milestone 3: Evidence RAG and Code Intelligence**
  - [ ] AST and lexical code chunking preserving exact 1-based line numbers and metadata
  - [ ] Deterministic keyword/symbol retrieval layer with provider interface for embeddings
  - [ ] Bounded context construction: inject only relevant chunks into model prompt
  - [ ] Structured evaluation schema conforming to strict Pydantic models
  - [ ] Reproducible labeled evaluation test pack measuring F1, precision, and citation validity

- [ ] **Milestone 4: Trust and Evidence Integrity Engine**
  - [ ] Decoupled 5-dimensional trust report: Evidence Coverage, Citation Validity, Assessment Confidence, Provenance, and Integrity Signals
  - [ ] Explainable integrity warning flags (e.g. unverified claims, commit inconsistencies)
  - [ ] Transparent scoring formula with clear disclaimers (never a "fraud score")

- [ ] **Milestone 5: Automatic GitHub Change Detection & Evidence Change Ledger**
  - [ ] Server-side polling worker with deduplication and backoff
  - [ ] Non-destructive reassessment of affected requirements upon commit detection
  - [ ] Evidence Change Ledger before/after diff table in UI

- [ ] **Milestone 6: AI Provider, API Key, and Usage Management**
  - [ ] Google Gemini structured adapter with rate limit (429) & timeout handling
  - [ ] Diagnostic endpoint (`GET /api/v1/health/ai`) reporting model status without exposing secrets
  - [ ] Transparent deterministic heuristic fallback when unconfigured

- [ ] **Milestone 7: Security, Data Quality, and Reliability**
  - [ ] Ownership authorization verification across all endpoints
  - [ ] Safe error messages preventing internal trace leaks

- [ ] **Milestone 8: Integration and End-to-End Acceptance**
  - [ ] Full automated test suite execution (backend + frontend)
  - [ ] Live end-to-end acceptance run with real job URL and GitHub repository

- [ ] **Milestone 9: Deployment and Demo Readiness**
  - [ ] Production build and container verification
  - [ ] 5-minute demo script and presentation checklist
