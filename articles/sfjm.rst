Single-File JavaScript Modules
==============================

Let's talk about development standards for single-file JavaScript modules using
the AMD standard (i.e., RequireJS) for reusable, multi-modal software.

Why?
----

I am heavily influenced by the so-called "zero framework manifesto":

  https://bitworking.org/news/2014/05/zero_framework_manifesto/

And I have significant sympathy with the associated "you have ruined
JavaScript" rant:

  http://codeofrob.com/entries/you-have-ruined-javascript.html

To be honest, even jQuery was never particularly appealing to me, and is
largely irrelevant now that there are a) usable module loaders, and b)
querySelector() support in every major browser. But now adays, you have entire
development environments and tooling requirements that have sprung up around
complex JavaScript projects when all you really need is a nice and
self-contained reusable tool. Preferably one that can run from both NodeJS
and in-browser using an AMD-compatible loader like RequireJS.

Have you *SEEN* how much bloat there is in something like Bootstrap, of all
things? Seriously. *WTF*.

I don't want complicated JavaScript builds--that ruins the point. I am happiest
when I can just double-click an index.html file to load my project, press
"refresh" anytime I want to "rebuild", and directly inspect all my project
artifacts within the same developer console. Come join me! Web application
programming can be fun again! But seriously, you'd be surprised how much you
can get done (and how transparently you can do it) with just HTML+CSS+JS, and a
few TRUELY modular (read: self-contained, no-abstraction-buyin-required) tools.

But what about those tools? We need something condensed, because we just want a
file we can host in a GitHub Gist or GitLab Snippet--we don't need gigantic
package.json-managed mountains of spaghetti for a template engine, or separate
classes for a decent numerical math library. Thanks to THREE.js, even a 3d
engine can be beautifully encapsulated in a single file! So, there's really no
excuse anymore.

Instead, we need a simple way to mark up single-file JavaScript modules (or, as
I'm calling them for the time being, SFJMs, or "safe-jams"). We need some of
the best metadata attributes from package.json and related project
organization, sure, but in a streamlined way where we only use what we need. Is
it possible? Sure!

Writing A Module
----------------

Write your modules using an AMD-compatible "define()" closure. If also
developing for a node.js environment, this can be easily replicated (as
demonstrated in the "testmod.js" folder)::

  if (typeof(define) == "undefined") { 
      function define(callback) { return callback(require, exports, module); }
  }

At the end, define your exports using an "Object.assign()" operation that will
be easily (and transparently) extended::

  Object.assign(exports, {
      "square": square,
      "cube": cube,
      "AnAwesomeNumber": AnAwesomeNumber
  });

If you're looking at the GitHub project, you can view the "testmod.js" file as
an example. (I might refactor it soon, in order to move it over to a Gist so
this concept/example is more self-hosted and less hypocritical.)

Describing A Module
-------------------

Here's the real magic, and to a degree the whole point of this project. You
should attach meta-properties to the conclusion of your module definition. What
properties are those, you wonder? Funny you should ask.

Let's start with versions of required fields from package.json formats:

  https://docs.npmjs.com/cli/v6/configuring-npm/package-json

But do we need a name? No, not really. In the interest of avoiding redundant
information, and letting AMD loaders like RequireJS do their thing, we'll let
the module name be the name of the file itself. This lines up well with
Gists/Snippets, too, where we expect to stash these modules.

I'll also add here that we want to borrow the "dunder" style from Python. This
helps avoids namespace conflicts and clearly denotes which keys contain module
metadata. Speaking of Python, let's also reference the distutils setup()
arguments here for completion's sake:

  https://docs.python.org/3/distutils/setupscript.html#meta-data

So, let's start by just pointing to the Gist/Snippet to self-identify the SFJM.
We'll maintain the requirement for a version field, borrowing from one of my
favorite software engineering standards, Semantic Versioning:

  https://semver.org/

But there's other fields we should make sure we include in the single file,
which would otherwise be contained in a package's top-level contents. You would
pretty much always have (for example) a "LICENSE" file, to control how other
people are allowed to use (edit, really) your code. We'll use the handy SPDX
identifiers to reference specific licenses by short string values:

  https://spdx.org/licenses/

Required Fields
---------------

So, we have a few strong candidates for "required" fields.

* \_\_url\_\_, a String value identifying the URL where the Gist/Snippet lives;
  this should be the argument you pass to a git-clone operation.

* \_\_semver\_\_, a String representing a Semantic Versioning number for your
  current module version. This includes three decimal-delimited integers for
  major, minor, and patch revision numbers.

* \_\_license\_\_, a String indicating the email address to which inquiries should
  be made by users and developers.

And honestly? I think that's probably good. I was toying with an "author" field
of some kind (e.g., email address point-of-contact), but really, you're either
going to manage contact through the Gist/Snippet, or document that in your
module docstrings for publication with a JSDoc command anyways. So, yeah; I
think we're good!

So, for our "testmod.js" module we're using as an example, the export
assignment might be supplemented by something like this::

  Object.assign(exports, {
    ...
    "__url__": "https://gist.github.com/01a0ed2ab5c52b1120ed0283a585d510.git",
    "__semver__": "1.0.0",
    "__license__": "MIT",
  });

Extras and Dependencies
-----------------------

What other (optional) fields might we want to support? Here are some ideas of
what I think the more useful options might be, largely drawn from package.json
and Python's setup.py arguments:

* You could add a "main" field to define an entry point easily invocable from
  the command line::

  > node -e "const testmod = require('./testmod'); testmod.main();"

* A Python-style "classifiers" (or "keywords") list could help identify certain
  meta-attributes of your tool (it is a numerical algorithm? email parser? etc)

* Of course, we're missing one hell of an elephant in the room here. What if
  your package has a set of dependencies--other modules (let's assume SFJMs) it
  needs to run? How does it import the right resources, and from where?

This last one is a little trickier than it might appear. Let's say we bundle
package references directly into a "\_\_deps\_\_" Array property. Without a
fixed package manager utility, we'll need to know where to get them. Let's
assume we can git-clone from a Gist/Snippet URL, like we referenced in the
\_\_url\_\_ property. How far does this take us? Let's see::

  Object.assign(exports, {
    ...
    "__deps__": [
      "https://gist.github.com/01a0ed2ab5c52b1120ed0283a585d510.git",
      "https://gist.github.com/885c2db3de71c6fb12aab159a61edf58.git",
      "https://gist.github.com/3cb935df81459b7cb2f8abc7cb3b4d27.git"
    ]
  });

Within our code, the references will probably be something like a standard
require() statement, right? Something like this::

  let myDep = require("lib/myDep-v1.1.2.min.js");

Technically, we can extract the module name from the file that is git-cloned
from the Gist/Snipper URL. The way Gist/Snippet clone works, this will result
in the desired file at "[hash]/myDep-v1.1.2.min.js"--assuming that's the file
name used by the Gist/Snippet. But we don't know that!

Ah, but we don't need/want to clone it. We want a fixed snapshot, which will
help with ensuring consistent behavior against a specific version. And we can
grab that with a curl command, using the right URL, so long as we still know
what the file destination is (e.g., how the require() call will import it). So,
let's use an Object instead and identify the specific name and SemVer in the
STDOUT when we write to a "lib" folder. This way, the dependencies will look
like this in our SFJM file::

  Object.assign(exports, {
    ...
    "__deps__": {
      "txtloader-v1.0.0.js": "https://gist.github.com/Tythos/01a0ed2ab5c52b1120ed0283a585d510",
      "spheregeo-v0.1.0.js": "https://gist.github.com/Tythos/885c2db3de71c6fb12aab159a61edf58",
      "WebThread-v1.0.0.js": "https://gist.github.com/Tythos/3cb935df81459b7cb2f8abc7cb3b4d27"
    }
  });

Now, we can iterate over the \_\_deps\_\_ fields and write dependencies to a
"lib/" folder (which we'll presumable include within our .gitignore listing)::

 > set FILES=$(node -e "const testmod = require('./testmod'); console.log(Object.keys(testmod.__deps__).join('\n'));")

 > set URLS=$(node -e "const testmod = require('./testmod'); console.log(Object.keys(testmod.__deps__).map(function(key) { return testmod.__deps__[key]; }).join('\n'));")

 > curl URLS[0] > lib/FILES[0]

That last command is a little hypothetical. You might have to do something from
a shell script of some kind to iterate accurately. But nonetheless, very
feasible. Who needs npm-install anyways!?

Building A Module
-----------------

If you want to "build" a SFJM module for release, you're likely looking to do
something like a minification and obfuscation/mangling pass. This can be done
pretty easily from the command line using Node tools like Teser (which, unlike
UglifyJS, supports ES6)::

 > npm install -g terser

 > set SEMVER=$(node -e "const testmod = require('./testmod'); console.log(testmod.__semver__);")
 
 > terser --compress --mangle -- testmod.js > testmod-v%SEMVER%.min.js

Testing A Module
----------------

Single-file JavaScript modules can have a "\_\_tests\_\_" property. This
should be an Array of functions that accept and invoke an "assert" function for
their specific tests. This makes it easy to import and test a SFJM module using
a variety of frameworks, from build-in assert (or console.assert() from the
browser) to Node Tap and beyond, without any actual dependencies.

What would that look like? Let's use the "testmod.js" example from this
project. It might have a "\_\_tests\_\_" property like this::

  Object.assign(exports, {
      ...
      "__tests__": [
            function(assert) { assert(exports.square(1) == 1); },
            function(assert) { assert(exports.cube(2) == 8); },
            function(assert) { assert(exports.cube(3) == 9); }
      ]
  });

Then, you could run it from the command line with a node-eval::

 > node -e "const testmod = require('./testmod'); testmod.__tests__.forEach(function(test) { test(assert); });"

I don't know about you, but I think that's pretty cool.

Documenting a Module
--------------------

We can self-document a module pretty easily with the right doc-strings. We'll
use the JSDoc standard here, as it's self-contained and runs nicely from the
command line with few extra arguments::

 > npm install -g jsdoc

 > jsdoc testmod.js

By default, the resultant web page can be opened from "out/index.html". Don't
forget to include this folder in your .gitignore, of course!

Deploying A Module
------------------

I'm not convinced of a specific deployment approach yet. But we'll want some
way to support a couple of deployment pathways:

* Push to an NPM package, so other users could npm-install our module. This
  would require a significant quantity of additional (automatically-generated)
  assets, like package.json, that I'm not sure I want to explicitly support
  right now, but I could see something being done in the future.

* For the browser, we could build (minify) using the previous example (terser)
  and publish (upload?) as a semver-marked .min-v{} file. This could readily be
  included (as I like to do) in a "lib/" folder of a project, to be imported by
  RequireJS (though I'm really unsure about the specific SemVer extraction
  syntax in the following example)::

    > set SEMVER=$(node -e "const testmod = require('./testmod'); console.log(testmod.__semver__);")

    > terser --compress --mangle -- testmod.js > testmod.min-v%SEMVER%.js
 
* We could also upload the build product to a CDN or artifact host (e.g.,
  Nexus) of some kind. I'll leave it to future iterations to figure, and
  document examples for, out a robust and consistent approach::

    > curl -F 'data=@testmod.min-v%SEMVER%.js' https://my.cdn.io/

And that's pretty much it! This collects a number of patterns that I've found
to be really useful. I hope they help you as much as they help me.
