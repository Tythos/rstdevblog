TPW: Basic Client
=================

.. contents::

OK. So where do we start?

The fastest way to a working web application with THREE is a simple set of
static files. These will include a few handy utilities (such as user controls)
and a basic set of entity classes, closely following the basic THREE.js demo.

Tracking our work in the handy Persistent World THREE.js project, you can view
the tag for this step here:

  https://github.com/Tythos/pw3/releases/tag/basicClient

So what does this look like?

The Client
----------

The client is defined by a set of static files arranged along the usual web
application lines:

* An index.html for bootstraping our basic page into application code (in this
  case, we're using require.js to organize around AMD-compatible modules)

* A index.css for basic styling (component-specific layout for interface items
  will come later, and will be templated using Handlebars)

* A source folder for our JavaScript code

And that's it, actually. Of course, the source is where the real magic happens.

The Client Source
-----------------

The "src" folder contains a few basic items:

* OrbitControls.js, which defines a useful extension for mouse-based navigation
  controls (panning, rotating, zooming) so we don't worry about binding too
  many DOM event listeners for mouse and keyboard

* THREE.js, which of course defines the THREE.js basics (including renderer,
  camera, scene graph nodes, and basic classes for the materials and geometries
  that can be used to construct meshes).

* main.js, which defines our application's entry point; from here we'll start
  up key THREE.js components (that we'll attach to the *window* symbol to
  ensure our singletons stay under a managed global scope). We'll also use this
  to start populating and binding user-defined entity classes, as well as our
  basic (decoupled) render and update loops. Render will use the
  requestAnimationFrame() function to schedule rendering passes, while update
  will be invoked on a regular interval.

* require.js, which defines our main module loader. (Seriously, if you haven't
  used require.js or other AMD-compatible modules and loaders, you're missing
  out. World changer.)

Our Entities
------------

The "src/entities" folder defines a few user-defined classes. At first, these
are very basic, but they establish a key pattern:

* Extend the THREE.Mesh class to define specific geometry/material combinations
  that can be used repeatedly

* Bind these objects with queries against the scene graph and a pub/sub event
  management system that we'll introduce later.

Extending THREE.Mesh is straightforward: simply attach the appropriate mesh and
geometry for that type of mesh. Construction can be customized with specific
parameters. We start with a very basic set of user-defined objects that (if you
look at main.js) are instantiated and attached to the scene graph.

* BoardArea.js defines a basic, flat, semi-transparent landscape

* Box.js defines a basic box geometry (a la the THREE.js intro tutorial)

* Frame.js defines a RGB x/y/z coordinate frame, useful for measuring and
  verifying world placement and orientation.

And that's it! All of the client-side instantiation (for now) takes place
within main.js, and you can see how straightforward it is.

The Server
----------

On it's own, a static file application can simply be tested by opening the
index.html file in your web browser. This is a great way to verify that your
basic client logic and objects are working.

At some point, though, we need to move to a server. In this case, we'll use
the amazingly flexible-yet-barebones Flask server in Python. (Among other
things, Flask gives us a WSGI application that we can use to mount additional
handlers and serve using any number of different production-quality web server
packages.)

Serving static files is a snap: We simply set the static URL path in the Flask
application constructor (we'll mount it at the root level here, so it stays 
blank), and point the static folder to the "public" folder where we've stored
our client files. Then, the only thing we need to do is define a root-level
endpoint to map "/" to the index.html file.

But static files aren't enough. We need a way for the client to synchronous
state information with the server--ideally through a message streaming protocol
so we're not constantly pushing and pulling/polling individual requests. This
is where WebSockets come in handy. A WebSocket connection (which you can easily
add to a Flask application) lets the client and server send messages back and
forth for individual events without closing and re-opening connections. Very
cool. If you look at service.py, you'll see that there are gevent/Flask
extensions to greatly simplify this process.

Conclusion
----------

That's enough for today! Next time we'll start diving into persistent object
classifications and maintaining a singular world state on the server that can
be broadcast to *all* clients connected to the server with WebSocket messages.
Hopefully, you can see how some of the pieces are starting to come together
already! Happy coding!
