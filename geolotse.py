# -*- coding: utf-8 -*-
from alembic import op
from flask import abort, Flask, g, jsonify, redirect, render_template, request, url_for
from flask_babel import Babel, format_date, format_datetime, gettext
from flask_cache import Cache
from flask_compress import Compress
from flask_bootstrap import Bootstrap
from flask_migrate import Migrate
from flask_sqlalchemy import Model, SQLAlchemy
from flask_sqlalchemy_cache import CachingQuery
from pysolr import Solr
from sqlalchemy import func
from user_agents import parse



# initialise application
app = Flask(__name__, static_url_path='/assets')



# import configurations from files
app.config.from_pyfile('secrets.py', silent = True)
app.config.from_pyfile('settings.py', silent = True)



# Jinja2 whitespace and indent control
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True



# initialise Babel, Bootstrap, Compress, SQLAlchemy, Migrate, Cache and Solr
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
solr = Solr(app.config['SOLR_URL'])



# initialise database
class Links(db.Model):
  __tablename__ = 'links'
  
  id = db.Column(db.Integer, primary_key = True)
  parent_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable = False)
  category = db.Column(db.String(255), nullable = False, index = True)
  category_order = db.Column(db.SmallInteger, nullable = False, index = True)
  group = db.Column(db.String(255), nullable = False, index = True)
  group_order = db.Column(db.SmallInteger, nullable = False, index = True)
  title = db.Column(db.String(255), nullable = False)
  link = db.Column(db.String(255), nullable = False)
  public = db.Column(db.Boolean, nullable = False)
  reachable = db.Column(db.Boolean, nullable = False)
  reachable_last_check = db.Column(db.DateTime(timezone = True), nullable = False)
  description = db.Column(db.Text, nullable = True)
  date = db.Column(db.Date, nullable = True)
  authorship_organisation = db.Column(db.ARRAY(db.String(255)), nullable = True)
  authorship_name = db.Column(db.ARRAY(db.String(255)), nullable = True)
  authorship_mail = db.Column(db.ARRAY(db.String(255)), nullable = True)
  inspire_annex_theme = db.Column(db.String(255), nullable = True)
  logo = db.Column(db.String(255), nullable = True)
  search = db.Column(db.Boolean, nullable = False)
  search_title = db.Column(db.String(255), nullable = True)
  
  parent = db.relationship('Links', backref = db.backref('links', lazy = 'dynamic'), remote_side = id)
  sublinks = db.relationship('Sublinks', secondary = 'links_sublinks', lazy = 'dynamic', backref = db.backref('links', lazy = 'dynamic'))
  tags = db.relationship('Tags', secondary = 'links_tags', lazy = 'dynamic', backref = db.backref('links', lazy = 'dynamic'))
  themes = db.relationship('Themes', secondary = 'links_themes', lazy = 'dynamic', backref = db.backref('links', lazy = 'dynamic'))
  
  link_theme = db.relationship('Links_Themes', lazy = 'subquery', uselist = False)
  
  def __init__(self, parent_id, category, category_order, group, group_order, title, link, public, reachable, reachable_last_check, description, date, authorship_organisation, authorship_name, authorship_mail, inspire_annex_theme, logo, search, search_title):
    self.parent_id = parent_id
    self.category = category
    self.category_order = category_order
    self.group = group
    self.group_order = group_order
    self.title = title
    self.link = link
    self.public = public
    self.reachable = reachable
    self.reachable_last_check = reachable_last_check
    self.description = description
    self.date = date
    self.authorship_organisation = authorship_organisation
    self.authorship_name = authorship_name
    self.authorship_mail = authorship_mail
    self.inspire_annex_theme = inspire_annex_theme
    self.logo = logo
    self.search = search
    self.search_title = search_title

class Sublinks(db.Model):
  __tablename__ = 'sublinks'
  
  id = db.Column(db.Integer, primary_key = True)
  target = db.Column(db.String(255), nullable = False, index = True)
  title = db.Column(db.String(255), nullable = False)
  link = db.Column(db.String, nullable = False)
  public = db.Column(db.Boolean, nullable = False)
  reachable = db.Column(db.Boolean, nullable = False)
  reachable_last_check = db.Column(db.DateTime(timezone = True), nullable = False)
  
  def __init__(self, target, title, link, public, reachable, reachable_last_check):
    self.target = target
    self.title = title
    self.link = link
    self.public = public
    self.reachable = reachable
    self.reachable_last_check = reachable_last_check
      
class Tags(db.Model):
  __tablename__ = 'tags'
  
  id = db.Column(db.Integer, primary_key = True)
  title = db.Column(db.String(255), nullable = False)
  auto = db.Column(db.Boolean, nullable = False)
  
  def __init__(self, title, auto):
    self.title = title
    self.auto = auto
      
class Themes(db.Model):
  __tablename__ = 'themes'
  
  id = db.Column(db.Integer, primary_key = True)
  title = db.Column(db.String(255), unique = True, nullable = False)
  descriptive_tags = db.Column(db.ARRAY(db.String(255)), nullable = True)
  icon = db.Column(db.String(255), nullable = True)
  
  def __init__(self, title, descriptive_tags, icon):
    self.title = title
    self.descriptive_tags = descriptive_tags
    self.icon = icon

class Links_Sublinks(db.Model):
  __tablename__ = 'links_sublinks'
  
  link_id = db.Column(db.Integer, db.ForeignKey('links.id'), primary_key = True)
  sublink_id = db.Column(db.Integer, db.ForeignKey('sublinks.id'), primary_key = True)
  
  def __init__(self, link_id, sublink_id):
    self.link_id = link_id
    self.sublink_id = sublink_id

class Links_Tags(db.Model):
  __tablename__ = 'links_tags'
  
  link_id = db.Column(db.Integer, db.ForeignKey('links.id'), primary_key = True)
  tag_id = db.Column(db.Integer, db.ForeignKey('tags.id'), primary_key = True)
  
  def __init__(self, link_id, tag_id):
    self.link_id = link_id
    self.tag_id = tag_id

class Links_Themes(db.Model):
  __tablename__ = 'links_themes'
  
  link_id = db.Column(db.Integer, db.ForeignKey('links.id'), primary_key = True)
  theme_id = db.Column(db.Integer, db.ForeignKey('themes.id'), primary_key = True)
  top = db.Column(db.Boolean, nullable = True)
  type = db.Column(db.String(255), nullable = True)
  layer = db.Column(db.String(255), nullable = True)
  
  def __init__(self, link_id, theme_id, top, type, layer):
    self.link_id = link_id
    self.theme_id = theme_id
    self.top = top
    self.type = type
    self.layer = layer



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



# clear cache before first request
@app.before_first_request
def clear_cache():
  cache.clear()



# database functions
@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_link_sublink(id = 1, target = 'geoportal'):
  return Sublinks.query.join(Links.sublinks).filter(Links.id == id, Sublinks.target == target).first()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_links(category = 'api', group_order = False):
  return Links.query.filter(Links.category == category).order_by(Links.group, Links.group_order, Links.title).all() if group_order == True else Links.query.filter(Links.category == category).order_by(Links.title).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_links_categories():
  return Links.query.with_entities(Links.category).group_by(Links.category, Links.category_order).order_by(Links.category_order).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_links_groups(category = 'api'):
  return Links.query.with_entities(Links.group).filter(Links.category == category).group_by(Links.group).order_by(Links.group).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_parent_link_children(parent_id = 1, search_only = False, include_parent_link = True):
  if search_only == True:
    return Links.query.filter(Links.parent_id == parent_id, Links.search == True).order_by(Links.group_order).all() if include_parent_link == True else Links.query.filter(Links.parent_id == parent_id, Links.id != parent_id, Links.search == True).order_by(Links.group_order).all()
  else:
    return Links.query.filter(Links.parent_id == parent_id).order_by(Links.group_order).all() if include_parent_link == True else Links.query.filter(Links.parent_id == parent_id, Links.id != parent_id).order_by(Links.group_order).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_parent_link_children_groups(parent_id = 1, include_parent_link_groups = True):
  return Links.query.filter(Links.parent_id == parent_id).order_by(Links.group).all() if include_parent_link_groups == True else Links.query.filter(Links.parent_id == parent_id, Links.id != parent_id).order_by(Links.group).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_parent_link_children_tags(parent_id = 1, include_parent_link_tags = True):
  list = []
  tags = Tags.query.join(Links.tags).filter(Links.parent_id == parent_id).all() if include_parent_link_tags == True else Tags.query.join(Links.tags).filter(Links.parent_id == parent_id, Links.id != parent_id).all()
  for tag in tags:
    tag.title not in list and list.append(tag.title)
  list.sort()
  return tuple(list)

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_parent_links(category = 'api', group_order = False):
  return Links.query.filter(Links.category == category, Links.id == Links.parent_id).order_by(Links.group, Links.title).all() if group_order == True else Links.query.filter(Links.category == category, Links.id == Links.parent_id).order_by(Links.title).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_tag_links(id = 1):
  return Links.query.join(Links.tags).filter(Tags.id == id).order_by(Links.title).all()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_theme_link(theme_id = 1, link_id = 1):
  return Links.query.join(Links.themes).filter(Themes.id == theme_id, Links.id == link_id).first()

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_theme_links(id = 1):
  links_non_geoservice = Links.query.join(Links.themes).filter(Themes.id == id, Links.category != 'geoservice').order_by(Links.category_order, Links.group, Links.title).all()
  links_geoservice = Links.query.join(Links.themes).filter(Themes.id == id, Links.category == 'geoservice').order_by(Links.title).all()
  return links_non_geoservice + links_geoservice

@cache.memoize(timeout = app.config['DEFAULT_CACHE_TIMEOUT'])
def get_themes():
  return Themes.query.order_by(func.random()).all()

app.jinja_env.filters['get_link_sublink'] = get_link_sublink
app.jinja_env.filters['get_parent_link_children'] = get_parent_link_children
app.jinja_env.filters['get_parent_link_children_groups'] = get_parent_link_children_groups
app.jinja_env.filters['get_parent_link_children_tags'] = get_parent_link_children_tags
app.jinja_env.filters['get_tag_links'] = get_tag_links



# routing and custom error handling
@app.route('/')
def index_without_lang_code():
  return redirect(url_for('index', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>')
def index():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('index.html', mobile = user_agent.is_mobile)

@app.route('/search')
def search_without_lang_code():
  if 'start' in request.args and 'rows' in request.args:
    return redirect(url_for('search', query = request.args['query'], start = request.args['start'], rows = request.args['rows'], lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))
  else:
    return redirect(url_for('search', query = request.args['query'], lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/search')
def search():
  query = '*' + request.args['query'].replace(' ', '* *') + '*'
  if 'start' in request.args and 'rows' in request.args:
    start = request.args['start']
    rows = request.args['rows']
  else:
    start = 0
    rows = 10
  results = solr.search(q = query, start = start, rows = rows, sort = 'category_order asc, title asc, group_order asc, id asc')
  data = []
  for result in results:
    item = { 'id': result['id']}
    item['database_id'] = result['database_id']
    item['category'] = result['category']
    if item['category'] == 'api':
      item['category_label'] = gettext(u'API (Programmierschnittstelle)')
    elif item['category'] == 'application':
      item['category_label'] = gettext(u'Anwendung')
    elif item['category'] == 'documentation':
      item['category_label'] = gettext(u'Dokumentation')
    elif item['category'] == 'download':
      item['category_label'] = gettext(u'Download')
    elif item['category'] == 'geoservice':
      item['category_label'] = gettext(u'Geodatendienst')
    elif item['category'] == 'theme':
      item['category_label'] = gettext(u'Thema')
    else:
      item['category_label'] = result['category']
    item['title'] = result['title']
    if 'link' in result:
      item['link'] = result['link']
    elif item['category'] == 'geoservice':
      item['link'] = url_for('catalog', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']) + '#geoservice-' + str(result['database_id'])
    elif item['category'] == 'theme':
      item['link'] = url_for('themes', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']) + '#theme-' + str(result['database_id'])
    else:
      item['link'] = ''
    item['public'] = result['public']
    if item['public'] == True:
      item['public_label'] = gettext(u'öffentlich zugänglich')
    else:
      item['public_label'] = gettext(u'nicht öffentlich zugänglich')
    data.append(item)
  return jsonify({
    'hits': results.hits,
    'results': data
  })

@app.route('/catalog')
def catalog_without_lang_code():
  return redirect(url_for('catalog', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/catalog')
def catalog():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('catalog.html', mobile = user_agent.is_mobile, subtitle = gettext(u'Katalog'), categories = get_links_categories(), api_links = get_parent_links('api', False), application_links = get_parent_links('application', True), documentation_links = get_parent_links('documentation', False), download_links = get_parent_links('download', False), external_links = get_links('external', True), form_links = get_links('form', True), geoservice_groups = get_links_groups('geoservice'), geoservice_links = get_parent_links('geoservice', False), helper_links = get_links('helper', True))

@app.route('/themes')
def themes_without_lang_code():
  return redirect(url_for('themes', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/themes')
def themes():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('themes.html', mobile = user_agent.is_mobile, subtitle = gettext(u'Themen'), citysdk_api_key = app.config['CITYSDK_API_KEY'], citysdk_api_target_link = app.config['CITYSDK_API_TARGET_LINK'], themes = get_themes())

@app.route('/offer')
def offer_without_lang_code():
  return redirect(url_for('offer', theme = request.args['theme'], id = request.args['id'], lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/offer')
def offer():
  theme = request.args['theme']
  id = request.args['id']
  link = get_theme_link(theme, id)
  data = []
  if link:
    item = { 'id': link.id}
    item['title'] = link.title
    item['link'] = link.link if link.category != 'geoservice' else url_for('catalog', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']) + '#geoservice-' + str(item['id'])
    item['map_link'] = link.link
    item['category'] = link.category
    if item['category'] == 'api':
      item['category_label'] = gettext(u'API (Programmierschnittstelle)')
    elif item['category'] == 'application':
      item['category_label'] = gettext(u'Anwendung')
    elif item['category'] == 'documentation':
      item['category_label'] = gettext(u'Dokumentation')
    elif item['category'] == 'download':
      item['category_label'] = gettext(u'Download')
    elif item['category'] == 'geoservice':
      item['category_label'] = gettext(u'Geodatendienst')
    else:
      item['category_label'] = link.category
    item['group'] = link.group
    item['group_order'] = link.group_order
    item['link_label'] = gettext(u'Link')
    if link.category == 'application':
      inner_links = get_parent_link_children(link.parent_id, True, True)
      inner_data = []
      for inner_link in inner_links:
        inner_item = { 'id': inner_link.id}
        inner_item['title'] = inner_link.search_title if inner_link.search_title else inner_link.group
        inner_item['link'] = inner_link.link
        inner_item['public'] = inner_link.public
        if inner_item['public'] == True:
          inner_item['public_label'] = gettext(u'öffentlich zugänglich')
        else:
          inner_item['public_label'] = gettext(u'nicht öffentlich zugänglich')
        inner_item['reachable'] = inner_link.reachable
        if inner_item['reachable'] == True:
          inner_item['reachable_label'] = gettext(u'erreichbar') + u' – ' + gettext(u'letzte Prüfung')
        else:
          inner_item['reachable_label'] = gettext(u'nicht erreichbar') + u'–' + gettext(u'letzte Prüfung')
        inner_item['reachable_last_check'] = datetime_l10n(inner_link.reachable_last_check, 'full')
        inner_data.append(inner_item)
      item['links'] = inner_data
    else:
      item['links'] = ''
    item['public'] = link.public
    if item['public'] == True:
      item['public_label'] = gettext(u'öffentlich zugänglich')
    else:
      item['public_label'] = gettext(u'nicht öffentlich zugänglich')
    item['reachable'] = link.reachable
    if item['reachable'] == True:
      item['reachable_label'] = gettext(u'erreichbar') + u' – ' + gettext(u'letzte Prüfung')
    else:
      item['reachable_label'] = gettext(u'nicht erreichbar') + u'–' + gettext(u'letzte Prüfung')
    item['reachable_last_check'] = datetime_l10n(link.reachable_last_check, 'full')
    item['search_title'] = link.search_title
    item['top'] = link.link_theme.top
    item['type'] = link.link_theme.type
    item['layer'] = link.link_theme.layer
    data.append(item)
  return jsonify(data)

@app.route('/offers')
def offers_without_lang_code():
  if 'top' in request.args:
    return redirect(url_for('offers', theme = request.args['theme'], top = '', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))
  else:
    return redirect(url_for('offers', theme = request.args['theme'], lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/offers')
def offers():
  theme = request.args['theme']
  if 'top' in request.args:
    top = True
  else:
    top = False
  links = get_theme_links(theme)
  data = []
  for link in links:
    if top == False or (top == True and link.link_theme.top == True):
      item = { 'id': link.id}
      item['title'] = link.title
      item['link'] = link.link if link.category != 'geoservice' else url_for('catalog', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']) + '#geoservice-' + str(item['id'])
      item['map_link'] = link.link
      item['category'] = link.category
      if item['category'] == 'api':
        item['category_label'] = gettext(u'API (Programmierschnittstelle)')
      elif item['category'] == 'application':
        item['category_label'] = gettext(u'Anwendung')
      elif item['category'] == 'documentation':
        item['category_label'] = gettext(u'Dokumentation')
      elif item['category'] == 'download':
        item['category_label'] = gettext(u'Download')
      elif item['category'] == 'geoservice':
        item['category_label'] = gettext(u'Geodatendienst')
      else:
        item['category_label'] = link.category
      item['group'] = link.group
      item['group_order'] = link.group_order
      item['link_label'] = gettext(u'Link')
      if link.category == 'application':
        inner_links = get_parent_link_children(link.parent_id, True, True)
        inner_data = []
        for inner_link in inner_links:
          inner_item = { 'id': inner_link.id}
          inner_item['title'] = inner_link.search_title if inner_link.search_title else inner_link.group
          inner_item['link'] = inner_link.link
          inner_item['public'] = inner_link.public
          if inner_item['public'] == True:
            inner_item['public_label'] = gettext(u'öffentlich zugänglich')
          else:
            inner_item['public_label'] = gettext(u'nicht öffentlich zugänglich')
          inner_item['reachable'] = inner_link.reachable
          if inner_item['reachable'] == True:
            inner_item['reachable_label'] = gettext(u'erreichbar') + u' – ' + gettext(u'letzte Prüfung')
          else:
            inner_item['reachable_label'] = gettext(u'nicht erreichbar') + u'–' + gettext(u'letzte Prüfung')
          inner_item['reachable_last_check'] = datetime_l10n(inner_link.reachable_last_check, 'full')
          inner_data.append(inner_item)
        item['links'] = inner_data
      else:
        item['links'] = ''
      item['public'] = link.public
      if item['public'] == True:
        item['public_label'] = gettext(u'öffentlich zugänglich')
      else:
        item['public_label'] = gettext(u'nicht öffentlich zugänglich')
      item['reachable'] = link.reachable
      if item['reachable'] == True:
        item['reachable_label'] = gettext(u'erreichbar') + u' – ' + gettext(u'letzte Prüfung')
      else:
        item['reachable_label'] = gettext(u'nicht erreichbar') + u'–' + gettext(u'letzte Prüfung')
      item['reachable_last_check'] = datetime_l10n(link.reachable_last_check, 'full')
      item['search_title'] = link.search_title
      item['top'] = link.link_theme.top
      item['type'] = link.link_theme.type
      item['layer'] = link.link_theme.layer
      data.append(item)
  return jsonify({
    'offers': data
  })

@app.route('/imprint')
def imprint_without_lang_code():
  return redirect(url_for('imprint', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/imprint')
def imprint():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('imprint.html', mobile = user_agent.is_mobile, subtitle = gettext(u'Impressum'))

@app.route('/privacy_policy')
def privacy_policy_without_lang_code():
  return redirect(url_for('privacy_policy', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/privacy_policy')
def privacy_policy():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('privacy_policy.html', mobile = user_agent.is_mobile, subtitle = gettext(u'Datenschutz'))

@app.route('/terms_of_use')
def terms_of_use_without_lang_code():
  return redirect(url_for('terms_of_use', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/terms_of_use')
def terms_of_use():
  user_agent = parse(request.headers.get('User-Agent'))
  return render_template('terms_of_use.html', mobile = user_agent.is_mobile, subtitle = gettext(u'Nutzungsbedingungen'))

@app.errorhandler(400)
def error_400(error):
  return redirect(app.config['REDIRECT_URL_400'])

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
