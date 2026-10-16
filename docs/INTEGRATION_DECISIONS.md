# ProofPath — Phase 1 Integration Decisions

This document outlines the architectural and engineering decisions made during the consolidation and delivery of ProofPath Phase 1 on release branch `integration/phase1-release`.

---

## 1. Context & Architectural Selection

During repository inspection, two branches were evaluated:
1. `feat/phase1-fullstack` (commit `f02c4e0`): Python 3.13 / FastAPI backend with SQLite/SQLAlchemy 2.0, Pydantic v2 schemas, Gemini adapter, deterministic citation validator, and React 19 / TypeScript / Vite 8 frontend.
2. `feat/phase1-tech-integration` (commit `9e64c32`): Experimental Node.js 24 / Express monorepo with `better-sqlite3`.

### Selected Stack: Python / FastAPI + React / TypeScript
* **Unified Pipeline:** FastAPI provides native asynchronous background tasks (`asyncio.create_task` within FastAPI lifespan) for server-side polling, typed Pydantic validation, and direct integration with file parsing libraries (`pypdf`, `python-docx`) without native compilation issues observed on Windows with Node SQLite addons.
* **Database & Persistence:** SQLite via SQLAlchemy 2.0 engine using static connection pooling and write-ahead logging (WAL) for thread safety.
* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide icons, and Vite 8 for fast sub-second bundle times.

---

## 2. Reused vs. Rejected Components

| Component | Base Source | Decision | Rationale |
| :--- | :--- | :--- | :--- |
| **Backend API Core** | `feat/phase1-fullstack` | **Reused & Extended** | 24 existing tests passed immediately; clean separation of schemas, models, and services. |
| **Change Detection Watcher** | *New Implementation* | **Implemented** | Missing on all earlier branches; built `watcher_service.py` to poll GitHub branch head, compare commit SHAs, and deduplicate events. |
| **Evidence Change Ledger (ECL)** | *New Implementation* | **Implemented** | Built `ChangeEvent` model, endpoints (`/api/v1/monitoring/*`), and frontend `EvidenceChangeLedger.tsx` component. |
| **Node.js Express Server** | `feat/phase1-tech-integration` | **Rejected for Release** | Duplicate architecture; native `better-sqlite3` build issues on Windows runtimes; Python FastAPI is the primary reported stack. |
| **Wizard & Onboarding UI** | `feat/phase1-fullstack` | **Reused & Preserved** | 4-step wizard with real GitHub URL validation, resume parsing, and requirement extraction. |
| **Citation Validator** | `feat/phase1-fullstack` | **Reused** | Deterministic audit of file path, exact SHA, line range, and verbatim excerpt. |

---

## 3. Core Workflow Architecture

```
[Student Entry] 
       │
       ▼
[Job Posting URL / Text] ──► Grounded Extraction of 4-6 Requirements
       │
       ▼
[Public GitHub Repo URL] ──► Branch & Head SHA Validation (GitHub REST API)
       │
       ▼
[Bounded Snapshot Fetch] ──► Excludes binaries, .env, node_modules (≤30 files, ≤50KB)
       │
       ▼
[AI / Rule Evaluation]   ──► Dual Provider (Gemini / Deterministic Heuristic)
       │
       ▼
[Citation Validation]    ──► Verifies exact SHA, file path, line numbers, excerpt
       │
       ▼
[Database Persistence]   ──► Stores Assessment, Requirements, Citations
       │
       ▼
[Server-Side Watcher]    ──► Background polling worker checks branch head SHA
       │
 ┌─────┴────────────────┐
 │ SHA Changed?         │
 └─────┬────────────────┘
       ├─ No ──► Wait interval (30s)
       └─ Yes ─► Record ChangeEvent (running)
                 Fetch commit diff & new snapshot
                 Reassess affected requirements
                 Deterministically re-verify citations
                 Preserve prior assessment & persist new assessment
                 Calculate Before/After status & evidence diff
                 Mark ChangeEvent (completed)
                 Update Evidence Change Ledger in UI
```

---

## 4. Key Design Decisions

### 4.1 Server-Side Polling over Browser Simulation
- **Decision:** All commit polling and comparison runs strictly on the backend via `watcher_service.py` inside FastAPI's lifespan loop.
- **Rationale:** Browser-based simulated timers fail when tabs close, violate requirements, and do not persist across restarts. Server-side tracking persists state in SQLite and survives client reloads.

### 4.2 Non-Destructive Automatic Reassessment
- **Decision:** When a new commit is detected, ProofPath creates a new `Assessment` record and links it to the `ChangeEvent`, rather than mutating or deleting previous assessment rows.
- **Rationale:** Preserves historical auditability and allows students to view before-and-after evidence side by side in the Evidence Change Ledger.

### 4.3 Deterministic Fallback & Zero Hallucinated Claims
- **Decision:** If no `GEMINI_API_KEY` is provided, ProofPath falls back to its deterministic rule engine and transparently labels the assessment provider as `deterministic` with model `rule-engine-v1`.
- **Rationale:** Never represents deterministic fallback as live LLM inference; satisfies strict requirement integrity.
