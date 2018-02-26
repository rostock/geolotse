# geolotse

A landing page for organisations wanting to connect and integrate their various geodata, geodata services and geospatial applications – view it in production: https://geo.sv.rostock.de

## Requirements

*   [*Python*](https://www.python.org)
*   [*Virtualenv*](https://virtualenv.pypa.io)
*   [*Apache Solr*](https://lucene.apache.org/solr)
*   [*PostgreSQL*](https://www.postgresql.org)
*   [*Memcached*](https://memcached.org)

## Installation

1.  Create a new virtual *Python* environment, for example:

        virtualenv /usr/local/geolotse/virtualenv
        
1.  Clone the project:

        git clone https://github.com/rostock/geolotse /usr/local/geolotse/geolotse
        
1.  Activate the virtual *Python* environment:

        source /usr/local/geolotse/virtualenv/bin/activate
        
1.  Install the required *Python* modules via [*pip*](https://pip.pypa.io), the *Python* package management system:

        pip install -r requirements.txt

## Configuration

1.  Create a new secret settings file by copying the template for it:

        cp /usr/local/geolotse/geolotse/secrets.template /usr/local/geolotse/geolotse/secrets.py
        
1.  Edit the secret settings file 
1.  Edit the general settings file `/usr/local/geolotse/geolotse/settings.py`
1.  Edit the [*Leaflet*](http://leafletjs.com) related (i.e. theme view map and map search related) settings in both the *globals* and *functions* sections of file `/usr/local/geolotse/geolotse/static/js/themes.js`
1.  Edit the theme view map address search related settings in all sections of the file `/usr/local/geolotse/geolotse/static/js/themes.js`

## Initialisation

1.  Activate the virtual *Python* environment:

        source /usr/local/geolotse/virtualenv/bin/activate
        
1.  Create a new empty databse according to your settings in `/usr/local/geolotse/geolotse/settings.py`
1.  Initialise the databse schema:

        cd /usr/local/geolotse/geolotse
        export FLASK_APP=geolotse.py
        python -m flask db upgrade
        
1.  Deactivate the virtual *Python* environment:

        deactivate

1.  Fill the databse with data, either by applying the `examples/database_pgsql.sql` as a starting point and/or for testing or by filling the database from scratch with your own data – the section on the [database structure](#database-structure) below might be helpful in either case
1.  Create a new empty *Apache Solr* core:

        /path/to/solr/bin/solr create -c geolotse

1.  Open file `/path/to/solr/home/geolotse/conf/solrconfig.xml` and remove below elements:

        <initParams path="/update/**">…</initParams>
        <processor class="solr.AddSchemaFieldsUpdateProcessorFactory">…</processor>

1.  Add below element to root element `<config>`:

        <schemaFactory class="ClassicIndexSchemaFactory"/>

1.  Remove `managed-schema` file from the new *Apache Solr* core directory:

        rm /path/to/solr/home/geolotse/conf/managed-schema

1.  Copy the search schema to the new *Apache Solr* core directory:

        cp /usr/local/geolotse/geolotse/solr/schema.xml /path/to/solr/home/geolotse/conf
        
1.  Make sure that both the user and the group of the search schema `/path/to/solr/home/geolotse/conf/schema.xml` match the user and the group of the other files within the new *Apache Solr* core directory (i.e. the *Apache Solr* user and its group, usually `solr` and `daemon`)
1.  Activate the virtual *Python* environment:

        source /usr/local/geolotse/virtualenv/bin/activate
        
1.  Run the search index builder:

        python search_index.py
        
1.  Create a cronjob to run the search index builder periodically and thus keeping the search index up-to-date

## Deployment

If you want to deploy geolotse with [*Apache HTTP Server*](https://httpd.apache.org) you have to make sure that [*mod_wsgi*](https://modwsgi.readthedocs.io) is installed, a module that provides a Web Server Gateway Interface (WSGI) compliant interface for hosting *Python* based web applications. Then, you can follow these steps:

1.  Create a new empty file `geolotse.wsgi`:

        touch /usr/local/geolotse/geolotse/geolotse.wsgi
        
1.  Open `geolotse.wsgi` and insert the following lines of code:
    
        import os
        activate_this = os.path.join('/usr/local/geolotse/virtualenv/bin/activate_this.py')
        with open(activate_this) as file_:
            exec(file_.read(), dict(__file__=activate_this))

        from geolotse import app as application

1.  Open your *Apache HTTP Server* configuration file and insert something like this:
    
        WSGIDaemonProcess    geolotse processes=4 threads=128 python-path=/usr/local/geolotse/geolotse:/usr/local/geolotse/virtualenv/lib/python2.7/site-packages
        WSGIProcessGroup     geolotse
        WSGIScriptAlias      /geolotse /usr/local/geolotse/geolotse/geolotse.wsgi process-group=geolotse
        
        <Directory /usr/local/geolotse/geolotse>
            Order deny,allow
            Require all granted
        </Directory>
        
## Translation

1.  Activate the virtual *Python* environment:

        source /usr/local/geolotse/virtualenv/bin/activate

1.  Update the file `/usr/local/geolotse/geolotse/messages.pot` by extracting all translatable strings into it:

        cd /usr/local/geolotse/geolotse
        pybabel extract -F babel.cfg --omit-header -o messages.pot .

1.  Update all translation files (i.e. the `*.po` files):

        pybabel update -i messages.pot -d translations
        
1.  Edit the `*.po` file(s)
1.  Compile the `*.po` file(s) – this will generate the required `*.mo`:

        pybabel compile -f -d translations
        
## Database structure

The database consists of four main tables:

*   `links` – All the links listed in the catalog view, shown as search results and/or used by themes are stored here
*   `sublinks` – All the sublinks related to the links are stored here
*   `tags` – All the tags related to the links meet here
*   `themes` – All the themes presented in the theme view go here

The other tables are used for storing the relations between the four main tables (e.g. between links and tags). One of these table, `links_themes`, provides more attributes than just the ID of the respective tables (see below).

### Links (table `links`)

A few details on the important attributes (i.e. fields):

*   `parent_id` – This integer field is mandatory since some logic within the code is based on it. The decision which link within a `category` and/or `group` is considered as the `parent` has to be made wisely and the results differ within a categories and/or groups: play around and find out yourself or check the `examples/database_pgsql.sql` for many examples. Always put an existing `id` in here since the value is checked within a foreign key constraint
*   `category` – This text field is mandatory since some logic within the code is based on it. The value shall be one of `api` (for API, i.e. application programming interfaces), `application` (for applications), `documentation` (for documentations, i.e. documentation websites), `download` (for downloads, i.e. download portals), `external` (for external links), `form` (for forms), `geoservice` (for geo services) or `helper` (for helpers, i.e. tools)
*   `category_order` – This integer field is mandatory since it determines the order of link categories in the catalog view and thus some logic within the code is based on it. Always use the same value for all links of one `category`, e.g. if the applications should appear first in the catalog view, all the application links have to have the `category_order` value `1`
*   `group` – This text field is mandatory since some logic within the code is based on it. The value depends from the `category`: for applications, external links and helpers (i.e. tools), the value is considered as the parent title; for geo services, the value is considered as the service type (e.g. WMS, WFS, INSPIRE View Service, WMTS etc.); for API (i.e. application programming interfaces), documentations (i.e. documentation websites), downloads (i.e. download portals) and forms, the value has no relevance and shall be set to the `category` value
*   `group_order` – This text field is mandatory since some logic within the code is based on it. The value depends from the `category`: for applications, external links and helpers (i.e. tools), the value determines the order of the link within its `group`, i.e. `1` for the first link, `2` for the second and so on; for geo services, the value determines the order of service types in the catalog view (always use the same value for all geo service links of one `group` (i.e. service type), e.g. if the geo service links of the service type WMS should appear first in the catalog view, all the geo service links of the service type WMS have to have the `group_order` value `1`); for API (i.e. application programming interfaces), documentations (i.e. documentation websites), downloads (i.e. download portals) and forms, the value has no relevance and shall be set to `1`
*   `title` – This text field is mandatory since every link needs a title, i.e. a name – but not necessarily an unique one
*   `link` – This text field is mandatory since this *is* the link itself
*   `public` – The value `FALSE` in this boolean field means *“This link is not publicly available.”*, the value `TRUE` however means *“This link is publicly available.”*. The field is mandatory since some logic within the code is based on it
*   `reachable` – The value `FALSE` in this boolean field means *“This link is currently not reachable.”*, the value `TRUE` however means *“This link is currently reachable.”*. The field is mandatory since some logic within the code is based on it
*   `reachable_last_check` – The value of this timestamp field represents the timestamp of the last reachability check of the link. The field is mandatory since some logic within the code is based on it
*   `description` – The description of the link and/or its target goes in this text field. The information is used in the catalog view
*   `date` – The date the link and/or its target was last updated is stored in this date field. The information is used in the catalog view
*   `authorship_organisation` – The organisation(s) of the author(s) of the link and/or its target go(es) in this text array field. The order has to be the same as in the `authorship_name` and `authorship_mail` fields since all these three fields are evaluated together in the code. The information is used in the catalog view
*   `authorship_name` – The name(s) of the author(s) of the link and/or its target go(es) in this text array field. The order has to be the same as in the `authorship_organisation` and `authorship_mail` fields since all these three fields are evaluated together in the code. The information is used in the catalog view
*   `authorship_mail` – The email address(es) of the author(s) of the link and/or its target go(es) in this text array field. The order has to be the same as in the `authorship_organisation` and `authorship_name` fields since all these three fields are evaluated together in the code. The information is used in the catalog view
*   `inspire_annex_theme` – The [*INSPIRE*](https://inspire.ec.europa.eu) annex theme of the link and/or its target is stored in this text field. The information is used in the catalog view
*   `logo` – If you want a link categorised as `application` and with `parent_id` equalling `id` to be equipped with a logo in the catalog view, its file name (*with* extension) has to go in this text field. Put the logo file itself in the `static/images/logos` folder. Logo information for links with other categories than `application` is not evaluated
*   `search` – The value `FALSE` in this boolean field means *“This link is considered as a search result and thus included in the search index.”*, the value `TRUE` however means *“This link is not considered as a search result and thus not included in the search index.”*. The field is mandatory since some logic within the code is based on it
*   `search_title` – If you want a link categorised as `application` to have a different title than the value of `group` in the search result list, the title hat to go in this text field

Always think of the *relations between links and sublinks*, the *relations between links and tags* and the *relations between links and themes* if you insert, delete or update links, especially by a bot (e.g. a cronjob)!

Both the `reachable` and `reachable_last_check` fields could be kept up-to-date by using a cronjob checking the reachability of the links.

### Links and themes (table `links_themes`)

A few details on the important attributes (i.e. fields):

*   `top` – If this boolean field is `TRUE`, then the link is considered as one of the “top offers” for the related theme in theme view and thus its features are shown on the map once the theme is selected.
*   `type` – The type of the link and/or its target goes in this text field. The value shall be one of `CitySDK` (for CitySDK conformal interfaces), `GeoRSS` (for GeoRSS feeds) or `WFS` (for web feature services). The information is used for showing features on the map in the theme view
*   `feature_type` – If `type` is `WFS`, the feature type (i.e. the “layer”) goes in this text field. The information is used for showing features on the map in the theme view
*   `geometry_type` – If `type` is `WFS`, the geometry type goes in this text field. The value shall be one of `Point`, `LineString`, `Polygon`, `MultiPoint`, `MultiLineString` or `MultiPolygon`.The information is used for showing features on the map in the theme view

Only if `type` and – for `WFS` – `feature_type` and `geometry_type` additionally is/are provided, the features of the link will be shown on the map in theme view!

### Sublinks (table `sublinks`)

A few details on the important attributes (i.e. fields):

*   `target` – This text field is mandatory since some logic within the code is based on it. The value shall be one of `metadata` (for sublinks leading to metadata of links, e.g. a specific page in a metadata information system), `geoportal` (for sublinks leading to the representation of links in a geodata portal), `geoportal_mobile` (for sublinks leading to the representation of links in a mobile geodata portal) or `opendata` (for sublinks leading to the representation of links in an open data portal)
*   `title` – This text field is mandatory since every sublink needs a title, i.e. a name – but not necessarily an unique one
*   `link` – This text field is mandatory since this *is* the sublink itself
*   `public` – The value `FALSE` in this boolean field means *“This sublink is not publicly available.”*, the value `TRUE` however means *“This sublink is publicly available.”*. The field is mandatory since some logic within the code is based on it
*   `reachable` – The value `FALSE` in this boolean field means *“This sublink is currently not reachable.”*, the value `TRUE` however means *“This sublink is currently reachable.”*. The field is mandatory since some logic within the code is based on it
*   `reachable_last_check` – The value of this timestamp field represents the timestamp of the last reachability check of the sublink. The field is mandatory since some logic within the code is based on it

Always think of the *relations between links and sublinks* if you insert, delete or update sublinks, especially by a bot (e.g. a cronjob)!

Both the `reachable` and `reachable_last_check` fields could be kept up-to-date by using a cronjob checking the reachability of the sublinks.

### Tags (table `tags`)

A few details on the important attributes (i.e. fields):

*   `title` – This text field is mandatory since this *is* the tag itself
*   `auto` – The value `FALSE` in this boolean field means something like *“This tag shall be kept in this table until it is deleted by the administrator.”*, the value `TRUE` however means something like *“This tag is rather volatile and may be deleted or updated by a bot (e.g. a cronjob).”*. The field is mandatory since some external logic can be built upon its value (e.g. a cronjob could visit all your geo service links, automatically collect all of the related tags, remove all the tags where `auto` is `FALSE` and finally insert all the collected tags)

Always think of the *relations between links and tags* if you insert, delete or update tags, especially by a bot (e.g. a cronjob)!

### Themes (table `themes`)

A few details on the important attributes (i.e. fields):

*   `title` – This text field is mandatory since every theme needs a *unique* title
*   `descriptive_tags` – The descriptive tag(s) for the theme go(es) in this text array field. The information is used in the theme view theme slider
*   `icon` – If you want a theme to be equipped with an unique icon in the theme view, its [*Font Awesome*](https://fontawesome.com) name (e.g. [`train`](https://fontawesome.com/icons/train)) has to go in this text array field. The order of the array items in this field is kept

Always think of the *relations between links and themes* if you insert, delete or update tags, especially by a bot (e.g. a cronjob)!
