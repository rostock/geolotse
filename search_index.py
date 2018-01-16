# -*- coding: utf-8 -*-
from geolotse import app, Links, Situations, Tags
from flask_sqlalchemy import SQLAlchemy
from pysolr import Solr



# initialise Solr, clear search index and initialise index counter
solr = Solr(app.config['SOLR_URL'])
solr.delete(q = '*:*')
index_counter = 0



# build search index for catalog
links = Links.query.filter(Links.category.notin_(('external', 'helper'))).all()
for link in links:
  index_counter += 1
  description = link.description if link.description else ''
  tags = Tags.query.join(Links.tags).filter(Links.parent_id == link.parent_id).all()
  if not tags:
    tag_list = ''
  else:
    tag_list = []
    for tag in tags:
      tag.title not in tag_list and tag_list.append(tag.title)
    tag_list = tuple(tag_list)
  if link.category != 'application':
    solr.add([
      {
        'id': index_counter,
        '_text_': link.group + link.title + link.link + description + str(tag_list),
        'category': link.category,
        'group': link.group,
        'title': link.title,
        'link': link.link,
        'public': link.public,
        'category_order': link.category_order,
        'group_order': link.group_order
      }
    ])
  # sorry, some hard coded stuff in here
  else:
    add = False
    if link.id == link.parent_id and link.group != 'Geoport.HRO' and link.group != 'Klarschiff.HRO':
      title = link.group
      add = True
    elif link.link == 'https://www.geoport-hro.de/desktop':
      title = link.group
      add = True
    elif link.link == 'https://www.geoport-hro.de/mobil':
      title = link.group + u' mobil'
      add = True
    elif link.link == 'https://geo.sv.rostock.de/geoport-desktop':
      title = link.group + u' für die Verwaltung'
      add = True
    elif link.link == 'https://geo.sv.rostock.de/geoport-mobil':
      title = link.group + u' mobil für die Verwaltung'
      add = True
    elif link.link == 'https://www.klarschiff-hro.de':
      title = link.group
      add = True
    elif link.link == 'https://www.klarschiff-hro.de/map?mobile=true':
      title = link.group + u' mobil'
      add = True
    elif link.link == 'https://geo.sv.rostock.de/klarschiff':
      title = link.group + u' für die Verwaltung'
      add = True
    elif link.link == 'https://geo.sv.rostock.de/geoport-mobil':
      title = link.group + u' Prüf- und Protokollclient'
      add = True
    if add == True:
      solr.add([
        {
          'id': index_counter,
          '_text_': title + link.link + description + str(tag_list),
          'category': link.category,
          'group': title,
          'title': title,
          'link': link.link,
          'public': link.public,
          'category_order': link.category_order,
          'group_order': link.group_order
        }
      ])
    



# build search index for situations
situations = Situations.query.all()
for situation in situations:
  index_counter += 1
  tags = Tags.query.join(Situations.tags).filter(Situations.id == situation.id).all()
  if not tags:
    tag_list = ''
  else:
    tag_list = []
    for tag in tags:
      tag.title not in tag_list and tag_list.append(tag.title)
    tag_list = tuple(tag_list)
  solr.add([
    {
      'id': index_counter,
      '_text_': situation.title + situation.link + str(tag_list),
      'category': 'situation',
      'group': 'situation',
      'title': situation.title,
      'link': situation.link,
      'public': True,
      'category_order': 0,
      'group_order': 0
    }
  ])