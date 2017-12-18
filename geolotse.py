from alembic import op
from flask import abort, Flask, g, redirect, render_template, request, url_for
from flask_babel import Babel, format_date, format_datetime, gettext
from flask_cache import Cache
from flask_compress import Compress
from flask_bootstrap import Bootstrap
from flask_migrate import Migrate
from flask_sqlalchemy import Model, SQLAlchemy
from flask_sqlalchemy_cache import CachingQuery



# initialise application
app = Flask(__name__, static_url_path='/assets')



# import configurations from files
app.config.from_pyfile('secrets.py', silent = True)
app.config.from_pyfile('settings.py', silent = True)



# Jinja2 whitespace and indent control
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True



# initialise Babel, Bootstrap, Compress, SQLAlchemy, Migrate and Cache
babel = Babel(app)
Bootstrap(app)
Compress(app)
Model.query_class = CachingQuery
db = SQLAlchemy(app, session_options = {
  'query_cls': CachingQuery
})
migrate = Migrate(app, db)
cache = Cache(app, config = {
  'CACHE_TYPE': 'memcached',
  'CACHE_MEMCACHED_SERVERS': app.config['CACHE_MEMCACHED_SERVERS'],
  'CACHE_KEY_PREFIX': 'geolotse'
})



# initialise database
links_tags = db.Table(
  'links_tags',
  db.Column('link_id', db.Integer, db.ForeignKey('links.id'), primary_key = True),
  db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key = True)
)

links_sublinks = db.Table(
  'links_sublinks',
  db.Column('link_id', db.Integer, db.ForeignKey('links.id'), primary_key = True),
  db.Column('sublink_id', db.Integer, db.ForeignKey('sublinks.id'), primary_key = True)
)

situations_tags = db.Table(
  'situations_tags',
  db.Column('situation_id', db.Integer, db.ForeignKey('situations.id'), primary_key = True),
  db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key = True)
)

class Groups(db.Model):
  __tablename__ = 'groups'
  
  id = db.Column(db.Integer, primary_key = True)
  name = db.Column(db.String(255), unique = True, nullable = False)
  order = db.Column(db.SmallInteger, unique = True, nullable = False)
  
  def __init__(self, name, order):
    self.name = name
    self.order = order
  
  def __repr__(self):
    return '<groups id {}>'.format(self.id)

class Links(db.Model):
  __tablename__ = 'links'
  
  id = db.Column(db.Integer, primary_key = True)
  group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable = False)
  title = db.Column(db.String(255), nullable = False)
  link = db.Column(db.String(255), nullable = False)
  public = db.Column(db.Boolean, nullable = False)
  reachable = db.Column(db.Boolean, nullable = False)
  reachable_last_check = db.Column(db.DateTime(timezone = True), nullable = False)
  parent_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable = False)
  order = db.Column(db.SmallInteger, nullable = False)
  description = db.Column(db.Text, nullable = True)
  date = db.Column(db.Date, nullable = True)
  authorship_place = db.Column(db.ARRAY(db.String(255)), nullable = True)
  authorship_name = db.Column(db.ARRAY(db.String(255)), nullable = True)
  authorship_mail = db.Column(db.ARRAY(db.String(255)), nullable = True)
  inspire_annex_theme = db.Column(db.String(255), nullable = True)
  logo = db.Column(db.String(255), nullable = True)
  
  group = db.relationship('Groups', backref = db.backref('links', lazy = 'dynamic'))
  tags = db.relationship('Tags', secondary = links_tags, lazy = 'dynamic', backref = db.backref('links', lazy = 'dynamic'))
  parent = db.relationship('Links', backref = db.backref('links', lazy = 'dynamic'), remote_side = id)
  sublinks = db.relationship('Sublinks', secondary = links_sublinks, lazy = 'dynamic', backref = db.backref('sublinks', lazy = 'dynamic'))
  
  def __init__(self, group_id, title, link, public, reachable, reachable_last_check, parent_id, order, description, date, authorship_place, authorship_name, authorship_mail, inspire_annex_theme):
    self.group_id = group_id
    self.title = title
    self.link = link
    self.public = public
    self.reachable = reachable
    self.reachable_last_check = reachable_last_check
    self.parent_id = parent_id
    self.order = order
    self.description = description
    self.date = date
    self.authorship_place = authorship_place
    self.authorship_name = authorship_name
    self.authorship_mail = authorship_mail
    self.inspire_annex_theme = inspire_annex_theme
  
  def __repr__(self):
    return '<links id {}>'.format(self.id)
      
class Situations(db.Model):
  __tablename__ = 'situations'
  
  id = db.Column(db.Integer, primary_key = True)
  title = db.Column(db.String(255), unique = True, nullable = False)
  stars = db.Column(db.SmallInteger, nullable = False)
  
  tags = db.relationship('Tags', secondary = situations_tags, lazy = 'dynamic', backref = db.backref('situations', lazy = 'dynamic'))
  
  def __init__(self, title, stars):
    self.title = title
    self.stars = stars
  
  def __repr__(self):
    return '<situations id {}>'.format(self.id)

class Sublinks(db.Model):
  __tablename__ = 'sublinks'
  
  id = db.Column(db.Integer, primary_key = True)
  target_id = db.Column(db.Integer, db.ForeignKey('targets.id'), nullable = False)
  title = db.Column(db.String(255), nullable = False)
  link = db.Column(db.String(255), nullable = False)
  public = db.Column(db.Boolean, nullable = False)
  reachable = db.Column(db.Boolean, nullable = False)
  reachable_last_check = db.Column(db.DateTime(timezone = True), nullable = False)
  
  target = db.relationship('Targets', backref = db.backref('sublinks', lazy = 'dynamic'))
  
  def __init__(self, target_id, title, link, public, reachable, reachable_last_check):
    self.target_id = target_id
    self.title = title
    self.link = link
    self.public = public
    self.reachable = reachable
    self.reachable_last_check = reachable_last_check
  
  def __repr__(self):
    return '<sublinks id {}>'.format(self.id)
      
class Tags(db.Model):
  __tablename__ = 'tags'
  
  id = db.Column(db.Integer, primary_key = True)
  group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable = False)
  title = db.Column(db.String(255), nullable = False)
  auto = db.Column(db.Boolean, nullable = False)
  typifier = db.Column(db.Boolean, nullable = False)
  
  group = db.relationship('Groups', backref = db.backref('tags', lazy = 'dynamic'))
  
  def __init__(self, group_id, title, auto):
    self.group_id = group_id
    self.title = title
    self.auto = auto
    self.typifier = typifier
  
  def __repr__(self):
    return '<tags id {}>'.format(self.id)

class Targets(db.Model):
  __tablename__ = 'targets'
  
  id = db.Column(db.Integer, primary_key = True)
  name = db.Column(db.String(255), unique = True, nullable = False)
  
  def __init__(self, name):
    self.name = name
  
  def __repr__(self):
    return '<targets id {}>'.format(self.id)



# i18n and l10n: language
@babel.localeselector
def get_locale():
  return g.get('current_lang', app.config['BABEL_DEFAULT_LOCALE'])

@app.before_request
def before():
  if request.view_args and 'lang_code' in request.view_args:
    if request.view_args['lang_code'] not in app.config['LANGUAGES'].keys():
      return abort(404)
    g.current_lang = request.view_args['lang_code']
    request.view_args.pop('lang_code')
  else:
    g.current_lang = request.accept_languages.best_match(app.config['LANGUAGES'].keys())



# i18n and l10n: dates and times
def date_l10n(value, format = 'full'):
  if g.current_lang and g.current_lang == app.config['BABEL_DEFAULT_LOCALE']:
    if format == 'full':
      format = "EEEE, dd.MM.yyyy'"
    elif format == 'light':
      format = "dd.MM.yyyy"
  else:
    if format == 'full':
      format = "full"
    elif format == 'light':
      format = "short"
  return format_date(value, format)

def datetime_l10n(value, format = 'full'):
  if g.current_lang and g.current_lang == app.config['BABEL_DEFAULT_LOCALE']:
    if format == 'full':
      format = "EEEE, dd.MM.yyyy, HH:mm 'Uhr'"
    elif format == 'light':
      format = "dd.MM.yyyy, HH:mm"
  else:
    if format == 'full':
      format = "full"
    elif format == 'light':
      format = "short"
  return format_datetime(value, format)

app.jinja_env.filters['date_l10n'] = date_l10n
app.jinja_env.filters['datetime_l10n'] = datetime_l10n



# populate constants with database values before first request
@app.before_first_request
def populate_constants():   
  global GROUP_ID_DOCUMENTATION
  global GROUP_ID_DOWNLOAD
  global GROUP_ID_EXTERNAL
  global GROUP_ID_GEOSERVICE
  global TARGET_ID_METADATA
  global TARGET_ID_OPENDATA
  GROUP_ID_DOCUMENTATION = Groups.query.with_entities(Groups.id).filter_by(name = 'documentation').first()
  GROUP_ID_DOWNLOAD = Groups.query.with_entities(Groups.id).filter_by(name = 'download').first()
  GROUP_ID_EXTERNAL = Groups.query.with_entities(Groups.id).filter_by(name = 'external').first()
  GROUP_ID_GEOSERVICE = Groups.query.with_entities(Groups.id).filter_by(name = 'geoservice').first()
  TARGET_ID_METADATA = Targets.query.with_entities(Targets.id).filter_by(name = 'metadata').first()
  TARGET_ID_OPENDATA = Targets.query.with_entities(Targets.id).filter_by(name = 'opendata').first()



# database functions
@cache.memoize(timeout = 43200)
def get_external_tags():
  return Tags.query.filter_by(group_id = GROUP_ID_EXTERNAL).order_by(Tags.title).all()

@cache.memoize(timeout = 43200)
def get_geoservice_tags():
  return Tags.query.filter(Tags.group_id == GROUP_ID_GEOSERVICE, Tags.typifier == True).order_by(Tags.title).all()

@cache.memoize(timeout = 43200)
def get_groups():
  return Groups.query.with_entities(Groups.name).order_by(Groups.order).all()

@cache.memoize(timeout = 43200)
def get_link_children(parent_id = 1, with_parent = True):
  return Links.query.filter_by(parent_id = parent_id).order_by(Links.order).all() if with_parent == True else Links.query.filter(Links.parent_id == parent_id, Links.id != parent_id).order_by(Links.order).all()

@cache.memoize(timeout = 43200)
def get_link_children_tags(parent_id = 1, with_parent_tags = True):
  list = []
  tags = Tags.query.join(Links.tags).filter(Links.parent_id == parent_id, Tags.typifier == False).all() if with_parent_tags == True else Tags.query.join(Links.tags).filter(Links.parent_id == parent_id, Links.id != parent_id, Tags.typifier == False).all()
  for tag in tags:
    tag.title not in list and list.append(tag.title)
  list.sort()
  return tuple(list)

@cache.memoize(timeout = 43200)
def get_link_children_typifier_tags(parent_id = 1, with_parent_tags = True):
  list = []
  tags = Tags.query.join(Links.tags).filter(Links.parent_id == parent_id, Tags.typifier == True).all() if with_parent_tags == True else Tags.query.join(Links.tags).filter(Links.parent_id == parent_id, Links.id != parent_id, Tags.typifier == True).all()
  for tag in tags:
    list.append(tag.title)
  list.sort()
  return tuple(list)

@cache.memoize(timeout = 43200)
def get_link_metadata_sublink(id = 1):
  return Sublinks.query.join(Links.sublinks).filter(Links.id == id, Sublinks.target_id == TARGET_ID_METADATA).first()

@cache.memoize(timeout = 43200)
def get_link_opendata_sublink(id = 1):
  return Sublinks.query.join(Links.sublinks).filter(Links.id == id, Sublinks.target_id == TARGET_ID_OPENDATA).first()

@cache.memoize(timeout = 43200)
def get_link_typifier_tag(id = 1):
  return Tags.query.join(Links.tags).filter(Links.id == id, Tags.typifier == True).first()

@cache.memoize(timeout = 840)
def get_links_by_group_id(group_id = 1):
  return Links.query.filter_by(group_id = group_id).order_by(Links.title).all()

@cache.memoize(timeout = 43200)
def get_tag_links(id = 1):
  return Links.query.join(Links.tags).filter(Tags.id == id).order_by(Links.title).all()

app.jinja_env.filters['get_link_children'] = get_link_children
app.jinja_env.filters['get_link_children_tags'] = get_link_children_tags
app.jinja_env.filters['get_link_children_typifier_tags'] = get_link_children_typifier_tags
app.jinja_env.filters['get_link_typifier_tag'] = get_link_typifier_tag
app.jinja_env.filters['get_link_metadata_sublink'] = get_link_metadata_sublink
app.jinja_env.filters['get_link_opendata_sublink'] = get_link_opendata_sublink
app.jinja_env.filters['get_tag_links'] = get_tag_links



# routing and custom error handling
@app.route('/')
def index_without_lang_code():
  return redirect(url_for('index', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>')
def index():
  return render_template('index.html')

@app.route('/catalog')
def catalog_without_lang_code():
  return redirect(url_for('catalog', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/catalog')
def catalog():
  return render_template('catalog.html', subtitle = gettext(u'Katalog'), groups = get_groups(), documentation_links = get_links_by_group_id(GROUP_ID_DOCUMENTATION), download_links = get_links_by_group_id(GROUP_ID_DOWNLOAD), geoservice_links = get_links_by_group_id(GROUP_ID_GEOSERVICE), external_tags = get_external_tags(), geoservice_tags = get_geoservice_tags())

@app.route('/imprint')
def imprint_without_lang_code():
  return redirect(url_for('imprint', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/imprint')
def imprint():
  return render_template('imprint.html', subtitle = gettext(u'Impressum'))

@app.route('/privacy_policy')
def privacy_policy_without_lang_code():
  return redirect(url_for('privacy_policy', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/privacy_policy')
def privacy_policy():
  return render_template('privacy_policy.html', subtitle = gettext(u'Datenschutz'))

@app.route('/situations')
def situations_without_lang_code():
  return redirect(url_for('situations', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/situations')
def situations():
  return render_template('situations.html', subtitle = gettext(u'Lebenslagen'))

@app.route('/terms_of_use')
def terms_of_use_without_lang_code():
  return redirect(url_for('terms_of_use', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/terms_of_use')
def terms_of_use():
  return render_template('terms_of_use.html', subtitle = gettext(u'Nutzungsbedingungen'))

@app.errorhandler(403)
def error_403(error):
  return redirect(app.config['REDIRECT_URL_403'])

@app.errorhandler(404)
def error_404(error):
  return redirect(app.config['REDIRECT_URL_404'])

@app.errorhandler(410)
def error_410(error):
  return redirect(app.config['REDIRECT_URL_410'])

@app.errorhandler(500)
def error_500(error):
  return redirect(app.config['REDIRECT_URL_500'])

@app.errorhandler(501)
def error_501(error):
  return redirect(app.config['REDIRECT_URL_501'])

@app.errorhandler(502)
def error_502(error):
  return redirect(app.config['REDIRECT_URL_502'])

@app.errorhandler(503)
def error_503(error):
  return redirect(app.config['REDIRECT_URL_503'])
