# geolotse

A landing page for organisations wanting to connect and integrate their various geodata, geodata services and geospatial applications

!!! python -m flask db init

!!! only 1 tag per external link in db because only 1 (= first) will be used

# Create ad-hoc tables to use for the insert statements.
groups_table = sa.table('groups',
sa.Column('id', sa.Integer()),
sa.Column('name', sa.String(length=255)),
sa.Column('order', sa.SmallInteger)
)
targets_table = sa.table('targets',
sa.Column('id', sa.Integer()),
sa.Column('name', sa.String(length=255))
)
op.bulk_insert(groups_table, [
    { 'name': 'api', 'order': 3 },
    { 'name': 'application', 'order': 1 },
    { 'name': 'documentation', 'order': 5 },
    { 'name': 'download', 'order': 6 },
    { 'name': 'external', 'order': 7 },
    { 'name': 'geoservice', 'order': 4 },
    { 'name': 'helper', 'order': 2 }
  ]
)
op.bulk_insert(targets_table, [
    { 'name': 'geoportal' },
    { 'name': 'metadata' },
    { 'name': 'opendata' }
  ]
)
