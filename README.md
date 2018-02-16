# geolotse

A landing page for organisations wanting to connect and integrate their various geodata, geodata services and geospatial applications

## Requirements

*   [*Python*](https://www.python.org)
*   [*Virtualenv*](https://virtualenv.pypa.io)
*   [*Apache Solr*](http://lucene.apache.org/solr)
*   An object-relational database management system, [*PostgreSQL*](https://www.postgresql.org) is recommended
*   A memory caching server, [*Memcached*](https://memcached.org) is recommended

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

1.  Fill the databse with data, either by applying the `examples/database_pgsql.sql` as a starting point and/or for testing or by filling the database from scratch with your own data – the [database](##database) section below might be helpful in either case
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

If you want to deploy geolotse with [*Apache HTTP Server*](https://httpd.apache.org) you have to make sure that [*mod_wsgi*](http://modwsgi.readthedocs.io) is installed, a module that provides a Web Server Gateway Interface (WSGI) compliant interface for hosting *Python* based web applications. Then, you can follow these steps:

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
        
## Database

The database consists of four main tables:

*   `links` – All the links listed in the catalog view, shown as search results and/or used by situations are stored here
*   `situations` – All the links listed in the catalog view, shown as search results and used by situations are stored here
*   `sublinks` – All the links listed in the catalog view, shown as search results and used by situations are stored here
*   `tags` – All the tags are stored here

The other tables are used for storing the relations between the four main tables (e.g. between links and tags).

### Tags (table `tags`)

A few details on the important attributes (i.e. fields):

*   `title` – This text field is mandatory since the title *IS* the tag
*   `auto` – The value `FALSE` in this boolean field means something like *This tag shall be kept in this table until it is deleted by the administrator.*, the value `TRUE` means something like *This tag is rather volatile and may be deleted or updated by a bot (e.g. a cronjob).*; the field is mandatory since some external logic can be built upon its value (e.g. a cronjob could visit all your geoservice links, fetch all the tags, remove all the tags where `auto` is `FALSE` and insert all the fetched tags)

Always think of the relations between links and tags if you insert, delete or update tags, especially by a bot (e.g. a cronjob)!
