# ProofPath — Phase 1 Deployment Guide

This guide describes how to run and deploy ProofPath Phase 1 in local production, containerized, and cloud environments.

---

## 1. Environment Configuration

ProofPath reads configuration from environment variables or a `.env` file located at the repository root.

```bash
cp .env.example .env
```

### Essential Production Variables

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | *(Generate via `openssl rand -hex 32`)* | Used for JWT authentication signatures. |
| `DATABASE_URL` | `sqlite:////data/proofpath.db` or PostgreSQL URI | Connection string for persistent data storage. |
| `CORS_ORIGINS` | `["https://app.proofpath.dev"]` | Allowed frontend origins. |
| `GEMINI_API_KEY` | *(Your Google AI Studio Key)* | Enables live Gemini LLM requirement assessment. |
| `GITHUB_TOKEN` | *(GitHub Personal Access Token)* | Increases GitHub API rate limit from 60 to 5,000 req/hr. |
| `WATCHER_ENABLED` | `true` | Enables server-side polling for repository changes. |
| `WATCHER_POLL_INTERVAL_SECONDS` | `30` | Interval in seconds between commit checks. |

---

## 2. Local Production Run

### Backend (FastAPI + Uvicorn)
```powershell
# Navigate to backend and activate virtualenv
cd backend
.\.venv\Scripts\activate

# Run production Uvicorn server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

### Frontend (Static Distribution)
```powershell
# Build optimized static bundle
cd frontend
npm run build

# Serve bundle via local web server
npx serve dist -l 5173
```

---

## 3. Containerized Deployment (Docker Compose)

### Dockerfile (Root Multi-Stage)
```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend & Runner
FROM python:3.13-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist/

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

VOLUME ["/data", "/app/uploads"]
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  proofpath:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:////data/proofpath.db
      - SECRET_KEY=production_secret_key_here
      - WATCHER_ENABLED=true
      - WATCHER_POLL_INTERVAL_SECONDS=30
    volumes:
      - proofpath_data:/data
      - proofpath_uploads:/app/uploads
    restart: unless-stopped

volumes:
  proofpath_data:
  proofpath_uploads:
```

---

## 4. Health Checks & Verification

After startup, verify service health:
```bash
curl -f http://localhost:8000/api/v1/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "service": "ProofPath API",
  "version": "1.0.0"
}
```

Verify monitoring status:
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:8000/api/v1/monitoring/status/<REPO_ID>
```
