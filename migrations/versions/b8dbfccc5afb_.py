"""empty message

Revision ID: b8dbfccc5afb
Revises: 70662d04f881
Create Date: 2020-10-23 10:47:03.291913

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8dbfccc5afb'
down_revision = '70662d04f881'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index(op.f('ix_inspire_short'), 'inspire', ['short'], unique=False)
    op.create_index(op.f('ix_inspire_theme_de'), 'inspire', ['theme_de'], unique=False)
    op.create_index(op.f('ix_inspire_theme_en'), 'inspire', ['theme_en'], unique=False)
    op.create_index(op.f('ix_links_parent_id'), 'links', ['parent_id'], unique=False)
    op.create_index(op.f('ix_links_search'), 'links', ['search'], unique=False)
    op.create_index(op.f('ix_links_themes_top'), 'links_themes', ['top'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_links_themes_top'), table_name='links_themes')
    op.drop_index(op.f('ix_links_search'), table_name='links')
    op.drop_index(op.f('ix_links_parent_id'), table_name='links')
    op.drop_index(op.f('ix_inspire_theme_en'), table_name='inspire')
    op.drop_index(op.f('ix_inspire_theme_de'), table_name='inspire')
    op.drop_index(op.f('ix_inspire_short'), table_name='inspire')
    # ### end Alembic commands ###
