# geolotse

A landing page for organisations wanting to connect and integrate their various geodata, geodata services and geospatial applications

python -m flask db init

# Create an ad-hoc table to use for the insert statement.
groups_table = sa.table('groups',
sa.Column('id', sa.Integer()),
sa.Column('name', sa.String(length=255)),
sa.Column('order', sa.SmallInteger)
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
