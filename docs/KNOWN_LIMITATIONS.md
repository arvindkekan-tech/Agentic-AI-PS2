# ProofPath — Phase 1 Known Limitations

This document provides transparent disclosure of known boundaries, architectural constraints, and operational limitations for ProofPath Phase 1.

---

## 1. GitHub API Rate Limits
* **Unauthenticated Requests:** The GitHub REST API imposes a strict ceiling of **60 requests per hour per IP** for unauthenticated requests.
* **Mitigation:** In local development and production, define `GITHUB_TOKEN` in `.env` using a GitHub Personal Access Token (classic or fine-grained with read-only repository permissions). This elevates the quota to **5,000 requests per hour**.
* **Error Handling:** When the GitHub quota is exhausted, ProofPath responds with HTTP `429 Too Many Requests` and a clear advisory message rather than crashing or simulating results.

---

## 2. Bounded Repository Snapshot Constraints
To prevent resource exhaustion and stay within LLM context windows:
* **File Count Limit:** Maximum of **30 source files** analyzed per repository snapshot. Priority is given to root source files and folders (`src/`, `app/`, `lib/`, `core/`, `test/`).
* **File Size Limit:** Files exceeding **50 KB** are excluded from snapshot content inspection.
* **Automatic Exclusions:**
  * Dependency and build folders (`node_modules/`, `.git/`, `dist/`, `build/`, `.venv/`, `__pycache__/`, `vendor/`).
  * Binary, font, audio, and video assets (`.png`, `.jpg`, `.pdf`, `.zip`, `.exe`, `.dll`, `.so`, etc.).
  * Lockfiles and environment configurations (`package-lock.json`, `poetry.lock`, `yarn.lock`, `.env*`).
* **Transparency:** All excluded files and reasons are recorded and accessible via the frontend **Coverage & Trust Audit Modal**.

---

## 3. Static Inspection Without Code Execution
* **Security Model:** ProofPath does **not** execute student code, install packages, or run tests inside arbitrary containers during snapshot inspection.
* **Implication:** Evaluations are based on static AST/pattern matching and semantic evidence analysis of source code, configurations, schemas, and test declarations.
* **Rule:** A dependency declaration or README claim alone is never sufficient evidence of implementation; verified line-level code citations are strictly required.

---

## 4. Runtime AI Engine & Offline Deterministic Fallback
* **Dual-Mode Architecture:**
  * When `GEMINI_API_KEY` is provided, live LLM analysis runs via Google Gemini with structured output validation.
  * When `GEMINI_API_KEY` is not provided or quota is exceeded, ProofPath falls back to its deterministic rule engine (`rule-engine-v1`).
* **Transparency:** The active provider (`gemini` vs `deterministic`) and model name are saved in the assessment record and shown on the UI. ProofPath never claims a deterministic result is live AI inference.

---

## 5. Polling Watcher vs. Webhooks in Local Environments
* **Server-Side Poller:** The default change detection mechanism is an asynchronous server-side background task (`WATCHER_POLL_INTERVAL_SECONDS=30`).
* **Webhooks:** A signed GitHub push webhook endpoint (`POST /api/v1/monitoring/webhook/github`) is implemented and tested. However, public GitHub servers cannot deliver webhooks to `http://localhost:8000` without an ingress tunnel (e.g. `ngrok`, `localtunnel`, or Cloudflare Tunnel). Polling is therefore the primary mechanism in local environments.

---

## 6. Single-Node Database Concurrency
* **SQLite Persistence:** ProofPath uses SQLite (`proofpath.db`) for local ease of setup and zero-dependency operation.
* **Production Recommendation:** For horizontally autoscaled deployments with multiple backend workers, configure a managed PostgreSQL instance via `DATABASE_URL=postgresql://user:pass@host:5432/proofpath`.
