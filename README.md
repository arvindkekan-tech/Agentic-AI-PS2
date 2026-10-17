# ProofPath — Evidence Intelligence Platform
> **"Your code tells a story. Make the evidence visible."**

ProofPath is a production-grade **career intelligence SaaS** built for the Kurukshetra 2026 Hackathon. It performs rigorous, zero-hallucination multi-source evidence audits by comparing three distinct sources of truth:

1. **Job Requirements** — What the employer specifically asks for, extracted from job postings or URLs
2. **Résumé Claims** — What the applicant explicitly documents (PDF / DOCX parsed)
3. **Repository Evidence** — What analyzed GitHub source code *actually* demonstrates (commit-pinned citations)

---

## Features

| Phase | Capability | Status |
|-------|-----------|--------|
| **Core** | JWT Authentication (Argon2 hashing, 24-hour tokens) | ✅ |
| **Phase 1** | Job ingestion (paste or SSRF-protected URL fetch) | ✅ |
| **Phase 1** | PDF/DOCX résumé parsing & safe storage | ✅ |
| **Phase 1** | GitHub repository snapshot inspection (commit-pinned, no code execution) | ✅ |
| **Phase 1** | Gemini 2.5 Flash AI evaluation with deterministic fallback | ✅ |
| **Phase 1** | Deterministic citation validation (SHA, file path, line, excerpt) | ✅ |
| **Phase 2** | 3-Way Alignment Matrix (Job ↔ Résumé ↔ Code) | ✅ |
| **Phase 2** | Actionable Recommendations with effort tiers & learning resources | ✅ |
| **Phase 2** | Compatibility / Evidence Coverage / Alignment scoring | ✅ |
| **Phase 2** | Evidence Change Ledger (compare two assessments for delta tracking) | ✅ |
| **Phase 2** | Job Discovery (multi-source job search + skill-match ranking) | ✅ |
| **Phase 3** | Personalized Skill Tests (MCQ + written, rubric grading, attempt history) | ✅ |
| **Phase 4** | Local RAG Knowledge Base (semantic chunked retrieval, no external calls) | ✅ |
| **UI** | Premium Blue/White Glassmorphism design system (Tailwind CSS v4) | ✅ |

---

## Architecture

```
kurukshetra-2026/
├── backend/
│   ├── app/
│   │   ├── ai/                      # AI provider factory (Gemini 2.5 Flash + deterministic fallback)
│   │   ├── api/v1/endpoints/        # REST API — auth, jobs, resumes, repositories, assessments,
│   │   │                            #             job-discovery, knowledge
│   │   ├── core/                    # Config (pydantic-settings), JWT security (Argon2 hash)
│   │   ├── db/                      # SQLAlchemy session + schema init + curated knowledge seeder
│   │   ├── models/                  # ORM: User, Job, Resume, Repository, Assessment,
│   │   │                            #       RequirementAssessment, Citation, Quiz, QuizQuestion,
│   │   │                            #       QuizAttempt, QuizAttemptAnswer, KnowledgeDocument,
│   │   │                            #       KnowledgeChunk
│   │   ├── schemas/                 # Pydantic request/response schemas (quiz, knowledge, assessment)
│   │   └── services/                # Auth, Job (SSRF), Resume, GitHub, CitationValidator,
│   │                                #  ScoringService, CareerIntelligence, ChangeLedger,
│   │                                #  QuizService, KnowledgeService, JobDiscovery
│   ├── tests/                       # 52 passing pytest unit & integration tests
│   ├── alembic/                     # Database migrations
│   ├── requirements.txt
│   └── uploads/                     # Isolated résumé file storage
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Navbar, StatusBadge, CodeCitationCard, CoverageModal,
│   │   │                            #  SkillRadarChart, PersonalizedQuizModal
│   │   ├── context/                 # AuthContext (JWT session + auto-expiry handling)
│   │   ├── pages/                   # Landing, Login, Register, Dashboard, Wizard (4-step),
│   │   │                            #  AssessmentResult, AssessmentHistory, JobDiscovery
│   │   ├── services/                # Typed ApiClient (all endpoints)
│   │   ├── types/                   # Schema-aligned TypeScript definitions
│   │   ├── index.css                # Tailwind v4 + glassmorphism utilities
│   │   └── App.tsx                  # BrowserRouter with ProtectedRoute wrapper
│   ├── package.json
│   └── vite.config.ts               # Vite + manual chunk splitting (vendor / icons)
│
├── docker-compose.yml               # Optional PostgreSQL + backend container setup
├── alembic.ini
└── .env                             # Local secrets (do NOT commit to production)
```

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+, Node.js 20+
- A virtual environment at `.venv/` (already configured)
- Gemini API key (optional — falls back to deterministic engine)
- GitHub Token (optional — increases GitHub API rate limit)

### 1. Backend

```powershell
# From the project root
.venv\Scripts\uvicorn app.main:app --reload --app-dir backend
```

The API will start at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`

### 2. Frontend

```powershell
cd frontend
npm run dev
```

The UI will start at `http://localhost:5173`. All `/api` requests are proxied to the backend automatically.

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
DATABASE_URL=sqlite:///./proofpath.db   # or PostgreSQL connection string
GEMINI_API_KEY=your_gemini_key
GITHUB_TOKEN=your_github_pat
SECRET_KEY=a_long_random_secret
```

---

## Running Tests

```powershell
# All 52 tests from project root
.venv\Scripts\pytest backend/tests/ -v

# Expected: 52 passed, 0 failed
```

---

## Core Principles

- **Never conflate findings**: A missing résumé mention does not prove a missing skill. A skill absent from the inspected repository snapshot does not prove the candidate lacks it.
- **Status taxonomy** (four states only):
  - `demonstrated` — Validated by verifiable commit-pinned code citations
  - `partial_or_needs_review` — Partially visible in config, tests, or résumé claims only
  - `not_demonstrated_in_analyzed_scope` — Absent from analyzed files within inspection limits
  - `unable_to_assess` — Conflicting or insufficient data
- **Deterministic citation enforcement**: Every citation is verified against SHA, file path, line range, and excerpt. Zero-evidence `demonstrated` statuses are automatically downgraded.
- **SSRF protection**: URL-based job ingestion blocks RFC 1918, loopback, link-local metadata services, and unsafe redirects.
- **Safe repo inspection**: Snapshots exclude binaries, `node_modules`, lockfiles, and files > 50 KB. Repository code is **never executed**.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, receive JWT |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/jobs/import` | Import job (paste or URL) |
| GET | `/api/v1/jobs` | List user's jobs |
| POST | `/api/v1/resumes` | Upload résumé (PDF/DOCX) |
| POST | `/api/v1/repositories` | Inspect GitHub repository |
| POST | `/api/v1/assessments` | Run full assessment |
| GET | `/api/v1/assessments/{id}` | Full audit with citations |
| GET | `/api/v1/assessments/{id}/evidence` | All validated citations |
| GET | `/api/v1/assessments/{id}/compare/{prev_id}` | Evidence Change Ledger |
| POST | `/api/v1/assessments/{id}/quiz/generate` | Generate personalized skill test |
| POST | `/api/v1/assessments/{id}/quiz/submit` | Submit and grade answers |
| GET | `/api/v1/assessments/{id}/quiz/attempts` | Past attempt history |
| GET | `/api/v1/job-discovery/search` | Search discovered jobs |
| POST | `/api/v1/job-discovery/match` | Match jobs to skills |
| POST | `/api/v1/knowledge/ingest` | Ingest knowledge document |
| GET | `/api/v1/knowledge/search` | RAG semantic search |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI + Uvicorn (ASGI) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (local) / PostgreSQL (production) |
| Auth | Argon2 password hashing + JWT (python-jose) |
| AI | Gemini 2.5 Flash (google-generativeai) |
| PDF Parsing | pdfplumber + python-docx |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Glassmorphism utilities |
| Charts | Recharts (Skill Radar) |
| Testing | pytest + FastAPI TestClient (52 tests) |

---

*Built with ❤️ for Kurukshetra 2026 Hackathon by the ProofPath team.*