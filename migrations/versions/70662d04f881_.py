"""empty message

Revision ID: 70662d04f881
Revises: c8fd87091f51
Create Date: 2020-10-22 16:05:02.043464

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '70662d04f881'
down_revision = 'c8fd87091f51'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('temp_links_inspire')
    op.drop_table('temp_inspire')
    op.drop_index('ix_inspire_language', table_name='inspire')
    op.drop_column('inspire', 'language')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('inspire', sa.Column('language', sa.VARCHAR(length=2), autoincrement=False, nullable=False))
    op.create_index('ix_inspire_language', 'inspire', ['language'], unique=False)
    op.create_table('temp_inspire',
    sa.Column('ogc_fid', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('annex', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('link', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('short', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('language', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('theme', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('ogc_fid', name='temp_inspire_pkey')
    )
    op.create_table('temp_links_inspire',
    sa.Column('inspire_id', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('link_id', sa.INTEGER(), autoincrement=False, nullable=True)
    )
    # ### end Alembic commands ###
