# application
TITLE = u'Geolotse.HRO'
CONTACT = 'geodienste@rostock.de'
PARENT = 'https://www.rostock.de'
REPOSITORY = 'https://github.com/rostock/geolotse'
META_AUTHOR = u'Hanse- und Universitätsstadt Rostock'
META_DESCRIPTION = u'Einstieg in die Geodateninfrastruktur und Schnittstelle aller Anwendungen mit Raumbezug der Hanse- und Universitätsstadt Rostock'
META_KEYWORDS = u'Geodaten,Geodienste,Karte,Kataster,Liegenschaften,Rostock,Vermessung,Verwaltung'

# i18n and l10n: language
LANGUAGES = {
  'de': 'Deutsch',
  'en': 'English'
}
BABEL_DEFAULT_LOCALE = 'de'

# i18n and l10n: dates and times
DEFAULT_TIMEZONE = 'Europe/Berlin'
BABEL_DEFAULT_TIMEZONE = DEFAULT_TIMEZONE

# Bootstrap
BOOTSTRAP_SERVE_LOCAL = True

# database
SQLALCHEMY_TRACK_MODIFICATIONS = False

# cache
DEFAULT_CACHE_TIMEOUT = 86400

# CitySDK api
CITYSDK_API_TARGET_NAME = 'Klarschiff.HRO'
CITYSDK_API_TARGET_LINK = 'https://www.klarschiff-hro.de/map?request='

# redirection URLs for HTTP error codes
REDIRECT_URL_400 = 'https://geo.sv.rostock.de/400.html'
REDIRECT_URL_403 = 'https://geo.sv.rostock.de/403.html'
REDIRECT_URL_404 = 'https://geo.sv.rostock.de/404.html'
REDIRECT_URL_410 = 'https://geo.sv.rostock.de/410.html'
REDIRECT_URL_500 = 'https://geo.sv.rostock.de/500.html'
REDIRECT_URL_501 = 'https://geo.sv.rostock.de/501.html'
REDIRECT_URL_502 = 'https://geo.sv.rostock.de/502.html'
REDIRECT_URL_503 = 'https://geo.sv.rostock.de/503.html'
