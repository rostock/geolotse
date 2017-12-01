# -*- coding: utf-8 -*-

# application title
TITLE = u'Geolotse.HRO'

# i18n and l10n
LANGUAGES = {
  'de': 'Deutsch',
  'en': 'English'
}
BABEL_DEFAULT_LOCALE = 'de'
DEFAULT_TIMEZONE = 'Europe/Berlin'
BABEL_DEFAULT_TIMEZONE = DEFAULT_TIMEZONE

# database
SQLALCHEMY_TRACK_MODIFICATIONS = False

# content for HTML meta elements
META_AUTHOR = u'Hanse- und Universitätsstadt Rostock'
META_DESCRIPTION = u'Einstiegsmöglichkeit in die Geodateninfrastruktur der Hanse- und Universitätsstadt Rostock und Schnittstelle aller Anwendungen mit Raumbezug des Kataster-, Vermessungs- und Liegenschaftsamtes der Hanse- und Universitätsstadt Rostock'
META_KEYWORDS = u'Geodaten,Geodienste,Karte,Kataster,Liegenschaften,Rostock,Vermessung,Verwaltung'

# redirection URLs for HTTP error codes
REDIRECT_URL_400 = 'https://geo.sv.rostock.de/400.html'
REDIRECT_URL_403 = 'https://geo.sv.rostock.de/403.html'
REDIRECT_URL_404 = 'https://geo.sv.rostock.de/404.html'
REDIRECT_URL_410 = 'https://geo.sv.rostock.de/410.html'
REDIRECT_URL_500 = 'https://geo.sv.rostock.de/500.html'
REDIRECT_URL_501 = 'https://geo.sv.rostock.de/501.html'
REDIRECT_URL_502 = 'https://geo.sv.rostock.de/502.html'
REDIRECT_URL_503 = 'https://geo.sv.rostock.de/503.html'
