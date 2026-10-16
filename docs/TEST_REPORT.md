# ProofPath — Phase 1 Test Report

**Branch:** `integration/phase1-release`  
**Execution Environment:** Windows 11 / Python 3.13.7 / Node.js 24 / Vite 8.3.4  
**Date:** October 16, 2026  
**Final Status:** **PASS**

---

## 1. Automated Test Suites Summary

| Test Suite | File | Tests Run | Passed | Failed | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Authentication & Tokens** | `backend/tests/test_auth.py` | 7 | 7 | 0 | **PASS** |
| **Job Requirement Extraction** | `backend/tests/test_jobs.py` | 5 | 5 | 0 | **PASS** |
| **Resume Ingestion & Parsing** | `backend/tests/test_resumes.py` | 4 | 4 | 0 | **PASS** |
| **Citation Deterministic Validator** | `backend/tests/test_citation_validator.py` | 6 | 6 | 0 | **PASS** |
| **End-to-End Assessment Pipeline** | `backend/tests/test_assessment.py` | 2 | 2 | 0 | **PASS** |
| **Watcher & Reassessment Engine** | `backend/tests/test_watcher.py` | 4 | 4 | 0 | **PASS** |
| **Monitoring & Webhook API** | `backend/tests/test_monitoring_api.py` | 5 | 5 | 0 | **PASS** |
| **TOTAL BACKEND TESTS** | `pytest backend/tests` | **33** | **33** | **0** | **100% PASS** |
| **Frontend Compilation & Types** | `npm run build --prefix frontend` | **1943 modules** | **All Built** | **0** | **PASS (790ms)** |

---

## 2. Test Execution Details & Exact Commands

### Command 1: Backend Automated Tests
```powershell
backend\.venv\Scripts\pytest backend\tests
```
**Outcome:**
```
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\ARVIND\Desktop\Kurukshetar26\kurukshetra-2026
collected 33 items

backend\tests\test_assessment.py ..                                      [  6%]
backend\tests\test_auth.py .......                                       [ 27%]
backend\tests\test_citation_validator.py ......                          [ 45%]
backend\tests\test_jobs.py .....                                         [ 60%]
backend\tests\test_monitoring_api.py .....                               [ 75%]
backend\tests\test_resumes.py ....                                       [ 87%]
backend\tests\test_watcher.py ....                                       [100%]

======================= 33 passed, 3 warnings in 12.52s =======================
```

### Command 2: Frontend Typecheck and Production Build
```powershell
npm run build --prefix frontend
```
**Outcome:**
```
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 1943 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.06 kB │ gzip:   0.60 kB
dist/assets/index-5gmDRTKp.css   41.01 kB │ gzip:   8.03 kB
dist/assets/index-BNRVzAH2.js   365.41 kB │ gzip: 103.83 kB

✓ built in 790ms
```

---

## 3. Mocked vs. Live Verification Matrix

To ensure full transparency:

| Verification Area | Mode | Verification Mechanism |
| :--- | :---: | :--- |
| **Job URL Ingestion & SSRF** | Unit (Mocked) | SSRF checks verify blocking of private IPs (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`). |
| **GitHub API Branch Head & Tree** | Unit (Mocked) & Live | Mocked in unit test suite (`test_watcher.py`, `test_monitoring_api.py`) to prevent rate-limit failures during CI. Live verified with GitHub REST API on `arvindkekan-tech/kurukshetra-2026`. |
| **Commit Polling Deduplication** | Deterministic Unit | Verified that identical branch head SHAs skip processing and produce zero duplicate change events. |
| **Automatic Reassessment** | Deterministic Unit | Verified that when a new commit is detected, a new Assessment is created, prior assessment preserved, and before/after status diff calculated. |
| **Citation Validation** | Deterministic Unit | Verified line-by-line verification against real file snapshots (SHA match, line range bounds, excerpt string containment). |
| **AI Provider** | Hybrid | Operates in deterministic rule mode when `GEMINI_API_KEY` is empty, and live Gemini API mode when key is supplied. |
| **Database Persistence** | Live SQLite | Tables created automatically upon startup; tested across session lifecycles. |

---

## 4. Requirement Verification Checklist

- [x] **Real Job Input & Pasted Text Fallback:** Verified in `test_jobs.py` (5 tests).
- [x] **Grounded Extraction of 4-6 Requirements:** Enforced and validated.
- [x] **Real GitHub Repository URL & Branch Validation:** Enforced in `github_service.py`.
- [x] **Exact Commit SHA Pinning & Snapshot Exclusions:** Binary, `.env`, dependency folders excluded; capped at 30 files / 50KB.
- [x] **Deterministic Citation Validation:** Tested in `test_citation_validator.py` (6 tests).
- [x] **Automatic Commit Detection & Watcher:** Background worker polls branch head SHA every 30s (`test_watcher.py`).
- [x] **Evidence Change Ledger:** Persisted in `change_events` table and rendered in UI with before/after status impact and file diffs.
- [x] **Historical Assessment Preservation:** Verified that new assessments do not overwrite or delete previous assessments.
- [x] **Failure Resilience:** Confirmed that a network error or rate-limit failure sets ChangeEvent status to `failed` without erasing previous successful assessments.
