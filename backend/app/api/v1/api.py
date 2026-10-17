from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, jobs, resumes, repositories, assessments, job_discovery, knowledge

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(resumes.router)
api_router.include_router(repositories.router)
api_router.include_router(assessments.router)
api_router.include_router(job_discovery.router)
api_router.include_router(knowledge.router)
