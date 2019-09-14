Developing a Development Blog, Part 1
=====================================

Design and Layout
~~~~~~~~~~~~~~~~~

.. contents::

I'm not a fan of blogs, in general. They're everywhere, typically have minimal
content of any value, and--if you decide to start your own--involve so much
that you'll never, EVER touch for the typical use case. (I'm looking at you,
WordPress!) Oh--and if you want something light and easy, you're probably going
to be hosting it on someone else's servers (Tumblr, etc.).

But.

*BUT.*

I still think I want one.

Design Requirements
-------------------

Specifically, I want a nice, easy development blog where I can:

* Write down notes, thoughts, and project plans

* Share engineering approaches with the community

* Capture useful tidbits of code and process for later re-use and sharing

I don't want to worry about transcribing, formatting, or archiving full
documents. I'd much rather just write up some ReStructuredText (a markup
language, similar to MarkDown, used by Python comments and documentation, with
some *very* nice portability features, document models, and native transforms).

And then, once I have some RST, I should just be able to shoot it over to the
blog server--say, by signed POST request--and not worry about anything else.
After all, the easier it is to use, the less likely I'll be to just ignore it
after the first 2 or 3 articles. (Right?)

There's some nice post-processing you could do on the backend, too, to make
things more accessible to readers. Once you have a structured document, it's
easy to extract keywords from section headers, for example. We can use the file
metadata (timestamps, for example) to organize and sort articles by date. And
we can analyze shared keywords to identify sets of article series and topics,
all automatically witin the backend.

Lastly, the presentation should be bare-bones. Some CSS here and there, maybe a
basic search feature, but really the front end's main job should simply be to
transform, format, and present the RST documents as HTML/CSS for easy reading.

Development
-----------

First, let's set up our basic server. Aside from the service itself (and
related project documentation), there's really only three resource folders that
we'll include:

* "articles/", where our .RST files will be stored

* "public/", where our front-end code will be stored (.HTML, .CSS, .JS, and
  maybe some related files like images and Handlebars templates)

* "tmp/", because we'll need a restart.txt file to "touch" whenever we want to
  restart the service

The service itself is actually straightforward. Since we're on a Dreamhost
subdomain, it's a snap to set up a Passenger WSGI configuration in the control
panel, at which point all we need to make sure is that there's a
"passenger_wsgi.py" file in the main subdomain folder.

BUT!

We want the server to be dual-use. Specifically, while Passenger will host a
WSGI application on the production side, we need to make sure we can test it
locally, too, with minimal hassle. Plus, we'll need some inspection code to
make sure our local interpreter bootstraps a modern version of Python. So, in
fact, we have two files:

#. "passenger_wsgi.py" will hold the boostrapping code. This includes a very
   useful trick I've applied in a couple of different situations, and have
   documented in it's own GitHub project at https://github.com/Tythos/dreamer .
   Long story short, this 1) checks the interpreter version; 2) reroutes
   execution to the user-installed Python 3.6 if it isn't being used; 3)
   imports the "application" object (a WSGI function) from our second module::

     import os
     import sys
     INTERP = os.path.abspath(os.path.expanduser("~/opt/python-3.6.2/bin/python3"))
     if sys.executable != INTERP:
         os.execl(INTERP, INTERP, *sys.argv)
     from application_server import application

#. "application_server.py" defines the WSGI function "application()". We'll use
   CherryPy to make it super-easy here, although Flask could just as easily be
   used. A key advantage here is, we can invoke this file directly to trigger
   a "main" clause that will take the "application" function and host it using
   CherryPy's built-in server, which will make local testing super-easy. The
   application itself is just a Server object with specific endpoints decorated
   with "@cherrypy.expose"--easy-peasy::

        class Server(object):
            @cherrypy.expose
            def test(self):
                return "This is an endpoint"
        application = cherrypy.Application(Server(), "/")
        if __name__ == "__main__":
            cherrypy.tree.graft(application, "/")
            cherrypy.engine.signals.subscribe()
            cherrypy.engine.start()
            cherrypy.engine.block()
