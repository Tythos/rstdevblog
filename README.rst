Dreamer
=======

DreamHost-friendly server files for static hosting, scripted mounting, and
transparent local testing, based on CherryPy/WSGI.

Assumptions
-----------

We assume you have:

* A unique user for this domain/subdomain

* A user-level Python installation (we assume you have followed something like
  the steps outlined in https://help.dreamhost.com/hc/en-us/articles/115000702772-Installing-a-custom-version-of-Python-3).

* Configured your server to utilize Passenger WSGI in your control panel

Installation
------------

Installation is straightforward:

#. Locate your server domain folder (by default, this will have a *public/*
   folder and a *passenger_wsgi.py* file).

#. Replace contents of that folder with this repository (*passenger_wsgi.py*
   should overwrite *passenger_wsgi.py*, etc.)

#. Modify *passenger_wsgi.py* to specify the path to your user-level Python 3
   installation, if necessary.

#. Use *pip3* from your user-level Python to install *cherrypy*.

#. Touch *tmp/restart.txt* when you need to reload the CherryPy server.

Features
--------

* Static files are served from the *public/* folder. This includes *require.js*
  and the associated client-side application entry point *main.js*.

* Dynamic resource paths can be implemented by adding methods to the *Server*
  object defined in *application_server.py* decorated with *@cherrypy.expose*.
  The *test()* method is included as an example.

* If developing on your local computer before deploying, you can run
  *application_server.py* directly to mount and test an identical local version
  of the server.

Tips
----

* Add SSL certs from *Let's Encrypt*, then utilize CherryPy session management
  to implement secure logins.

* Clone this to a bare repository in your user folder, then pull directly into
  the server domain folder whenever there are any updates to avoid
  batch-replacing files.

* Develop as much as possible in the client-side JavaScript application to
  minimize overhead on the WSGI interface (especially as your application
  scales); identify client-server data interfaces explicitly by exposing
  non-static methods in the *Server* object.
