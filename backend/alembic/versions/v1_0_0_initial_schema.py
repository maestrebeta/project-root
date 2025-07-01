"""v1.0.0 initial schema

Revision ID: v1_0_0
Revises: 
Create Date: 2024-03-19 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import json

# revision identifiers, used by Alembic.
revision: str = 'v1_0_0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Estados predeterminados del sistema
default_task_states = {
    "states": [
        {"id": "pendiente", "label": "Pendiente", "icon": "🔴", "color": "red"},
        {"id": "en_progreso", "label": "En Progreso", "icon": "🔵", "color": "blue"},
        {"id": "completada", "label": "Completada", "icon": "🟢", "color": "green"}
    ],
    "default_state": "pendiente",
    "final_states": ["completada"]
}

default_work_hours = {
    "start_time": "08:00",
    "end_time": "17:00", 
    "lunch_break_start": "12:00",
    "lunch_break_end": "13:00",
    "working_days": [1, 2, 3, 4, 5],
    "daily_hours": 8,
    "effective_daily_hours": 7
}

def upgrade() -> None:
    # Crear tabla countries
    op.create_table(
        'countries',
        sa.Column('country_code', sa.String(length=2), nullable=False),
        sa.Column('country_name', sa.String(length=100), nullable=False),
        sa.Column('continent', sa.String(length=50), nullable=False),
        sa.Column('phone_code', sa.String(length=10), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=True),
        sa.Column('currency_symbol', sa.String(length=5), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('country_code')
    )

    # Crear tabla organizations
    op.create_table(
        'organizations',
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), unique=True, nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('country_code', sa.String(length=2), nullable=True),
        sa.Column('timezone', sa.String(length=50), server_default='UTC'),
        sa.Column('subscription_plan', sa.String(length=20), server_default='free'),
        sa.Column('max_users', sa.Integer(), server_default='5'),
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('primary_contact_email', sa.String(length=100), nullable=True),
        sa.Column('primary_contact_name', sa.String(length=100), nullable=True),
        sa.Column('primary_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('task_states', sa.JSON(), nullable=False, server_default=sa.text(f"'{json.dumps(default_task_states)}'")),
        sa.Column('work_hours_config', sa.JSON(), nullable=False, server_default=sa.text(f"'{json.dumps(default_work_hours)}'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('organization_id'),
        sa.ForeignKeyConstraint(['country_code'], ['countries.country_code'])
    )

    # Crear tabla clients
    op.create_table(
        'clients',
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.organization_id'), nullable=False),
        sa.Column('country_code', sa.String(length=2), sa.ForeignKey('countries.country_code'), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('tax_id', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('client_id'),
        sa.UniqueConstraint('name', 'organization_id', name='unique_client_name_per_organization')
    )

    # Crear tabla users (CONSOLIDADA con todos los campos de especialización)
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), unique=True, nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=100), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('profile_image', sa.Text(), nullable=True),
        sa.Column('theme_preferences', sa.JSON(), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.organization_id'), nullable=True),
        sa.Column('country_code', sa.String(2), nullable=True),
        sa.Column('timezone', sa.String(50), server_default='UTC'),
        sa.Column('language', sa.String(10), server_default='es'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        # CAMPOS DE ESPECIALIZACIÓN CONSOLIDADOS
        sa.Column('specialization', sa.String(50), nullable=True, server_default='development'),
        sa.Column('sub_specializations', sa.JSON(), nullable=True),
        sa.Column('hourly_rate', sa.Integer(), nullable=True),
        sa.Column('weekly_capacity', sa.Integer(), nullable=True, server_default='40'),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.CheckConstraint("role IN ('admin', 'dev', 'infra', 'super_user')", name='valid_user_roles'),
        sa.CheckConstraint("specialization IN ('development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis')", name='valid_specializations')
    )

    # Crear tabla projects
    op.create_table(
        'projects',
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), sa.ForeignKey('clients.client_id'), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), unique=True, nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('project_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('manager_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('priority', sa.String(length=20), server_default='medium'),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.organization_id'), nullable=True),
        sa.PrimaryKeyConstraint('project_id'),
        sa.UniqueConstraint('name', 'client_id', name='unique_project_client'),
        sa.CheckConstraint("project_type IN ('web_development', 'mobile_development', 'desktop_development', 'api_development', 'database_design', 'cloud_migration', 'devops_infrastructure', 'security_audit', 'ui_ux_design', 'testing_qa', 'maintenance_support', 'consulting', 'training', 'research_development', 'other')", name='projects_project_type_check'),
        sa.CheckConstraint("status IN ('registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support')", name='projects_status_check')
    )

    # Crear tabla project_organizations (relación muchos a muchos)
    op.create_table(
        'project_organizations',
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.project_id'), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.organization_id'), primary_key=True)
    )

    # Crear tabla tickets
    op.create_table(
        'tickets',
        sa.Column('ticket_id', sa.Integer(), nullable=False),
        sa.Column('ticket_number', sa.String(length=20), unique=True, nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.project_id'), nullable=False),
        sa.Column('client_id', sa.Integer(), sa.ForeignKey('clients.client_id'), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.organization_id'), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='medium'),
        sa.Column('reported_by_user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('assigned_to_user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolution_description', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('estimated_hours', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('ticket_id'),
        sa.CheckConstraint("status IN ('nuevo', 'en_progreso', 'listo_pruebas', 'cerrado')", name='valid_ticket_status'),
        sa.CheckConstraint("priority IN ('baja', 'media', 'alta', 'critica')", name='valid_ticket_priority')
    )

    # Crear tabla ticket_comments
    op.create_table(
        'ticket_comments',
        sa.Column('comment_id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.ticket_id'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('comment_text', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('comment_id')
    )

    # Crear tabla ticket_history
    op.create_table(
        'ticket_history',
        sa.Column('history_id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.ticket_id'), nullable=False),
        sa.Column('changed_by_user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('changed_field', sa.String(length=50), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('change_timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('history_id')
    )

    # Crear tabla invoices
    op.create_table(
        'invoices',
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), sa.ForeignKey('projects.project_id'), nullable=False),
        sa.Column('invoice_number', sa.String(length=50), unique=True, nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('payment_terms', sa.String(length=100), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('invoice_id'),
        sa.CheckConstraint("status IN ('draft', 'issued', 'paid', 'cancelled')", name='valid_invoice_status')
    )

    # Crear tabla payment_installments
    op.create_table(
        'payment_installments',
        sa.Column('installment_id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), sa.ForeignKey('invoices.invoice_id'), nullable=False),
        sa.Column('installment_number', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('paid_amount', sa.Numeric(precision=12, scale=2), server_default='0'),
        sa.Column('paid_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('installment_id'),
        sa.CheckConstraint("status IN ('pending', 'paid', 'overdue', 'cancelled')", name='valid_installment_status')
    )

    # Crear tabla payments
    op.create_table(
        'payments',
        sa.Column('payment_id', sa.Integer(), nullable=False),
        sa.Column('installment_id', sa.Integer(), sa.ForeignKey('payment_installments.installment_id'), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.Column('recorded_by_user_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('payment_id'),
        sa.CheckConstraint("payment_method IN ('transfer', 'check', 'cash', 'credit_card')", name='valid_payment_method')
    )

    # Crear tabla project_budgets
    op.create_table(
        'project_budgets',
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('estimated_hours', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('estimated_cost', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('budget_id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'])
    )

    # Crear tabla epics
    op.create_table(
        'epics',
        sa.Column('epic_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='backlog'),
        sa.Column('priority', sa.String(length=20), server_default='medium'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estimated_hours', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('actual_hours', sa.Numeric(precision=10, scale=2), nullable=True, server_default='0'),
        sa.Column('progress_percentage', sa.Numeric(precision=5, scale=2), nullable=True, server_default='0'),
        sa.Column('color', sa.String(length=7), nullable=True, server_default='#3B82F6'),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('acceptance_criteria', sa.Text(), nullable=True),
        sa.Column('business_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('epic_id'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id']),
        sa.CheckConstraint("status IN ('backlog', 'planning', 'in_progress', 'review', 'done', 'blocked')", name='valid_epic_status'),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high', 'critical')", name='valid_epic_priority')
    )

    # Crear tabla user_stories (CONSOLIDADA con estimated_hours)
    op.create_table(
        'user_stories',
        sa.Column('story_id', sa.Integer(), nullable=False),
        sa.Column('epic_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('acceptance_criteria', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='backlog'),
        sa.Column('priority', sa.String(length=20), server_default='medium'),
        # CAMPO ESTIMATED_HOURS CONSOLIDADO
        sa.Column('estimated_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='8'),
        # CAMPOS DE ESPECIALIZACIÓN CONSOLIDADOS
        sa.Column('specialization', sa.String(50), nullable=True, server_default='development'),
        sa.Column('sub_specializations', sa.JSON(), nullable=True),
        sa.Column('ui_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='0'),
        sa.Column('development_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='0'),
        sa.Column('testing_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='0'),
        sa.Column('documentation_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='0'),
        sa.Column('actual_hours', sa.Numeric(precision=8, scale=2), nullable=True, server_default='0'),
        sa.Column('assigned_user_id', sa.Integer(), nullable=True),
        sa.Column('sprint_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('checklist', sa.JSON(), nullable=True),
        sa.Column('comments', sa.JSON(), nullable=True),
        sa.Column('attachments', sa.JSON(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True, server_default='#10B981'),
        sa.Column('is_blocked', sa.Boolean(), server_default='false'),
        sa.Column('blocked_reason', sa.Text(), nullable=True),
        sa.Column('business_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('story_id'),
        sa.ForeignKeyConstraint(['epic_id'], ['epics.epic_id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id']),
        sa.ForeignKeyConstraint(['assigned_user_id'], ['users.user_id']),
        sa.CheckConstraint("status IN ('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'blocked')", name='valid_story_status'),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high', 'critical')", name='valid_story_priority'),
        # CONSTRAINT DE ESPECIALIZACIÓN CONSOLIDADO
        sa.CheckConstraint("specialization IN ('development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis')", name='valid_story_specializations')
    )

    # Crear tabla time_entries (CONSOLIDADA con entry_date y user_story_id)
    op.create_table(
        'time_entries',
        sa.Column('entry_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('ticket_id', sa.Integer(), nullable=True),
        sa.Column('user_story_id', sa.Integer(), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('entry_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('activity_type', sa.String(length=50), nullable=False, server_default='desarrollo'),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pendiente'),
        sa.Column('billable', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('duration_hours', sa.Numeric(5, 2), 
                  sa.Computed("""
                    CASE 
                        WHEN end_time IS NOT NULL AND start_time IS NOT NULL 
                        THEN (julianday(end_time) - julianday(start_time)) * 24
                        ELSE NULL 
                    END
                  """, persisted=True)),
        sa.PrimaryKeyConstraint('entry_id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id']),
        sa.ForeignKeyConstraint(['ticket_id'], ['tickets.ticket_id']),
        sa.ForeignKeyConstraint(['user_story_id'], ['user_stories.story_id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.organization_id'])
    )

    # Crear índices para optimizar consultas
    op.create_index('ix_time_entries_entry_id', 'time_entries', ['entry_id'])
    op.create_index('ix_time_entries_user_id', 'time_entries', ['user_id'])
    op.create_index('ix_time_entries_project_id', 'time_entries', ['project_id'])
    op.create_index('ix_time_entries_organization_id', 'time_entries', ['organization_id'])
    op.create_index('ix_time_entries_user_story_id', 'time_entries', ['user_story_id'])
    op.create_index('ix_projects_organization_id', 'projects', ['organization_id'])
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])
    op.create_index('ix_project_budgets_project_id', 'project_budgets', ['project_id'])
    op.create_index('ix_clients_organization_id', 'clients', ['organization_id'])
    op.create_index('ix_clients_client_id', 'clients', ['client_id'])
    op.create_index('ix_epics_project_id', 'epics', ['project_id'])
    op.create_index('ix_user_stories_epic_id', 'user_stories', ['epic_id'])
    op.create_index('ix_user_stories_project_id', 'user_stories', ['project_id'])
    op.create_index('ix_user_stories_assigned_user_id', 'user_stories', ['assigned_user_id'])

def downgrade() -> None:
    # Eliminar tablas en orden inverso
    op.drop_table('time_entries')
    op.drop_table('user_stories')
    op.drop_table('epics')
    op.drop_table('payments')
    op.drop_table('payment_installments')
    op.drop_table('invoices')
    op.drop_table('ticket_history')
    op.drop_table('ticket_comments')
    op.drop_table('tickets')
    op.drop_table('project_budgets')
    op.drop_table('project_organizations')
    op.drop_table('projects')
    op.drop_table('clients')
    op.drop_table('users')
    op.drop_table('organizations')
    op.drop_table('countries') 