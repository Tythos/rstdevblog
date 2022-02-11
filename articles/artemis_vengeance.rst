Old School Is New Again
=======================

SDL2, Grad School Engines, and PacMan Clones 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. contents::

It made me feel really old, but I came across a CD the other day that had a
backup of some projects from college and grad school. This included a lot of
stuff, from CFD rocket engine simulations to a random game I wrote for job
application portfolios.

But the real interesting, and timely, part of these projects were the
mini-tour-de-force they represented through end-to-end game programming at the
C++ level. There's a lot that's changed over the years (this was a little over
a decade ago), but also a lot of valuable lessons learned from something that,
even today, still builds and runs. So, pull up a chair, and join me in our
high-level tour through self-contained C++ game development concepts!

With that in mind, this isn't a tutorial. You can follow along, crack your own,
or even follow up on a potential series I might write as I go about refactoring
the old code. But this article here, it's reminiscent. Like old leather and a
fine wine. Even if the leather has a boatload of tears and the wine has long
since corked.

The Bones
---------

You've probably heard that "real programmers" working on game development have
to learn something in the C family--whether it's old school ANSI C, C++,
Objective-C, C#, or others. Frankly, this is a load of male cow fecal matter.
With today's software tools and hardware technology, there are AMAZING things
you can do in high-performance, photo-realistic web pages::
	
	https://threejs.org/
	
3d in JavaScript! Even down to the GLSL shader level on the GPU! It's amazing:

  https://dev.tythos.net/img/zyfixg4qvkvj6r7oc2rb.jpg

But that doesn't mean thinking about (say) the C++ approach is a bad idea.
Let's say you've learned a modest amount of C++ and are now thinking you want
to write a game. Where to begin? There are a lot of engines (Gadot, Unity, and
Unreal, to name a very small few) to choose from. But let's say we want to
ignore the abstractions and role something ourselves. Where would we begin?

Cross platform is good. Write something for Windows 10, and maybe with the
right approach it can also run on Windows 7, Linux, and even Mac OS. The most
platform dependent part of this problem is solved by a robust window manager,
which gives you the tools to get up and running with a bare-bones graphical
context around which you can develop the rest of the rest of your code through
the platform-agnostic OpenGL API.

Sure, there are a few other platform abstraction benefits. Handling input
devices, managing sound mixers, loading fonts and images, defining reusable UI
elements... But at the end of the day, the primary purpose of the
cross-platform library you write on is to abstract window management so you can
get to the starting line.

ArtemisLib
----------

I'm a big fan of SDL, the Simple DirectMedia Layer::
	
  https://github.com/libsdl-org/SDL
  
It's straightforward, modular (with a nice ecosystem of plugin-able libraries
that remain well-maintained), and gives you a fast way to get to doing OpenGL.
There are other options out there--explore them!--but since this is my article,
we'll be building our bones on top of SDL.

Speaking of which, we should talk about LazyFoo. He's put together a
*fantastic* set of tutorials on a variety of topics, including SDL and OpenGL.
If there's one place you should start, I'd recommend part 51 of his SDL series::
	
  https://lazyfoo.net/tutorials/SDL/51_SDL_and_modern_opengl/index.php
  
Get this up and running, and you're well on your way to first base.

Some Flesh
----------

https://dev.tythos.net/img/6d5wh6xwght1wls80el6.jpg

It's time to look at our library. Using SDL and associated libraries as a
starting point, take a gander at the different elements in the following GitHub
project::

  https://github.com/Tythos/ArtemisLib

It was fun to try and reverse-engineer some of my rudimentary design decisions.
You can tell what pieces of this came from simply reusing basic "scaffold"
code, what came from things I found myself rewriting over and over again, and
what things came from some weird abstracted vision for what and how an engine
should come together for future applications.

Probably the easiest way to sort through this mess is, if you open the MSVC
solution in the "msvc/" folder, to start with the "TestDriver" project that
uses a single "main.cpp" to build a basic application to test the library. That
means looking at "int main()" to see how an application is set up, populated,
and executed::

  // Set up app

  hApp = new aApp();

  hApp->hGraphics->setScreen(600, 900, 32);

  hApp->debugging = true;

  hApp->externalRender = testDraw;

  hApp->hGraphics->hTypewriter->setFont("arial.ttf");

So far, pretty straightforward. There are a few things I'd change here, but it
makes sense. There's a core engine object, that includes a graphics subsystem
and debugging flags. In this case, we point the application to an "external
renderer", which is just a function pointer for doing rendering outside the
engine code. This is probably the most glaring point to start generalizing if I
rewrite this; I'm a big fan of the THREE.js rendering pipeline, which looks
something like this:

https://dev.tythos.net/img/u2o2b988uaysvmxagx74.png

Finally, we tell the type-rendering subsystem (basically a wrapper around
SDL_ttf, which is basically a wrapper around freetype) we want to default to a
specific font, for things like console rendering::

  // Set up cameraa

  hApp->camera->setRight(5.0f, 0.0f, -1.0f);

  hApp->camera->setNearClip(0.1f);

  hApp->camera->setFarClip(20.0f);

  hApp->camera->setSkyboxTexture("playabox.png");

  hApp->camera->setSkyboxResolution(1024);

  hApp->debug("Finished setting up camera");

Not much to see here, just basic camera properties. There's only one camera at
this stage, and it's hard-coded into the engine model. Another place for
improvement. Also worth noting we specifically set up the skybox as a property
of the camera. Interesting. Let's move on to something else.

Population
----------

https://dev.tythos.net/img/qrbhvg9d3jsiq0xjf7tv.jpg

So, let's populate some events::

  // Set up events

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*quitTrig), (*quitTarg));

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*fullscreenTrig), (*fullscreenTarg));

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*rotateRightTrig), (*rotateRightTarg));

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*rotateLeftTrig), (*rotateLeftTarg));

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*rotateUpTrig), (*rotateUpTarg));

  hApp->gameEvents->createElement(ASTATE_GLOBAL, (*rotateDownTrig), (*rotateDownTarg));

Ooooh, so here's where things get interesting. One thing I've learned over the
years is, a specific application isn't really defined by its software
components, the libraries it uses, or even the assets that it draws from. What
makes an application unique is, how are all of those pieces put together?

And usually that comes down to events. When X occurs, Y should happen. There
are much better ways to handle this (pub/sub and other message-passing systems
are IDEAL here). But, for this project, I went with a combination of several
"event" models:

* First, there is a single enumeration that specifies under what application
  state the event should be considered. Is this only an event for glue menus?
  Is it something general to gameplay? Only during a specific mode of action?
  In this case, all of these events should always be considered (the
  "ASTATE_GLOBAL" enumeration value). Not sure I ever wrote anything
  complicated enough to do more than that.

* Second, a function pointer to a "condition" evaluation. If this function
  returns false, the event isn't triggered. If it returns true, it is. There
  are a lot of problems with just juggling a set of global function pointers!
  But for this scale of application, apparently it worked well enough.

* Finally, a function pointer to a "trigger" behavior that is only invoked when
  the "condition" function pointer returns true. This is obviously a more
  involved and expensive behavior, that usually involves some kind of change to
  application state. These handlers don't have a functional interface (e.g., no
  parameters), but since these function pointers are defined and evaluated in
  the global namespace they still have access to the global engine singleton
  hApp, from which everything else can be queried.

Then, there are some lights::

  // Test light

  aLight * testLight = new aLight();

  testLight->setAmbient(0.9f, 0.1f, 0.1f);

  testLight->setDiffuse(0.1f, 0.1f, 0.9f);

  testLight->setPosition(2.0f, 2.0f, 2.0f);

  testLight->setAttenuation(0.1f);

  testLight->setVisible(true);

  testLight->enable();

  hApp->addLight(testLight);

  hApp->setGlobalAmbient(0.5f, 0.5f, 0.5f);

Lighting, and light management, is... kind of a pain in OpenGL? The state-based
rendering assumes there are a fixed index of light sources, and unless you are
writing shader code (which I hadn't learned yet on this project), you're stuck
with the basic lighting model (and good luck balancing that out with material
mapping). So, there's a basic "aLight" class that wraps some of that behavior,
but it still has to be handled as a "special" object (much like the camera) in
the scene by the engine singleton.

And some more stuff::

  // Test cube

  hCube = new aCube();

  hCube->setSize(0.5f);

  hCube->setAngularVelocity(0.8f, 0.4f, 0.2f, 0.1f);

  hCube->setAmbient(0.5f, 0.5f, 0.5f);

  hCube->setDiffuse(0.7f, 0.7f, 0.7f);

  hApp->addObject(hCube);

  hApp->debug("First cube initialized");

  // Test planet

  earth = new aPlanet(1.0f, 2048);

  earth->setPosition(1.0f, 1.0f, -1.0f);

  earth->setRotation(0.1f, 0.1f, 0.9f, 0.0f);

  earth->setAngularVelocity(0.9f, 0.0f, 1.0f, 0.0f);

  earth->setAmbient(0.7f, 0.7f, 0.7f);

  earth->setDiffuse(0.9f, 0.9f, 0.9f);

  hApp->addObject(earth);

  hApp->debug("Earth initialized");

  // Load skybox

  skyboxTex = new aTexture();

  skyboxTex->loadFromFile("background.png");

  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP);

  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP);

  skyboxMesh = new aMesh();

  skyboxMesh->loadSphere(1.5f, 32);

  //skyboxMesh->setColor(0.1f, 0.2f, 0.4f, 1.0f);

This actually isn't very interesting. Just some scene graph population. A lot
of this is being done manually when it should be handled by something like a
geometry and material model--again, like in THREE.js, so it can be separately
instantiated and resource-managed for better performance. Some sort of color
model wouldn't be a bad idea so we're not throwing floats all of the place. And
the kinematics... sigh. More recent stabs at this problem have led me to
conclude that it's worthwhile using something like the excellent, header-only
"glm" library for algebraic constructs and parameters. Just looking at the
above is a pain. And why did I require texture parameters to be specified
manually when creating a skybox? Who knows.

https://dev.tythos.net/img/6qq5da1dwhd9usdkwu1h.jpg

Finally
-------

The last few lines are::

  // Run base

  hApp->debug("The app is being executed...");

  hApp->execute();

  hApp->debug("The app has being executed.");

  // Clean up and quit

  hApp->debug("Finished; shutting down...");

  hApp->terminate();

  return 0;

So, once everything is set up, the only thing left to do is launch the main
loop (self-contained, now that we've defined all of the application logic), and
then clean up when everything's finished.

Not bad, really. There's a lot of rough edges. But it's a strong enough
foundation that, while it surprises me today, I was able to do a few projects
here and there with the same library. Let's look at one of them.

Game Design
-----------

After grad school, I was job-hunting in the Los Angeles area and put my resume
in with (at the time) a small game development company (maybe 25-30 people at
the time) called "Riot Games". They were a couple of years into a building a
MOBA you may have heard of, and it was starting to gain some traction. I needed
a basic, self-contained game to fill out my portfolio, so I started from this
engine and put together "PacMan: Vengeance" from the following idea:

* I wanted to flip the "PacMan" paradigm around, and have players control the
  ghosts. They'd be trying to hunt down PacMan, the evil invader, with the
  usual PacMan mechanics (dot-eating, etc.).

* You would start with one ghost, in a small maze. Every few levels, you would
  get another ghost, and you could switch between them to try and "trap" PacMan
  as the mazes grew in size.

* Each ghost would have a different special ability--sprint, teleportation,
  etc. You could "level" up one ability each time you finished a round. The
  speed bonus from "sprint" would increase, etc.

Mazes were randomly generated, and the graphics were purely 2d. But, as it
turns out, this engine was enough to put it together. So, take a gander at the
source code over at the following URL and let's go over some of the more
interesting tidbits:

  https://github.com/Tythos/Vengeance

New App, New Models
-------------------

https://dev.tythos.net/img/jzbfmhx985f3450adnf9.jpg

Probably the first thing you'll notice is that we aren't just dealing with a
single "main.cpp" file anymore. There's a few new models:

* vSprite defines a single texture-based sprite with animation support, so you
  can populate multiple sprite types (different ghosts, etc.) from a single
  atlas

* vActor extends vSprite with activity states and logic, including some basic
  AI states and pathfinding, as well as "ability" handling for the ghosts

* vItem defines a specific powerup--small dots, large dots, fruit,
  etc.--randomly placed within the maze, again extending the vSprite class

* vMaze defines the maze itself. This includes random generation logic, layout
  of square structures and pathfinding, etc.

I won't dive too much into these models. As mentioned before, the really
interesting thing is how they come together. So, let's wander back over to
"main.cpp".

The Main Thing
--------------

https://dev.tythos.net/img/o9ojen088zbpqnzwhyrs.jpg

We have a number of pieces, now, largely texture-based but with good enough
encapsulation to see how they can all be put together into a single game using
this approach. Aside from "events.cpp"--which is just a "library" or collection
of function pointers that we'll use to construct game logic--that means looking
at "int main()". So, let's dive in.:

  // Initialize game

  game = new aApp();

  ...

  game->hConsole->setVisible(false);

So far, pretty straight forward. We do a little more detailed setup of the
in-app console here, since the debugging requirements get a lot bigger when you
have multi-state game logic to verify::

  // Add events

  game->gameEvents->createElement(ASTATE_GLOBAL, (*quitTrig), (*quitTarg));

  ...

  game->gameEvents->createElement(ASTATE_GLOBAL, (*levelClydeTrigger), (*levelClydeAction));

This is pretty much what you expect. Notice that I never end up trying to
organize events by application state--they're still all "ASTATE_GLOBAL"! Guess
I jumped the gun a little bit there. Nonetheless, we're pretty clearly at the
limit of what this global-function-pointer approach lets you do. Anything more
complicated--a single additional layer of game state--and we'd need to start
multiplying these handlers by a factor of 2, 3, or more. This is probably the
biggest reason development down this road stopped and I moved onto other engine
technologies! Robust pub/sub is really necessary, even plugging an interpreter
(Lua is ideal) in for scripted game logic, to scale to something
production-ready::

  // Preload music and turn looping off

  mus1 = game->hSoundboard->loadSong("..\\resources\\Start.mp3");

  ...

  snd8 = game->hSoundboard->loadSound("..\\resources\\Laser.wav");

Hey, we have music! And sound effects! Thanks, SDL2_Mixer! Some of the
dependencies are no longer maintained, so in my dust-off, I refactored to use
the "mpg123" library (licensing warnings here), but your mileage may vary.
Still, nice to have something for your ears. The "soundboard" property is used
to load and play audio resources and can be triggered by specific event
handlers, since it just lives under the global engine singleton::

  // Load maze

  maze = new vMaze();

  ...

  delete game;

  return 0;

From here on out, the rest is pretty straightforward:

* We define a new maze and initialize it for a new level (our maze instance is
  a global singleton, too, since there's no real scene graph implemented in 2d
  here and it's worth blurring the lines on context for graphical elements at
  this level)

* We add a text-based sprite that shows different "tips" at different points in
  the game

* We point the engine to external rendering logic

* We set the initial state, from "level start", "play", "victory", and other
  possible enumeration values. This lets us control behaviors for, and trigger
  behaviors off of, state changes.

* We launch the main loop, and clean up when everything's finished.

Rendering
---------

Lastly, let's take a look at the "external" rendering logic, "extRender()"::

  float dt = 0.01f;

  if (currState == VS_LEVELING) {

  	renderLeveling(game->hGraphics);

  } else {

  	maze->renderMaze(game->hGraphics);

  }

We do rendering based off of application state, which is useful, because it
lets us define a different "rendering mode" for different screens. In this
case, we have a separate "leveling" screen where users choose to level-up
specific ghost skills. In both cases, the basic functional interface hands off
a pointer to the graphical subsystem as the only parameter; everything else is
accessed through the global engine singleton::

  renderInterface();

  maze->update(dt);

  extUpdate(dt);

  return true;

We have a separate call to another global rendering routine. This includes
"typing" out different ghost states/selections, tips, and status messages.
These are collectively organized under the name "interface", but this also
includes some hooks into logic for ghost selection, etc. We then handle update
logic, which includes keypress events and sprite movement.

Conclusion
----------

That's actually it. I was very surprised everything built, but it still runs!
Who would have thought. So, time for some "lessons-learned":

* SDL is a solid choice. Decent way to get cross-platform support at a low
  level. Not having to worry about window management, in particular, is
  well-worth the pain of initial configuration.

* There's no reusable 2d interface code here. We don't use Imgui, for example,
  or anything else that would give us buttons, UI frames, etc. This is a big
  weakness, even though we have the pieces to put together our own reusable
  classes to fill the gap. This is also one reason, since around this time
  WebGL starting being a thing, I started looking at other technologies where I
  would end up getting a lot of these things for "free" in a way that was still
  cross-platform.

* We've beaten the dead horse of event management enough. Another thing I'll
  observe is, how much better this could work if refactored for something like
  an ECS-style engine, where you get a real separation of concerns that can
  help with multi-threaded performance, update subsystem isolation, and
  asynchronous state management:

  https://en.wikipedia.org/wiki/Entity_component_system

* This really isn't 3d, obviously, and in fact there's no real reason to
  include OpenGL at all. Straight SDL surface management, for sprites and other
  entities, would be perfectly fine. After this engine, I would go on to do a
  lot more with GLSL (which was just becoming a thing around this time) but
  would never revisit to incorporate these technologies into this particular
  engine.

* There's a lot of other non-SDL libraries that could help round out things
  like random number generation and similar mathematical and programming
  behaviors. Boost is a big one, of course, and I've already mentioned GLM.
  There's also a number of "new" C++ language features (and we don't even touch
  the STL!) that might, or might not, be useful to organize a lot of this event
  management logic.

That's about it. Thanks for taking a trip through the past with me. There's
some great lessons-learned in here, and I suspect it would be a useful resource
for those trying to understand a lower level of C++ game and application
development. Don't hesitate to poke around and try it out yourself! Even
hobbies are useful.

And no, I didn't get that job with Riot. ;)
