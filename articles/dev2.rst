Developing a Development Blog, Part 2
=====================================

Under the Hood
~~~~~~~~~~~~~~

.. contents::

Endpoints
---------

We had a test endpoint just to illustrate our original CherryPy server object,
as defined in "application_server.py", back in Part 1. But we'll need three
endpoints, in addition to static file handling routed through the "public"
folder (see CherryPy documentation for static file handling details;
specifically, "tools.staticdir" configuration options.) Those three endpoints
will be:

#. "def articles(name)" (e.g., "/articles?name="), which will look up and
   return the raw .RST from our "articles/" folder for a matching filename

#. "def listings()" (e.g., "/listings"), which will return a JSON response of
   metadata for all articles, including name; title; keywords; and date. (At
   this point, I should mention that we have a text file of "stopwords" on hand
   to filter out common words when the listings query aggregates keywords from
   section headers for each article.)

#. "def publish()" (e.g., "/publish?name=...&token=..."), a POST-only method we
   will use to receive .RST files from us, the author.

All other application logic will be handled by the front-end files defined in
the "public/" static file contents.

User Application
----------------

Now let's talk about the contents of our "public/" folder, which defines the
front-end web application. It's not super-complicated, but there are some
interesting parts:

* The "hbs/" folder will contain our Handlebars templates

* The "src/" folder will contain our JavaScript code. I'm a *HUGE* fan of
  require.js and asynchronous module definitions (AMD); we'll use that
  mechanism to organize our JavaScript files.

* The "sty/" folder will contain our stylesheets, favicons, fonts, etc.

* The "index.html" will, of course, define our entry point. This will include
  basic layout HTML DOM, as well as a <script/> tag for invoking require.js and
  indicating the application's main JavaScript file ("main.js").

The rest of our deep-dive here will focus on the code contained in the "src/"
folder. We'll step through these modules one by one.

Ancillary JavaScript Modules
----------------------------

"require.js" is our basic module manager, of course. You can get this straight
from the official website, no modification required. I like to use the
"data-main" script tag option when including this file to point RequireJS to
the main entry point, "main.js".

"handlebars.js" is our template module. It's identical to the release module
from the official website, only we've wrapped it in a "define()" closure to
ensure AMD compatability.

"jtx.js" is a library I've written of JavaScript type extensions. These include
useful functions like set operations for Arrays, converstion and formatting for
Dates, capitalization functions for strings, etc. You can find a copy of this
module in my Single-File JavaScript Modules project on GitHub, at
https://github.com/Tythos/sfjsm.

"quajax.js" is a very bare-bones AJAX libary for asynchronous file loading.
I tend to avoid frameworks like jQuery because I don't like "paying" for things
I don't need, but feel free to use your own solution if you're following along.

"rst2html.js" is the real key of the whole operation. This useful module was
compiled from an NPM module I've used a number of times:

  https://www.npmjs.com/package/rst2html

What does it do? Exactly what it sounds like. This module will be responsible
for transforming the .RST content of each article into organized HTML that we
can then present and style. No more, no less.

Application Logic
-----------------

We've skipped a file, of course. In this section, we'll dive into the "main.js"
file that contains our main application logic. "main.js" can be organized into
three basic views (or page types):

* Viewing a specific article (this includes the root-level page, which defaults
  to the most recent article)

* Viewing a set, or list, of articles; this set could be articles listed by
  date or search results

* Viewing sets of articles organized by keywords or topics

Viewing a specific article is the simplest page. Using the "rst2html" module,
we simply grab the RST contents asynchronously and render them into the main
page column. (We're using a basic small-LHS-column, big-RHS-column layout.)

To view a set of articles, we filter and sort article listings from metadata,
then list each article with title, publication date, and keywords.

To view a set of articles by keyword/topic, we first select (from listings
metadata) the top most-frequently occuring keywords. Then, when a user clicks a
specific keyword, we can rever to the listing logic from our second view.

Navigation
----------

Lastly, we need to define the navigation panel in the small LHS column. There
will be three basic navigation links and a search box:

* "Most Recent", which takes the user to the root-level page ("/"), where the
  most recent article will be rendered by default

* "By Date", which will list articles ordered by publication date (most recent
  first) using our listing logic from the second view

* "By Topic/Keyword", which will list common keywords (and, once selected, a
  subset of articles) using the logic from our third view

Lastly, we have a basic search feature. There are a couple of different ways we
could implement search, including score-merging across different search hits
(title, keywords, and content). All of these actions can be performed on the
client side once the metadata is retrieved from the "/listings" endpoint. For
the most basic case, we'll just search article titles and order by date.
