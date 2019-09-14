THREE.js Persistent World - Basic Classes and Client
====================================================

.. contents::

Interactions are specific to classes of entities, as outlined in the
previously-cited paper:

#. Immutable objects, such as terrain

#. Mutable objects, whose state can be changed (items, etc.)

#. Player characters, controlled through a human interface

#. Non-player characters, controlled through AI agents

Base Objects
------------

What does that mean for our client? Let's focus on one at a time. Here's a
basic introduction to a bare-bones THREE.js client, which we'll write into
a static file application. (This will make it very easy to host later on a
game server URL, or package into standalone executables using Electron.) The
initial version of this client will have three objects attached to the window:

#. A scene, which comprises the top node of the client's scene graph

#. A camera, which defines the view matrix (user position and orientation, as
   well as some display settings)

#. A renderer, which is responsible for rasterizing the current scene into
   pixels in an HTML5 canvas element.

As we add objects, we'll extend the THREE.Mesh object (which provides the base
class for most nodes in a THREE.js scene graph) to implement things like
terrain, players, objects, skyboxes, etc. Serving these objects will be broken
into two datasets:

#. Resources required to initialize individual objects, including geometry data
   and materials (textures, shaders, BDRF coefficients, etc.).

#. Instantaneous states of individual objects, like position, velocity, and
   animation frames

The former can be stored in a static file service (with the appropriate
authentication layers, of course), and a streaming service (built on WebSockets
for state synchronization). States will also need to be maintained within a
server-managed dataset for authoritative, persistent definition of worldstate
(though this can be distributed within game and real-world geography).

Services
--------

We'll be organizing our project around a set of Docker services, organized by a
top-level docker-compose.yml file. This includes the client, which will be
hosted by a static file server. As we identify new services for classes of
transformations, and new datastores required to back them and encapsulate game
states. Eventually (with the appropriate caution) these can be extended to also
support an authentication layer and multi-container scalability.
