THREE.js Persistent World - Introduction
========================================

.. contents::

THREE.js
--------

Have you ever checked out THREE.js? You should.

  https://threejs.org/

TL;DR: THREE.js is basically a 3d application engine. This includes your usual
suspects--3d math, GL API support, basic controls. What makes me love THREE.js
so much is something more:

* *Extensibility*: There is a *huge* thriving ecosystem of plugins and
  extensions for THREE.js giving you drop-in features that can water your
  mouth. This includes everything from mesh transformations of GL lines to
  gorgeous lens flares and custom controls.

* *Custom Graphics*: While THREE.js has a built-in collection of geometries
  and materials (the building blocks for a 3d object in THREE.js), the models
  are highly flexible and let you customize visualizations with your own buffer
  attributes. Most importantly, though, it's mind-bogglingly easy to experiment
  with your own custom GLSL (the OpenGL Shading Language)--which means your
  imagination is the only limit to the kind of high-performance,
  GPU-accelerated graphical effects you can achieve.

* *Bare-Bones*: THREE.js doesn't come with anything you don't need. It's
  super-lean and you get to choose what your application includes. If you're
  like me and want to experiment with your own implementations, THREE.js takes
  care of all the boring parts and lets you focus on the fun stuff.

* *Web-Based*: You might be surprised by how freeing a web-based 3d development
  environment can be. JavaScript, handled correctly, can be a powerful and
  high-performance language, even for applications as demanding as game
  programming. Will you be able to recreate the latest *God of War* series
  entry with identical performance? Maybe not. But you'll be able to makeone
  heck of an attempt--and what you create *will* be perfectly playable and
  (what's more) be able to take care of all the web-application advantages,
  from Electron builds to cross-platform accessibility to multi-device support.

Persistent World
----------------

So what's this about, anyways? This series of articles will outline and
document my attempt to create a 3d persistent world application with THREE.js,
including (most importantly!) the underlying server architecture and gameplay
programming. We're not being too ambitious, are we? We won't be re-creating
World of Warcraft. We will, however, see exactly how much is "reasonably"
achievable within a few weeks of web-based, casual/parttime/hobby application
development--greatly assisted by how much of the client-side work THREE.js will
take care of for us.

Outline
-------

One of the better initial models for MMO server architectures comes from the
following paper:

  http://plaza.ufl.edu/sakib/docs/MMORPG_survey.pdf

However, this provides maybe 1% (at best) of the solution to a daunting problem
that has slain some of the best of programmers. We must be careful, we must be
methodical, and we must be everything but ambitious. Our criteria for success
is simply the barest possible minimum degree of functionality.

We will do this by, one at a time:

#. Identifying each class of transaction between client and server

#. Classifying that transaction by latency and reliability requirements

#. Determining an appropriate implementation for that class of transaction

#. Branching any server targets that have reached responsibilities that require
   either multiple instances or multiple classes (each with their own
   responsibilities).

#. Recursing this process for any server-to-server interactions required to
   support those transactions.

#. Identifying specific states effected by those transformations to be
   encapsulated within large-scale shared datasets.

#. Document formal mappings between states and transitions to define the
   client-server interface for scalability across in-game and real-world space.

You'll notice there are no client-client interactions. These may be suitable
for small-scale applications (even where some degree of arbitration is still
required), but in a persistent world--where interactions between players and
NPC are both constant and interchangable (regardless of player load), and
both security and scalability are paramount, we will focus on developing a
theory and basic implementation for server-mediated interactions only.

Tune in next article for our basic client architecture and state management!
