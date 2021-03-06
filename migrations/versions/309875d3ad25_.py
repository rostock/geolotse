"""empty message

Revision ID: 309875d3ad25
Revises: 
Create Date: 2018-03-19 15:52:07.358797

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '309875d3ad25'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('links',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=False),
    sa.Column('category', sa.String(length=255), nullable=False),
    sa.Column('category_order', sa.SmallInteger(), nullable=False),
    sa.Column('group', sa.String(length=255), nullable=False),
    sa.Column('group_order', sa.SmallInteger(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('link', sa.String(length=255), nullable=False),
    sa.Column('public', sa.Boolean(), nullable=False),
    sa.Column('reachable', sa.Boolean(), nullable=False),
    sa.Column('reachable_last_check', sa.DateTime(timezone=True), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('date', sa.Date(), nullable=True),
    sa.Column('authorship_organisation', sa.ARRAY(sa.String(length=255)), nullable=True),
    sa.Column('authorship_name', sa.ARRAY(sa.String(length=255)), nullable=True),
    sa.Column('authorship_mail', sa.ARRAY(sa.String(length=255)), nullable=True),
    sa.Column('inspire_annex_theme', sa.String(length=255), nullable=True),
    sa.Column('logo', sa.String(length=255), nullable=True),
    sa.Column('search', sa.Boolean(), nullable=False),
    sa.Column('search_title', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['parent_id'], ['links.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_links_category'), 'links', ['category'], unique=False)
    op.create_index(op.f('ix_links_category_order'), 'links', ['category_order'], unique=False)
    op.create_index(op.f('ix_links_group'), 'links', ['group'], unique=False)
    op.create_index(op.f('ix_links_group_order'), 'links', ['group_order'], unique=False)
    op.create_table('sublinks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('target', sa.String(length=255), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('link', sa.String(), nullable=False),
    sa.Column('public', sa.Boolean(), nullable=False),
    sa.Column('reachable', sa.Boolean(), nullable=False),
    sa.Column('reachable_last_check', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sublinks_target'), 'sublinks', ['target'], unique=False)
    op.create_table('tags',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('auto', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('themes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('descriptive_tags', sa.ARRAY(sa.String(length=255)), nullable=True),
    sa.Column('icon', sa.String(length=255), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('title')
    )
    op.create_table('links_sublinks',
    sa.Column('link_id', sa.Integer(), nullable=False),
    sa.Column('sublink_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['link_id'], ['links.id'], ),
    sa.ForeignKeyConstraint(['sublink_id'], ['sublinks.id'], ),
    sa.PrimaryKeyConstraint('link_id', 'sublink_id')
    )
    op.create_table('links_tags',
    sa.Column('link_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['link_id'], ['links.id'], ),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
    sa.PrimaryKeyConstraint('link_id', 'tag_id')
    )
    op.create_table('links_themes',
    sa.Column('link_id', sa.Integer(), nullable=False),
    sa.Column('theme_id', sa.Integer(), nullable=False),
    sa.Column('top', sa.Boolean(), nullable=True),
    sa.Column('type', sa.String(length=255), nullable=True),
    sa.Column('layer', sa.String(length=255), nullable=True),
    sa.ForeignKeyConstraint(['link_id'], ['links.id'], ),
    sa.ForeignKeyConstraint(['theme_id'], ['themes.id'], ),
    sa.PrimaryKeyConstraint('link_id', 'theme_id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('links_themes')
    op.drop_table('links_tags')
    op.drop_table('links_sublinks')
    op.drop_table('themes')
    op.drop_table('tags')
    op.drop_index(op.f('ix_sublinks_target'), table_name='sublinks')
    op.drop_table('sublinks')
    op.drop_index(op.f('ix_links_group_order'), table_name='links')
    op.drop_index(op.f('ix_links_group'), table_name='links')
    op.drop_index(op.f('ix_links_category_order'), table_name='links')
    op.drop_index(op.f('ix_links_category'), table_name='links')
    op.drop_table('links')
    # ### end Alembic commands ###
