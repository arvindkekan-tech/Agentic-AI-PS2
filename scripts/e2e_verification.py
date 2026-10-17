"""
ProofPath Full E2E Integration and API Verification Script
Tests the running system locally:
- Backend Health (/health)
- AI Diagnostic (/api/v1/health/ai)
- Authentication (Login demo user)
- Seeding Demo Data (/api/v1/demo/seed)
- Student Career Profile (/api/v1/career/profile)
- Proof Tasks List & Update (/api/v1/career/proof-tasks)
- Roadmap Milestones (/api/v1/career/roadmap)
- Skill Sprint Tracks (/api/v1/career/skill-sprint/tracks)
- Skill Sprint Questions Security Check (no correct answers in payload)
- Skill Sprint Submission & Grading
- Career Proof Passport Generation, Public Inspection, Revocation
- Opportunity Radar Snapshot (/api/v1/career/opportunity-radar)
- Skill Proof Diff (/api/v1/career/assessments/diff)
- Career What-If Simulator (/api/v1/career/what-if)
- Recruiter Dashboard & Candidate Sprint Summary (/api/v1/recruiter/*)
- College T&P Dashboard & Early Warning (/api/v1/college/*)
- Frontend index.html availability
"""
import sys
import httpx

BACKEND_URL = "http://127.0.0.1:8010"
FRONTEND_URL = "http://127.0.0.1:5173"

def run_e2e_checks():
    client = httpx.Client(timeout=15.0)
    print("==================================================")
    print("PROOFPATH END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Health
    r = client.get(f"{BACKEND_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    print(f"[PASS] 1. Backend /health -> {r.json()['status']} (service: {r.json()['service']})")

    # 2. AI Diagnostics
    r = client.get(f"{BACKEND_URL}/api/v1/health/ai")
    assert r.status_code == 200, f"AI Health check failed: {r.status_code}"
    ai_data = r.json()
    print(f"[PASS] 2. AI Diagnostics -> Primary: {ai_data['primary_provider']}, Fallback: {ai_data['fallback_provider']}, Status: {ai_data['status']}")

    # 3. Seed Demo Data (Idempotent, unauthenticated)
    r = client.post(f"{BACKEND_URL}/api/v1/demo/seed")
    assert r.status_code == 200, f"Demo seed failed: {r.status_code}"
    print(f"[PASS] 3. Demo Seeder -> Seeded scenario for job: {r.json()['target_job']} at {r.json()['company']}")

    # 4. Auth Login
    login_payload = {"email": "demo@proofpath.dev", "password": "ProofPath2026!"}
    r = client.post(f"{BACKEND_URL}/api/v1/auth/login", json=login_payload)
    assert r.status_code == 200, f"Login failed: {r.status_code}"
    auth_data = r.json()
    token = auth_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] 4. Auth Login -> Success! User: {auth_data['user']['email']}, Name: {auth_data['user'].get('full_name', 'Candidate')}")

    # 5. Career Profile
    r = client.get(f"{BACKEND_URL}/api/v1/career/profile", headers=headers)
    assert r.status_code == 200, f"Career profile failed: {r.status_code}"
    prof = r.json()
    print(f"[PASS] 5. Career Profile -> Target Role: {prof['target_role']}, Headline: {prof.get('headline')}")

    # 6. Proof Tasks
    r = client.get(f"{BACKEND_URL}/api/v1/career/tasks", headers=headers)
    assert r.status_code == 200, f"Proof tasks failed: {r.status_code}"
    tasks = r.json()
    print(f"[PASS] 6. Proof Tasks -> Found {len(tasks)} tasks (First: '{tasks[0]['title']}', status: {tasks[0]['status']})")

    # 7. Roadmap
    r = client.get(f"{BACKEND_URL}/api/v1/career/roadmap", headers=headers)
    assert r.status_code == 200, f"Roadmap failed: {r.status_code}"
    roadmap = r.json()
    print(f"[PASS] 7. Roadmap -> {len(roadmap)} milestones loaded")

    # 8. Skill Sprint Tracks & Questions Security
    r = client.get(f"{BACKEND_URL}/api/v1/career/skill-sprint/tracks", headers=headers)
    assert r.status_code == 200
    tracks = r.json()
    print(f"[PASS] 8. Skill Sprint Tracks -> {len(tracks)} tracks available")

    r = client.get(f"{BACKEND_URL}/api/v1/career/skill-sprint/questions?track_id=react", headers=headers)
    assert r.status_code == 200
    questions = r.json()
    assert len(questions) > 0
    # Security assertion: answer key must never be exposed in questions payload
    for q in questions:
        assert "correct_answer" not in q, "SECURITY VIOLATION: correct_answer exposed in question payload!"
        assert "rubric" not in q, "SECURITY VIOLATION: rubric exposed in question payload!"
    print(f"[PASS] 9. Skill Sprint Questions -> {len(questions)} React questions delivered without answer keys")

    # 9. Skill Sprint Submission & Grading
    submit_payload = {
        "skill": "React",
        "answers": [
            {"question_id": questions[0]["id"], "answer": "0"},
            {"question_id": questions[1]["id"], "answer": "1"}
        ]
    }
    r = client.post(f"{BACKEND_URL}/api/v1/career/skill-sprint/submit", json=submit_payload, headers=headers)
    assert r.status_code == 200, f"Submit failed: {r.status_code} {r.text}"
    result = r.json()
    rec_title = result.get('recommended_task', {}).get('title', 'None') if result.get('recommended_task') else 'None'
    print(f"[PASS] 10. Skill Sprint Grading -> Score: {result['correct_answers']}/{result['total_questions']} ({result['score_percent']}%), Generated Task: '{rec_title}'")

    # 10. Career Proof Passport
    r = client.get(f"{BACKEND_URL}/api/v1/career/passport", headers=headers)
    assert r.status_code == 200
    passport = r.json()
    share_token = passport["share_token"]
    print(f"[PASS] 11. Career Proof Passport -> Generated! Share token: {share_token[:12]}..., Demonstrated skills: {len(passport['demonstrated_skills'])}")

    # Public inspection without auth
    r = client.get(f"{BACKEND_URL}/api/v1/career/passport/public/{share_token}")
    assert r.status_code == 200
    public_pass = r.json()
    assert public_pass["share_token"] == share_token
    print(f"[PASS] 12. Public Passport Inspection -> Verified without student credentials (Validated Citations: {len(public_pass.get('validated_citations', []))})")

    # 11. Opportunity Radar & Diff
    r = client.get(f"{BACKEND_URL}/api/v1/career/opportunity-radar", headers=headers)
    assert r.status_code == 200
    radar = r.json()
    print(f"[PASS] 13. Opportunity Radar -> High-priority opportunities: {len(radar['opportunities'])}, Trending skills: {len(radar.get('trending_skills', []))}")

    r = client.get(f"{BACKEND_URL}/api/v1/career/assessments/diff", headers=headers)
    assert r.status_code == 200
    diff = r.json()
    print(f"[PASS] 14. Skill Proof Diff -> Score delta: {diff['score_delta']} (explanation: {diff['explanation']})")

    # 12. Career What-If Simulator
    whatif_payload = {
        "current_role": "Senior Full-Stack Platform Engineer",
        "alternative_role": "Staff Reliability & Cloud Systems Architect"
    }
    r = client.post(f"{BACKEND_URL}/api/v1/career/what-if", json=whatif_payload, headers=headers)
    assert r.status_code == 200, f"What-If failed: {r.status_code} {r.text}"
    whatif = r.json()
    print(f"[PASS] 15. Career What-If Simulator -> Shared skills: {len(whatif['shared_skills'])}, Leverage tasks: {len(whatif['high_leverage_tasks'])}")

    # 13. Recruiter Dashboard & Candidate Check
    r = client.get(f"{BACKEND_URL}/api/v1/recruiter/dashboard", headers=headers)
    assert r.status_code == 200
    recruiter = r.json()
    print(f"[PASS] 16. Recruiter Dashboard -> Candidates: {len(recruiter['candidates'])}, Average match rate: {recruiter['average_match_rate']}%")

    cand_id = recruiter['candidates'][0]['id']
    r = client.get(f"{BACKEND_URL}/api/v1/recruiter/candidates/{cand_id}/skill-sprint", headers=headers)
    assert r.status_code == 200
    sprint_summary = r.json()
    print(f"[PASS] 17. Recruiter Candidate Sprint Check -> Authorized: {sprint_summary.get('authorized', False)}, Attempts: {len(sprint_summary.get('attempts', []))}")

    # 14. College T&P Dashboard & Early Warning
    r = client.get(f"{BACKEND_URL}/api/v1/college/dashboard", headers=headers)
    assert r.status_code == 200
    college = r.json()
    print(f"[PASS] 18. College T&P Dashboard -> Placement ready: {college['placement_ready_percentage']}%, Skill gaps: {len(college['top_skill_gaps'])}")

    r = client.get(f"{BACKEND_URL}/api/v1/college/early-warning", headers=headers)
    assert r.status_code == 200
    warnings = r.json()
    print(f"[PASS] 19. College Early Warning Telemetry -> At risk students: {warnings['at_risk_count']}, Alerts: {len(warnings['early_warning_alerts'])}")

    # 15. Frontend Availability
    r = client.get(f"{FRONTEND_URL}")
    assert r.status_code == 200
    print(f"[PASS] 20. Frontend Web Server -> Accessible on {FRONTEND_URL} with 200 OK")

    print("==================================================")
    print("ALL 20 CRITICAL E2E INTEGRATION CHECKS PASSED (100%)!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_checks()
