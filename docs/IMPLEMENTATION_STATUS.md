# ProofPath 2.0 — Implementation Status

**Active Feature Branch:** `feat/proofpath-intelligence-v2`  
**Current Milestone Completed:** Milestone 2 (Real Job Source Ingestion and Web Scraping)  
**Last Updated:** October 17, 2026  
**Latest Commit SHA:** `470ecc9`

---

## 1. Actual Work Completed (Milestones 0 & 2)
### Milestone 0: Diagnose and Stabilize
1. **Diagnosed SQLite Watcher Failure:**
   - Isolated root cause: `proofpath.db` was created prior to the addition of repository monitoring columns (`last_checked_at`, `last_observed_head_sha`, `monitoring_enabled`, `monitoring_interval_seconds`). SQLAlchemy's `create_all` does not issue `ALTER TABLE` statements for pre-existing tables.
2. **Created Safe Backup:**
   - Preserved `proofpath.db` to `proofpath.db.backup_m0`. Verified existing records (`users: 1, jobs: 2, resumes: 2`) remained intact.
3. **Engineered Idempotent Migration Runner:**
   - Created `backend/app/db/migrations.py` with `run_schema_migrations(engine)`.
   - Uses SQLAlchemy `inspect` to detect missing columns on any model and safely execute `ALTER TABLE <table> ADD COLUMN ...`.
   - Updated `backend/app/db/init_db.py` to run migrations on startup before the background watcher initiates.
4. **Verified Migration on Real Database & In-Memory:**
   - Ran `init_db()` against `proofpath.db`; verified all 4 monitoring columns successfully added with zero data loss.
   - Authored and ran `backend/tests/test_migrations.py` validating column additions, default values, and idempotency across repeated runs.
5. **Verified Backend Health & Startup:**
   - Tested real FastAPI app startup with real SQLite database; verified HTTP 200 from `/api/v1/health` with healthy database status.

### Milestone 2: Real Job Source Ingestion & Web Scraping
1. **JSON-LD Schema Extraction:**
   - Added schema.org `JobPosting` parsing in `fetch_job_url_safely` in `backend/app/services/job_service.py` to extract high-fidelity structured titles, hiring organizations, and requirements before HTML stripping.
2. **Requirement Categorization & Source Traceability:**
   - Added `classify_requirement_type()` to classify skills into `technical_skill`, `framework`, `testing`, `architecture`, `database`, and `devops_infrastructure`.
   - Attached `source_excerpt` (verbatim excerpt from source), `extraction_method` (`json_ld`, `html_nlp`, or `pasted_nlp`), and `requirement_type` to each `ExtractedRequirementItem`.
3. **Candidate Requirement Review & Editing API:**
   - Added `PUT /api/v1/jobs/{job_id}/requirements` endpoint allowing candidates to review, reorder, adjust priority (`required` vs `preferred`), or refine wording prior to running repository code assessment.
4. **Automated Verification:**
   - Expanded `backend/tests/test_jobs.py` to verify requirement typing, excerpt preservation, and update endpoint.

---

## 2. Files & Services Changed
- `backend/app/schemas/job.py`: Added metadata fields to `ExtractedRequirementItem` and added `JobRequirementsUpdateRequest`.
- `backend/app/services/job_service.py`: Added JSON-LD parsing, type classification, and excerpt extraction.
- `backend/app/api/v1/endpoints/jobs.py`: Supported new return signatures, company extraction, and added `PUT /api/v1/jobs/{job_id}/requirements`.
- `backend/tests/test_jobs.py`: Added test coverage for metadata and PUT endpoint.
- `docs/IMPLEMENTATION_STATUS.md`: Updated status.

---

## 3. Tests Executed & Outcomes
- `backend\.venv\Scripts\pytest backend\tests`: **35 passed, 0 failed in 3.12s**
- `npm run build --prefix frontend`: **0 errors, built successfully**

---

## 4. Next Milestone
**Milestone 3: Evidence RAG and Code Intelligence**
