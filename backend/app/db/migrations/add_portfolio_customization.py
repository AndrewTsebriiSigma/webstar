"""Add portfolio_customization column to profiles table.

Revision ID: add_portfolio_customization
Revises: 
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_portfolio_customization'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add portfolio_customization column to profiles table
    op.add_column('profiles', sa.Column('portfolio_customization', sa.String(), nullable=True))


def downgrade():
    # Remove portfolio_customization column
    op.drop_column('profiles', 'portfolio_customization')
