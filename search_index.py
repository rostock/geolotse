# -*- coding: utf-8 -*-
from geolotse import app, Links, Themes, Tags
from flask_sqlalchemy import SQLAlchemy
from pysolr import Solr



# initialise Solr, clear search index and initialise index counter
solr = Solr(app.config['SOLR_URL'])
solr.delete(q = '*:*')
index_counter = 0



# build search index for catalog
links = Links.query.filter(Links.search == True).all()
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
    if link.category == 'geoservice':
      groups = Links.query.with_entities(Links.group).filter(Links.parent_id == link.parent_id).all()
      if not groups:
        group_list = ''
      else:
        group_list = []
        for group in groups:
          group.group not in group_list and group_list.append(group.group)
        group_list = tuple(group_list)
    else:
      group_list = ''
    solr.add([
      {
        'id': index_counter,
        '_text_': str(group_list) + link.title + link.link + description + str(tag_list),
        'database_id': link.id,
        'category': link.category,
        'title': link.title,
        'link': link.link if link.category != 'geoservice' else '',
        'public': link.public,
        'category_order': link.category_order,
        'group_order': link.group_order
      }
    ])
  else:
    add = False
    if not link.search_title:
      title = link.group
      add = True
    else:
      title = link.search_title
      add = True
    if add == True:
      solr.add([
        {
          'id': index_counter,
          '_text_': title + link.link + description + str(tag_list),
          'database_id': link.id,
          'category': link.category,
          'title': title,
          'link': link.link,
          'public': link.public,
          'category_order': link.category_order,
          'group_order': link.group_order
        }
      ])
    



# build search index for themes
themes = Themes.query.all()
for theme in themes:
  index_counter += 1
  tags = Tags.query.join(Themes.tags).filter(Themes.id == theme.id).all()
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
      '_text_': theme.title + theme.link + str(tag_list),
      'database_id': theme.id,
      'category': 'theme',
      'title': theme.title,
      'link': '',
      'public': True,
      'category_order': theme.stars,
      'group_order': 0
    }
  ])