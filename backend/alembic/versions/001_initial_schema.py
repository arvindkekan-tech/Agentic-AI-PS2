"""001_initial_schema_postgresql

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = '001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    insp = Inspector.from_engine(bind)
    return table_name in insp.get_table_names()


def upgrade() -> None:
    # 1. users
    if not table_exists('users'):
        op.create_table(
            'users',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true' if op.get_bind().dialect.name != 'sqlite' else '1')),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. jobs
    if not table_exists('jobs'):
        op.create_table(
            'jobs',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('company', sa.String(length=255), nullable=True),
            sa.Column('source_type', sa.String(length=50), nullable=False),
            sa.Column('source_url', sa.Text(), nullable=True),
            sa.Column('raw_text', sa.Text(), nullable=False),
            sa.Column('extracted_requirements_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_jobs_user_id'), 'jobs', ['user_id'], unique=False)

    # 3. resumes
    if not table_exists('resumes'):
        op.create_table(
            'resumes',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('safe_path', sa.String(length=500), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('mime_type', sa.String(length=100), nullable=False),
            sa.Column('extracted_text', sa.Text(), nullable=False),
            sa.Column('metadata_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_resumes_user_id'), 'resumes', ['user_id'], unique=False)

    # 4. repositories
    if not table_exists('repositories'):
        op.create_table(
            'repositories',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('repo_url', sa.String(length=500), nullable=False),
            sa.Column('owner', sa.String(length=100), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('branch', sa.String(length=100), nullable=False),
            sa.Column('analyzed_sha', sa.String(length=40), nullable=False),
            sa.Column('inspected_files_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('total_files_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('snapshot_metadata_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_repositories_user_id'), 'repositories', ['user_id'], unique=False)

    # 5. assessments
    if not table_exists('assessments'):
        op.create_table(
            'assessments',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('job_id', sa.String(length=36), nullable=False),
            sa.Column('resume_id', sa.String(length=36), nullable=False),
            sa.Column('repository_id', sa.String(length=36), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='partial_or_needs_review'),
            sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='completed'),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('provider_name', sa.String(length=50), nullable=False, server_default='deterministic'),
            sa.Column('model_name', sa.String(length=100), nullable=False, server_default='heuristic-v1'),
            sa.Column('summary_counts_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('compatibility_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('evidence_coverage', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('evidence_match_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('resume_alignment_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('scoring_metadata_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('recommendations_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('alignment_matrix_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('file_findings_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['resume_id'], ['resumes.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessments_job_id'), 'assessments', ['job_id'], unique=False)
        op.create_index(op.f('ix_assessments_repository_id'), 'assessments', ['repository_id'], unique=False)
        op.create_index(op.f('ix_assessments_resume_id'), 'assessments', ['resume_id'], unique=False)
        op.create_index(op.f('ix_assessments_user_id'), 'assessments', ['user_id'], unique=False)

    # 6. requirement_assessments
    if not table_exists('requirement_assessments'):
        op.create_table(
            'requirement_assessments',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('assessment_id', sa.String(length=36), nullable=False),
            sa.Column('requirement_id', sa.String(length=50), nullable=False),
            sa.Column('original_wording', sa.Text(), nullable=False),
            sa.Column('normalized_skill', sa.String(length=255), nullable=False),
            sa.Column('priority_type', sa.String(length=50), nullable=False, server_default='required'),
            sa.Column('weight', sa.Integer(), nullable=False, server_default='2'),
            sa.Column('resume_status', sa.String(length=50), nullable=False),
            sa.Column('resume_explanation', sa.Text(), nullable=False),
            sa.Column('repo_status', sa.String(length=50), nullable=False),
            sa.Column('repo_explanation', sa.Text(), nullable=False),
            sa.Column('combined_status', sa.String(length=50), nullable=False),
            sa.Column('combined_interpretation', sa.Text(), nullable=False),
            sa.Column('limitations_note', sa.Text(), nullable=False),
            sa.Column('improvement_action', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_requirement_assessments_assessment_id'), 'requirement_assessments', ['assessment_id'], unique=False)

    # 7. citations
    if not table_exists('citations'):
        op.create_table(
            'citations',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('requirement_assessment_id', sa.String(length=36), nullable=False),
            sa.Column('evidence_type', sa.String(length=50), nullable=False),
            sa.Column('repo_url', sa.String(length=500), nullable=True),
            sa.Column('branch', sa.String(length=100), nullable=True),
            sa.Column('commit_sha', sa.String(length=40), nullable=True),
            sa.Column('file_path', sa.String(length=500), nullable=True),
            sa.Column('start_line', sa.Integer(), nullable=True),
            sa.Column('end_line', sa.Integer(), nullable=True),
            sa.Column('excerpt', sa.Text(), nullable=False),
            sa.Column('commit_url', sa.String(length=1000), nullable=True),
            sa.Column('is_valid', sa.Boolean(), nullable=False, server_default=sa.text('false' if op.get_bind().dialect.name != 'sqlite' else '0')),
            sa.Column('validation_note', sa.Text(), nullable=False, server_default=''),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['requirement_assessment_id'], ['requirement_assessments.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_citations_requirement_assessment_id'), 'citations', ['requirement_assessment_id'], unique=False)

    # 8. quizzes
    if not table_exists('quizzes'):
        op.create_table(
            'quizzes',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('assessment_id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.Text(), nullable=False, server_default=''),
            sa.Column('total_questions', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quizzes_assessment_id'), 'quizzes', ['assessment_id'], unique=False)
        op.create_index(op.f('ix_quizzes_user_id'), 'quizzes', ['user_id'], unique=False)

    # 9. quiz_questions
    if not table_exists('quiz_questions'):
        op.create_table(
            'quiz_questions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('quiz_id', sa.String(length=36), nullable=False),
            sa.Column('requirement_id', sa.String(length=50), nullable=False),
            sa.Column('skill_name', sa.String(length=255), nullable=False),
            sa.Column('question_type', sa.String(length=50), nullable=False),
            sa.Column('difficulty', sa.String(length=50), nullable=False, server_default='medium'),
            sa.Column('question_text', sa.Text(), nullable=False),
            sa.Column('options_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('correct_answer', sa.Text(), nullable=False),
            sa.Column('scoring_rubric_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('explanation', sa.Text(), nullable=False, server_default=''),
            sa.Column('points', sa.Integer(), nullable=False, server_default='10'),
            sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
            sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quiz_questions_quiz_id'), 'quiz_questions', ['quiz_id'], unique=False)

    # 10. quiz_attempts
    if not table_exists('quiz_attempts'):
        op.create_table(
            'quiz_attempts',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('quiz_id', sa.String(length=36), nullable=False),
            sa.Column('assessment_id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=False),
            sa.Column('total_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('max_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('percentage', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('passed', sa.Boolean(), nullable=False, server_default=sa.text('false' if op.get_bind().dialect.name != 'sqlite' else '0')),
            sa.Column('mcq_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('written_score', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('feedback_summary', sa.Text(), nullable=False, server_default=''),
            sa.Column('skill_observations_json', sa.Text(), nullable=False, server_default='[]'),
            sa.Column('submitted_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quiz_attempts_assessment_id'), 'quiz_attempts', ['assessment_id'], unique=False)
        op.create_index(op.f('ix_quiz_attempts_quiz_id'), 'quiz_attempts', ['quiz_id'], unique=False)
        op.create_index(op.f('ix_quiz_attempts_user_id'), 'quiz_attempts', ['user_id'], unique=False)

    # 11. quiz_attempt_answers
    if not table_exists('quiz_attempt_answers'):
        op.create_table(
            'quiz_attempt_answers',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('attempt_id', sa.String(length=36), nullable=False),
            sa.Column('question_id', sa.String(length=36), nullable=False),
            sa.Column('user_answer', sa.Text(), nullable=False),
            sa.Column('is_correct', sa.Boolean(), nullable=True),
            sa.Column('score_awarded', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('max_points', sa.Float(), nullable=False, server_default='10.0'),
            sa.Column('evaluation_feedback', sa.Text(), nullable=False, server_default=''),
            sa.Column('rubric_breakdown_json', sa.Text(), nullable=False, server_default='{}'),
            sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['question_id'], ['quiz_questions.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_quiz_attempt_answers_attempt_id'), 'quiz_attempt_answers', ['attempt_id'], unique=False)
        op.create_index(op.f('ix_quiz_attempt_answers_question_id'), 'quiz_attempt_answers', ['question_id'], unique=False)

    # 12. knowledge_documents
    if not table_exists('knowledge_documents'):
        op.create_table(
            'knowledge_documents',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('user_id', sa.String(length=36), nullable=True),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('source_url', sa.Text(), nullable=True),
            sa.Column('source_type', sa.String(length=50), nullable=False, server_default='system_curated'),
            sa.Column('content_hash', sa.String(length=64), nullable=False),
            sa.Column('raw_text', sa.Text(), nullable=False),
            sa.Column('chunks_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_knowledge_documents_content_hash'), 'knowledge_documents', ['content_hash'], unique=True)
        op.create_index(op.f('ix_knowledge_documents_user_id'), 'knowledge_documents', ['user_id'], unique=False)

    # 13. knowledge_chunks
    if not table_exists('knowledge_chunks'):
        op.create_table(
            'knowledge_chunks',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('document_id', sa.String(length=36), nullable=False),
            sa.Column('chunk_index', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('chunk_text', sa.Text(), nullable=False),
            sa.Column('metadata_json', sa.Text(), nullable=False, server_default='{}'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['document_id'], ['knowledge_documents.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_knowledge_chunk_doc_idx', 'knowledge_chunks', ['document_id', 'chunk_index'], unique=False)
        op.create_index(op.f('ix_knowledge_chunks_document_id'), 'knowledge_chunks', ['document_id'], unique=False)


def downgrade() -> None:
    for tbl in [
        'quiz_attempt_answers', 'quiz_attempts', 'quiz_questions', 'quizzes',
        'knowledge_chunks', 'knowledge_documents',
        'citations', 'requirement_assessments', 'assessments',
        'repositories', 'resumes', 'jobs', 'users'
    ]:
        if table_exists(tbl):
            op.drop_table(tbl)
