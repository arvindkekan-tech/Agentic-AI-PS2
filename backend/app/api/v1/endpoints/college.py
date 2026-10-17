from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/college", tags=["College T&P Portal"])


class StudentBatchItem(BaseModel):
    id: str
    name: str
    roll_number: str
    department: str
    target_role: str
    readiness_tier: str  # "Tier 1: Placement Ready", "Tier 2: Near Ready", "Tier 3: In Remediation"
    evidence_score: int
    verified_citations: int
    top_skill_gap: str
    active_proof_tasks: int
    target_company: str


class SkillGapMetric(BaseModel):
    skill: str
    frequency_percentage: int
    unverified_students_count: int
    recommended_workshop: str


class CollegeDashboardResponse(BaseModel):
    institution_name: str
    batch_year: str
    total_students_registered: int
    placement_ready_percentage: int
    average_evidence_score: int
    top_skill_gaps: List[SkillGapMetric]
    students: List[StudentBatchItem]


@router.get("/dashboard", response_model=CollegeDashboardResponse, summary="Get college placement officer metrics")
def get_college_dashboard(db: Session = Depends(get_db)):
    users = db.query(User).all()

    students = [
        StudentBatchItem(
            id="std-1",
            name="Arvind Kekan",
            roll_number="CS22B041",
            department="Computer Science & Engineering",
            target_role="Full-Stack Platform Engineer",
            readiness_tier="Tier 1: Placement Ready",
            evidence_score=91,
            verified_citations=8,
            top_skill_gap="Kubernetes Orchestration",
            active_proof_tasks=2,
            target_company="Stripe / Razorpay"
        ),
        StudentBatchItem(
            id="std-2",
            name="Aarav Sharma",
            roll_number="CS22B012",
            department="Computer Science & Engineering",
            target_role="Full-Stack Platform Engineer",
            readiness_tier="Tier 1: Placement Ready",
            evidence_score=89,
            verified_citations=7,
            top_skill_gap="Docker Swarm",
            active_proof_tasks=1,
            target_company="Microsoft / Atlassian"
        ),
        StudentBatchItem(
            id="std-3",
            name="Sneha Patel",
            roll_number="IT22B088",
            department="Information Technology",
            target_role="Backend Systems Engineer",
            readiness_tier="Tier 2: Near Ready",
            evidence_score=78,
            verified_citations=5,
            top_skill_gap="Distributed Caching (Redis)",
            active_proof_tasks=3,
            target_company="Swiggy / Uber"
        ),
        StudentBatchItem(
            id="std-4",
            name="Karthik Raju",
            roll_number="CS22B056",
            department="Computer Science & Engineering",
            target_role="AI / ML Infrastructure Engineer",
            readiness_tier="Tier 2: Near Ready",
            evidence_score=74,
            verified_citations=4,
            top_skill_gap="GPU Kernels & PyTorch",
            active_proof_tasks=4,
            target_company="Anthropic / Cohere"
        ),
        StudentBatchItem(
            id="std-5",
            name="Meera Nambiar",
            roll_number="EC22B030",
            department="Electronics & Communication",
            target_role="Embedded Systems & IoT",
            readiness_tier="Tier 3: In Remediation",
            evidence_score=62,
            verified_citations=3,
            top_skill_gap="RTOS Memory Constraints",
            active_proof_tasks=5,
            target_company="Qualcomm / TI"
        )
    ]

    skill_gaps = [
        SkillGapMetric(
            skill="Container Orchestration (Docker / K8s)",
            frequency_percentage=64,
            unverified_students_count=142,
            recommended_workshop="Cloud-Native Packaging & Helm Deployments Lab"
        ),
        SkillGapMetric(
            skill="Distributed Caching & Event Queues",
            frequency_percentage=48,
            unverified_students_count=106,
            recommended_workshop="High-Throughput Pub/Sub and Kafka Fundamentals"
        ),
        SkillGapMetric(
            skill="Automated Integration & Regression Testing",
            frequency_percentage=36,
            unverified_students_count=80,
            recommended_workshop="PyTest & Vitest Test-Driven Development Bootcamp"
        ),
        SkillGapMetric(
            skill="Database Indexing & Idempotent Migrations",
            frequency_percentage=28,
            unverified_students_count=62,
            recommended_workshop="Production Relational Database Tuning Workshop"
        )
    ]

    return CollegeDashboardResponse(
        institution_name="National Institute of Technology (Kurukshetra Placement Division)",
        batch_year="Class of 2026",
        total_students_registered=220,
        placement_ready_percentage=76,
        average_evidence_score=81,
        top_skill_gaps=skill_gaps,
        students=students
    )


class SprintAssignmentCreate(BaseModel):
    target_batch: str
    skill: str
    due_date: str


@router.get("/skill-sprint/assignments", summary="List batch Skill Sprint assignments")
def list_batch_sprint_assignments(db: Session = Depends(get_db)):
    from app.models.career import SkillSprintAssignment
    assignments = db.query(SkillSprintAssignment).order_by(SkillSprintAssignment.created_at.desc()).all()
    out = []
    for a in assignments:
        out.append({
            "id": a.id,
            "target_batch": a.target_batch,
            "skill": a.skill,
            "due_date": a.due_date,
            "created_at": a.created_at.strftime("%Y-%m-%d"),
            "completion_rate": "84%",
            "status": "Active"
        })

    if not out:
        out = [
            {
                "id": "assign-seed-1",
                "target_batch": "Class of 2026 - CSE",
                "skill": "Python",
                "due_date": "2026-11-15",
                "created_at": "2026-10-10",
                "completion_rate": "92%",
                "status": "Completed"
            },
            {
                "id": "assign-seed-2",
                "target_batch": "Class of 2026 - CSE & IT",
                "skill": "SQL and databases",
                "due_date": "2026-11-30",
                "created_at": "2026-10-14",
                "completion_rate": "78%",
                "status": "Active"
            }
        ]
    return out


@router.post("/skill-sprint/assignments", summary="Assign Skill Sprint to student cohort")
def create_batch_sprint_assignment(data: SprintAssignmentCreate, db: Session = Depends(get_db)):
    import uuid
    from datetime import datetime, timezone
    from app.models.career import SkillSprintAssignment

    assignment = SkillSprintAssignment(
        id=str(uuid.uuid4()),
        assigned_by_user_id="tp-officer-session",
        target_batch=data.target_batch,
        skill=data.skill,
        due_date=data.due_date,
        created_at=datetime.now(timezone.utc)
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "id": assignment.id,
        "target_batch": assignment.target_batch,
        "skill": assignment.skill,
        "due_date": assignment.due_date,
        "status": "assigned",
        "message": f"Skill Sprint '{assignment.skill}' assigned to cohort {assignment.target_batch}."
    }


@router.get("/early-warning", summary="College Skill-Gap Early Warning telemetry")
def get_early_warning_report(db: Session = Depends(get_db)):
    return {
        "batch": "Class of 2026",
        "cohort_size": 220,
        "at_risk_count": 28,
        "early_warning_alerts": [
            {
                "id": "alert-1",
                "severity": "critical",
                "category": "Zero Repository Commits",
                "affected_students": 12,
                "impact": "Students have not committed verifiable code to inspected GitHub repositories in 30+ days.",
                "intervention": "Mandatory Hands-On Git Sprint and Proof Task Kickoff"
            },
            {
                "id": "alert-2",
                "severity": "high",
                "category": "Testing & Debugging Deficit",
                "affected_students": 34,
                "impact": "Low test branch coverage (<40%) across submitted backend projects.",
                "intervention": "PyTest & CI/CD Automated Testing Masterclass scheduled for Friday"
            },
            {
                "id": "alert-3",
                "severity": "medium",
                "category": "Cloud & Container Deployment Gap",
                "affected_students": 45,
                "impact": "Missing Dockerfile or docker-compose evidence in candidate portfolios.",
                "intervention": "Containerization Proof Task Challenge distributed via T&P"
            }
        ]
    }

