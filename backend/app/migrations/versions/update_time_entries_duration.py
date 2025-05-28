"""Update duration_hours column in time_entries

Revision ID: update_duration_hours
Revises: 
Create Date: 2024-05-26

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'update_duration_hours'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Modificar la columna duration_hours para que sea generada
    op.execute("""
    ALTER TABLE time_entries 
    ALTER COLUMN duration_hours 
    SET GENERATED ALWAYS AS (
        CASE
            WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
            ELSE NULL
        END
    ) STORED;
    """)

def downgrade():
    # Revertir la columna a su estado original
    op.execute("""
    ALTER TABLE time_entries 
    ALTER COLUMN duration_hours DROP EXPRESSION;
    """) 