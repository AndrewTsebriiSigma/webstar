"""Add location and banner_image to profiles table

Revision ID: add_location_banner
Revises: 
Create Date: 2025-12-28

"""
from alembic import op
import sqlalchemy as sa


def upgrade():
    # Add location and banner_image columns to profiles table
    op.add_column('profiles', sa.Column('location', sa.String(), nullable=True))
    op.add_column('profiles', sa.Column('banner_image', sa.String(), nullable=True))


def downgrade():
    # Remove location and banner_image columns
    op.drop_column('profiles', 'banner_image')
    op.drop_column('profiles', 'location')

