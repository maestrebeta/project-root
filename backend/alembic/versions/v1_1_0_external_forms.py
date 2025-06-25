"""Add external forms table

Revision ID: v1_1_0_external_forms
Revises: v1_0_0_initial_schema
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'v1_1_0_external_forms'
down_revision = 'v1_0_0_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Crear tabla external_forms
    op.create_table(
        'external_forms',
        sa.Column('form_id', sa.Integer(), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('form_token', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False, server_default='Portal de Soporte'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('welcome_message', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('created_by_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('form_id'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.organization_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.UniqueConstraint('form_token', name='unique_form_token'),
        sa.UniqueConstraint('organization_id', 'is_active', name='unique_active_form_per_organization')
    )
    
    # Crear índices
    op.create_index(op.f('ix_external_forms_form_id'), 'external_forms', ['form_id'], unique=False)
    op.create_index(op.f('ix_external_forms_form_token'), 'external_forms', ['form_token'], unique=True)


def downgrade() -> None:
    # Eliminar índices
    op.drop_index(op.f('ix_external_forms_form_token'), table_name='external_forms')
    op.drop_index(op.f('ix_external_forms_form_id'), table_name='external_forms')
    
    # Eliminar tabla
    op.drop_table('external_forms') 