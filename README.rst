RstDevBlog
==========

The following is mostly an excerpt from the original set of articles I wrote
describing the design and approach of this blogging system--which, conveniently
enough, are naturally self-hosted within the starter blogging system under the
"articles/" folder.

.. contents::

Design and Layout
-----------------

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

User Guide
----------

If you'd like to use this system for your own site... fear not! That's why it's
here. I mean, here on GitLab. Clone/fork away! Once you do that, you can host
under most services pretty easily using the WSGI entry point defined in
"application_server.py". Tweak the styling and other public resources under the
"public/" folder, naturally. Then you're ready to start writing.

Once you've written an article as an .RST file, you can use a POST request to
upload the article. This is handled by the "Server.publish()" endpoint, and
accepts three things about your article:

#. The content itself is the body of the POST request. Assuming you're using
   curl, you can use the "-d @-" to pipe article contents from STDIN.

#. The POST URL has two required query string arguments, the first of which is
   "name". This defines the name of the .RST file to which the article will be
   written. (It does NOT appear as the title of the article--which is extracted
   from the top-level section header. Didn't I tell you RST was cool?)

#. The second POST URL query string argument is "token". You don't want just
   anybody submitting articles via random POST requests, do you? This is a
   super-basic way to "sign" your articles by hashing two things, in order,
   with SHA-256:

   * Some SALT (a string) that only you (and the server) know.

   * The name of the article (as passed via "name") so the token changes with
     each upload.

Pretty neat? I think so.

What Happens Next
-----------------

When you browse to the web address, you'll see the most recent article (by
default) rendered into HTML on the front page. There are also several
navigation options:

* "Most Recent" will jump, effectively, to the front page.

* "By Date" will list article titles, published dates, and keywords in order of
  upload date. This is the "normal" way users might look back on your history
  of articles.

* "By Topic/Keyword" is primarily an RST parsing flex, but still pretty neat.
  It presents a wordcloud-like set of keywords that can be used to filter a
  subset of articles, from which the user can select and view a specific one.

How are these keywords generated, you ask? Wonderful question! The RST parser
goes through the second-level section headers in each article (that is, NOT the
title, but every section immediately under it, in the document tree hierarchy).
Then, it filters out commonly-used words (as listed in
"articles/stopwords.txt") and organizes the remaining keywords by number of
occurances.

Anyways
-------

So, that's my simple, RST-based development blog. I've enjoyed using it, and
(after a little prodding) have actually written more than just the initial
spree of articles (so, mission accomplished). There's a lot more complexity you
COULD add, of course, but I appreciate the beautiful simplicity of it. If
anything, I think I'd probably only tweak a handful of things:

* Sometimes the date parsing/sorting gets messed up by later modifications to
  an article file on the server (say, if you notice a spelling error). This
  should be easy to fix by checking the right i-node property in the metadata
  lookup.

* The styling is definitely bare-bones. I like it that way, but there's a few
  things that could be improved without changing much, like using standard
  icons for the social media links at the bottom.

* Mobile is... interesting. I don't want to leverage a lot (or any, really) of
  JavaScript frameworks (sorry, React, but your name is misleading anyways),
  but I think it would be worth spending an afternoon to poke around some nice,
  bare-bones responsive design solutions (CSS Grid? something bootstrap-y?),
  especially for navigation.

* There appear to be issues with caching? And performance (from loading all the
  metadata and parsing RST doctree structures in particular) can take a hit. No
  reason we couldn't cache a lot of that upfront--or even at upload time.
