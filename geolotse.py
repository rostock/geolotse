from flask import Flask, abort, g, redirect, render_template, request, url_for
from flask_babel import Babel, gettext
from flask_bootstrap import Bootstrap
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from alembic import op


# initialise application
app = Flask(__name__, static_url_path='/assets')


# import configurations from files
app.config.from_pyfile('secrets.py', silent = True)
app.config.from_pyfile('settings.py', silent = True)


# Jinja2 whitespace and indent control
app.jinja_env.lstrip_blocks = True
app.jinja_env.trim_blocks = True


# initialise Babel, Bootstrap, SQLAlchemy and Migrate
babel = Babel(app)
Bootstrap(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)


# initialise database
links_tags = db.Table(
  'links_tags',
  db.Column('link_id', db.Integer, db.ForeignKey('links.id'), primary_key = True),
  db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key = True)
)

situations_tags = db.Table(
  'situations_tags',
  db.Column('situation_id', db.Integer, db.ForeignKey('situations.id'), primary_key = True),
  db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key = True)
)

class Link_Groups(db.Model):
  __tablename__ = 'link_groups'
  
  id = db.Column(db.Integer, primary_key = True)
  name = db.Column(db.String(255), unique = True, nullable = False)
  
  def __init__(self, name):
    self.name = name
  
  def __repr__(self):
    return '<link_groups id {}>'.format(self.id)

class Links(db.Model):
  __tablename__ = 'links'
  
  id = db.Column(db.Integer, primary_key = True)
  group_id = db.Column(db.Integer, db.ForeignKey('link_groups.id'), nullable = False)
  title = db.Column(db.String(255), nullable = False)
  link = db.Column(db.String(255), nullable = False)
  public = db.Column(db.Boolean, nullable = False)
  
  group = db.relationship('Link_Groups', backref = db.backref('links', lazy = False))
  tags = db.relationship('Tags', secondary = links_tags, lazy = 'subquery', backref = db.backref('links', lazy = True))
  
  def __init__(self, group_id, title, link, public):
    self.group_id = group_id
    self.title = title
    self.link = link
    self.public = public
  
  def __repr__(self):
    return '<links id {}>'.format(self.id)
      
class Situations(db.Model):
  __tablename__ = 'situations'
  
  id = db.Column(db.Integer, primary_key = True)
  title = db.Column(db.String(255), unique = True, nullable = False)
  stars = db.Column(db.SmallInteger, nullable = False)
  
  tags = db.relationship('Tags', secondary = situations_tags, lazy = 'subquery', backref = db.backref('situations', lazy = True))
  
  def __init__(self, title, stars):
    self.title = title
    self.stars = stars
  
  def __repr__(self):
    return '<situations id {}>'.format(self.id)
      
class Tags(db.Model):
  __tablename__ = 'tags'
  
  id = db.Column(db.Integer, primary_key = True)
  title = db.Column(db.String(255), unique = True, nullable = False)
  auto = db.Column(db.Boolean, nullable = False)
  
  def __init__(self, title, auto):
    self.title = title
    self.auto = auto
  
  def __repr__(self):
    return '<tags id {}>'.format(self.id)


# i18n and l10n
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
  link_groups = Link_Groups.query.order_by(Link_Groups.id).all()
  link_group_external = Link_Groups.query.filter_by(name = 'external').first()
  externals = Links.query.filter_by(group_id = link_group_external.id).order_by(Links.title).all()
  return render_template('catalog.html', subtitle = gettext(u'Katalog'), link_groups = link_groups, externals = externals)

@app.route('/situations')
def situations_without_lang_code():
  return redirect(url_for('situations', lang_code = g.current_lang if g.current_lang else app.config['BABEL_DEFAULT_LOCALE']))

@app.route('/<lang_code>/situations')
def situations():
  return render_template('situations.html', subtitle = gettext(u'Lebenslagen'))

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
