# ProofPath (Phase 1)
> **“Your code tells a story. Make the evidence visible.”**

ProofPath is a developer-intelligence platform that performs rigorous, multi-source evidence audits. It compares three distinct sources of truth:
1. **Job Requirements:** What the employer specifically asks for.
2. **Résumé Claims:** What the applicant explicitly documents.
3. **Repository Evidence:** What the analyzed GitHub source code actually demonstrates.

---

## 1. Core Principles & Philosophy

ProofPath adheres to strict evaluation integrity:
* **Never conflate findings:**
  * A missing résumé mention **does not prove** a missing skill.
  * A skill not found in the inspected repository **does not prove** the candidate lacks it.
  * A dependency or README mention alone **does not establish** implementation.
* **Rigorous Status Taxonomy:**
  * `demonstrated`: Validated by verifiable code citations.
  * `partial_or_needs_review`: Partially visible in test code, configurations, or résumé claims without deep runtime code.
  * `not_demonstrated_in_analyzed_scope`: Absent from the analyzed files.
  * `unable_to_assess`: Conflicting or insufficient data.
* **Deterministic Citation Verification:**
  * Every repository citation is verified against the exact commit SHA, file path, line numbers, and excerpt.
  * A `demonstrated` repository status strictly requires at least one validated supporting citation. Zero-evidence claims are automatically downgraded to `partial_or_needs_review`.
* **Safe Ingestion & Isolation:**
  * SSRF protection blocks private network access (RFC 1918), loopback, link-local metadata services, and unsafe redirect chains.
  * Bounded repository snapshots exclude binaries, node_modules, lockfiles, and oversized files (>50KB). Untrusted repository code is **never executed**.

---

## 2. System Architecture

```
kurukshetra-2026/
├── backend/
│   ├── app/
│   │   ├── ai/                      # AI provider adapters (Gemini + Deterministic fallback)
│   │   ├── api/v1/endpoints/        # REST API endpoints (health, auth, jobs, resumes, repos, assessments)
│   │   ├── core/                    # Security (Argon2, JWT), Config, Error handling
│   │   ├── db/                      # SQLAlchemy session and schema initialization
│   │   ├── models/                  # Database models (User, Job, Resume, Repository, Assessment, Citation)
│   │   ├── schemas/                 # Pydantic request and response schemas
│   │   ├── services/                # Domain services (Auth, Job SSRF Ingestion, Resume Parser, GitHub Client, Citation Validator)
│   │   └── main.py                  # FastAPI application entrypoint with CORS and routers
│   ├── tests/                       # Automated pytest suite (24 unit and integration tests)
│   ├── uploads/                     # Isolated local file storage for uploaded résumés
│   ├── proofpath.db                 # SQLite local database (gitignored)
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI (Navbar, StatusBadge, CodeCitationCard, CoverageModal)
│   │   ├── context/                 # AuthContext (JWT session state)
│   │   ├── pages/                   # Views (Landing, Login, Register, Dashboard, Wizard, Result, History)
│   │   ├── services/                # Typed API client
│   │   ├── types/                   # Schema-aligned TypeScript definitions
│   │   ├── index.css                # Tailwind CSS v4 design tokens (Obsidian, Lime, Graphite, Ivory)
│   │   └── App.tsx                  # Router with ProtectedRoute wrapper
│   ├── package.json
│   └── vite.config.ts               # Vite configuration with Tailwind CSS and /api proxy
├── .env.example                     # Committed environment configuration with placeholders
├── .gitignore                       # Git ignore rules for Python, Node, SQLite, and secrets
└── README.md
```

---

## 3. Quickstart & Local Setup

### Prerequisites
* **Python:** 3.10+ (tested on Python 3.12)
* **Node.js:** v18+ (tested on Node v24)
* **Git:** 2.30+

### Backend Setup
1. Open a terminal in the project root:
   ```bash
   # Create and activate virtual environment
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Configure environment:
   ```bash
   # Copy example environment configuration
   cp .env.example .env
   ```
   *(Optional)* Configure `GEMINI_API_KEY` for live AI analysis or leave blank to utilize the built-in deterministic rule engine.
4. Run the backend server:
   ```bash
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```
   * Interactive API docs: `http://localhost:8000/docs`
   * Health check: `http://localhost:8000/api/v1/health`

### Frontend Setup
1. In a separate terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/health` | Service and database health check | No |
| `POST` | `/api/v1/auth/register` | Register new user with Argon2 password hashing | No |
| `POST` | `/api/v1/auth/login` | Authenticate user and receive signed JWT session token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/v1/jobs/import` | Ingest job description from URL or pasted text | Yes |
| `GET` | `/api/v1/jobs` | List imported jobs for current user | Yes |
| `POST` | `/api/v1/resumes` | Upload and extract text from PDF or DOCX résumé | Yes |
| `GET` | `/api/v1/resumes` | List uploaded résumés for current user | Yes |
| `POST` | `/api/v1/repositories` | Inspect GitHub repository and fetch bounded file snapshot | Yes |
| `GET` | `/api/v1/repositories` | List inspected repositories for current user | Yes |
| `POST` | `/api/v1/assessments` | Execute end-to-end multi-source evidence assessment | Yes |
| `GET` | `/api/v1/assessments` | List all historical assessments for current user | Yes |
| `GET` | `/api/v1/assessments/{id}` | Retrieve comprehensive assessment findings & citations | Yes |
| `GET` | `/api/v1/assessments/{id}/evidence` | Retrieve citation verification report and snapshot SHA | Yes |

---

## 5. Automated Testing & Verification

### Running Backend Tests
Execute pytest across the 24 automated unit and integration tests:
```bash
.\.venv\Scripts\pytest backend\tests -v
```
**Test Coverage Includes:**
* User registration, password hashing (Argon2), login, and session validation.
* Resource ownership barriers (User A cannot access User B's jobs, résumés, or assessments).
* SSRF prevention (blocking localhost, 127.0.0.1, 10.0.0.0/8, 169.254.169.254, non-HTTP schemes).
* Job requirement extraction from pasted text and public postings.
* Résumé parsing (PDF and DOCX extraction, empty file rejection, size limits).
* Deterministic citation validator (SHA verification, line bounds, exact excerpt match).
* Status downgrade rule enforcement (downgrading 'demonstrated' if valid citations are absent).
* End-to-end assessment execution, persistence, and preservation of prior results on error.

### Running Frontend Typechecks & Build
```bash
cd frontend
npm run build
```
Executes `tsc -b` and Vite production bundling to guarantee type safety and clean asset generation.

---

## 6. AI Provider Configuration

ProofPath includes a modular provider adapter:
* **Google Gemini Adapter (`GeminiProvider`):**
  * Uses structured JSON output with strict system constraints.
  * Treats job descriptions, résumés, and code as untrusted data (mitigates prompt injection).
  * Configure `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash` in `.env`.
* **Deterministic Rule Engine (`DeterministicProvider`):**
  * Automatically activates if `GEMINI_API_KEY` is not provided or during offline unit testing.
  * Performs exact token matching, extracts verified line spans, and assigns honest non-hallucinated citations.

---

## 7. Known Phase 1 Limitations & Phase 2 Roadmap

* **Phase 1 Scope:**
  * Focuses on public GitHub repositories.
  * Snapshot bounded to top 30 source files (<50KB each) to prevent rate exhaustion.
  * Static code analysis with deterministic citation verification.
* **Phase 2 Roadmap:**
  * Evidence Change Ledger tracking competency diffs across git commits over time.
  * GitHub App integration with Webhooks for automated commit-triggered reassessment.
  * Safe sandboxed test execution for verifying test passage claims.