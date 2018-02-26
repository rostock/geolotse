"""empty message

Revision ID: c6519fdb9c66
Revises: b625bd3eb7fd
Create Date: 2018-02-26 09:52:32.365662

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c6519fdb9c66'
down_revision = 'b625bd3eb7fd'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('links_themes', sa.Column('feature_type', sa.String(length=255), nullable=True))
    op.add_column('links_themes', sa.Column('geometry_type', sa.String(length=255), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('links_themes', 'geometry_type')
    op.drop_column('links_themes', 'feature_type')
    # ### end Alembic commands ###
