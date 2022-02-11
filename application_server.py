"""Exports a WSGI application that can be used to host the application by 1)
   Passenger, when imported into *passenger_wsgi.py* (for example), or 2) a
   CherryPy instance when this file is invoked directly.
"""

import io
import os
import re
import csv
import sys
import json
import random
import hashlib
import docutils
import cherrypy
#import git
import articles

SALT = "and pepper like the fresh smoked stuff from goa"

class Server(object):
    """CherryMy points can be identified in this object for non-static routing.
       *test()* is included as an example.
    """

    def __init__(self):
        """
        """
        self.modRoot, _ = os.path.split(os.path.abspath(__file__))

    @cherrypy.expose
    def article(self, name):
        """Returns raw RST from article with given name
        """
        rstPath = "%s/articles/%s.rst" % (self.modRoot, name)
        if not os.path.isfile(rstPath):
            raise cherrypy.HTTPError(404, "Not found")
        cherrypy.response.headers["Content-Type"] = "text/plain"
        with open(rstPath, 'r') as f:
            yield f.read()

    @cherrypy.expose
    def listings(self):
        """Returns JSON of metadata for each article.
        """
        articlePath = self.modRoot + "/articles"
        listings = []
        for filename in os.listdir(articlePath):
            if filename.endswith(".rst"):
                fullPath = articlePath + "/" + filename
                listings.append(articles.getMeta(fullPath))
        cherrypy.response.headers["Content-Type"] = "application/json"
        yield json.dumps(listings)

    @cherrypy.expose
    def publish(self, name, token):
        """Accepts a new article (or update, if name exists) for publication.
           Verified by token of name hashed with internal API key. Document is
           in request body.
        """
        request = cherrypy.serving.request
        if request.method != "POST":
            raise cherrypy.HTTPError(405, "Method Not Allowed")
        body = request.rfile.read()
        clientToken = token
        serverToken = hashlib.sha256((SALT + name).encode()).hexdigest()
        if clientToken != serverToken:
            raise cherrypy.HTTPError(403, "Forbidden")
        rstPath = "%s/%s.rst" % (articles.MOD_ROOT, name)
        with open(rstPath, 'w') as f:
            f.write(body.decode("utf8"))
        #repo = git.Repository(articles.MOD_ROOT)
        #repo.addCommit("New article: '%s'" % name)

# define module-level *application* symbol for Passenger WSGI mounting
application = cherrypy.Application(Server(), "/", {
    "/": {
        "tools.staticdir.on": True,
        "tools.staticdir.index": "index.html",
        "tools.staticdir.dir": os.path.abspath("public"),
        "tools.response_headers.on": True
    }
})

# define scripted execution for alternate local testing mode
if __name__ == "__main__":
    cherrypy.tree.graft(application, "/")
    cherrypy.engine.signals.subscribe()
    cherrypy.config.update({
        "global": {
            "server.socket_host": "127.0.0.1",
            "server.socket_port": 8000
        }
    })
    cherrypy.engine.start()
    cherrypy.engine.block()
