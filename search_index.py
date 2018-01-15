from geolotse import app, Links, Situations, Tags
from flask_sqlalchemy import SQLAlchemy
from pysolr import Solr



# initialise Solr, clear search index and initialise index counter
solr = Solr(app.config['SOLR_URL'])
solr.delete(q='*:*')
index_counter = 0



# build search index for catalog
links = Links.query.all()
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
  solr.add([
    {
      'id': index_counter,
      '_text_': link.title + link.link + description + str(tag_list),
      'category': 'c',
      'title': link.title,
      'link': link.link
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
      'category': 's',
      'title': situation.title,
      'link': situation.link
    }
  ])