from geolotse import app, Inspire, Links, Themes, Tags
from flask_sqlalchemy import SQLAlchemy
from pysolr import Solr



# initialise Solr, clear search index and initialise index counter
solr = Solr(app.config['SOLR_URL'])
solr.delete(q = '*:*', commit = True)
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
      category_order = 5
      group_order = 1
    else:
      group_list = ''
      if link.category == 'api':
        category_order = 2
      elif link.category == 'documentation':
        category_order = 6
      elif link.category == 'download':
        category_order = 3
    solr.add([
      {
        'id': index_counter,
        '_text_': str(group_list) + link.title + link.link + description + str(tag_list),
        'database_id': link.id,
        'category': link.category,
        'title': link.title,
        'link': link.link if link.category != 'geoservice' else '',
        'public': link.public,
        'category_order': category_order if 'category_order' in locals() else link.category_order,
        'group_order': group_order if 'group_order' in locals() else link.group_order
      }
    ], commit = True)
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
      ], commit = True)
inspire_themes = Inspire.query.join(Links.inspire).with_entities(Inspire.id, Inspire.annex, Inspire.theme_de, Inspire.theme_en, Links.category_order).group_by(Inspire.id, Inspire.annex, Inspire.theme_de, Inspire.theme_en, Links.category_order).all()
for inspire_theme in inspire_themes:
  index_counter += 1
  solr.add([
    {
      'id': index_counter,
      '_text_': inspire_theme.theme_de + inspire_theme.theme_en,
      'database_id': inspire_theme.id,
      'category': 'inspire',
      'title': inspire_theme.theme_de,
      'link': '',
      'public': True,
      'category_order': inspire_theme.category_order,
      'group_order': inspire_theme.annex
    }
  ], commit = True)



# build search index for themes
themes = Themes.query.all()
for theme in themes:
  index_counter += 1
  if not theme.descriptive_tags:
    descriptive_tag_list = ''
  else:
    descriptive_tag_list = []
    for descriptive_tag in theme.descriptive_tags:
      descriptive_tag_list.append(descriptive_tag)
    descriptive_tag_list = tuple(descriptive_tag_list)
  links = Links.query.join(Links.themes).filter(Themes.id == theme.id).all()
  if not links:
    link_list = ''
    tag_list = ''
  else:
    link_list = []
    tag_list = []
    for link in links:
      link.title not in link_list and link_list.append(link.title)
      tags = Tags.query.join(Links.tags).filter(Links.parent_id == link.parent_id).all()
      if tags:
        for tag in tags:
          tag.title not in tag_list and tag_list.append(tag.title)
    tag_list = tuple(tag_list)
    link_list = tuple(link_list)
  solr.add([
    {
      'id': index_counter,
      '_text_': theme.title + str(descriptive_tag_list) + str(link_list) + str(tag_list),
      'database_id': theme.id,
      'category': 'theme',
      'title': theme.title,
      'link': '',
      'public': True,
      'category_order': 4,
      'group_order': 0
    }
  ], commit = True)



# optimize search index
solr.optimize(commit = True)