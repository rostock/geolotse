"""empty message

Revision ID: bff45b5e0f97
Revises: 238b0d2909c8
Create Date: 2018-02-19 14:53:05.871626

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bff45b5e0f97'
down_revision = '238b0d2909c8'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('themes', sa.Column('icon', sa.String(length=255), nullable=True))
    op.drop_column('themes', 'stars')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('themes', sa.Column('stars', sa.SMALLINT(), autoincrement=False, nullable=False))
    op.drop_column('themes', 'icon')
    # ### end Alembic commands ###