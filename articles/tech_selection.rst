Tech Selection
==============

Or, Why Don't I Just Write My Own Version Of Everything?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Maybe I'm the only one with this problem. But every time I find myself doing
research to select some key item in a project's technology stack at work, I
find myself frustrated between several boundary conditions for any given
option--some of which I'll admit are readily contradictory:

* Shouldn't be easier to use then this?

* Do I really have to buy into this abstraction?

* I don't need [insert Java/Apache/AWS project here], can't I just run a
  simpler version of this on my own local machine for development and testing?

* If I run a simple version of this on my own local machine for development and
  testing, what guarantees do I have that it will scale securely to production?

* I don't need (or want) complex configuration requirements to set up this
  wonderfully generic universal-swiss-army-knife tool to my particular use case
  when I'm pretty sure my particular use case could be more effectively /
  simply / efficiently solved by a dedicated/custom solution.

Usually this leads me to a specific conclusion: *Why don't I just write my own
version?* After all, how hard could it be?

Second System Syndrome
----------------------

In his seminal text "The Mythical Man Month", Fred Brooks (among many other
insights) observed something he called the "second-system effect". In my own
words, it looks something like this:

  *The most dangerous system an architect designs is his second, because they
  are no longer risk-averse and are seeking to incorporate all the lessons and
  overcome technology reductions they had to make in order to get their first
  system to work.*

In other words, for your first system, you are just trying to get something
to work, while learning (probably) a complex new technology or concept. In your
second system, all bets are off: the safetys have been removed and there's
nothing stopping you from over-engineering the S**T out of everything.

How is this relevant?

Let's return to the "tech selection problem". Here's the little voice that is
speaking to us in the back of our heads:

  *We've written code before. We've shipped products. We could write our own
  version of [insert tech need here] and it would fit perfectly. I'll bet it
  would even come in useful for other projects down the road.*

Astraroth: The Demon Prince of Coding
-------------------------------------

In one school of demonic ontologies from the 1400s, there was a prince of hell
associated with each of the seven deadly sins. Pride belonged to Astraroth.
(At least according to "The Lanterne of Light". Your mileage may vary.)

I've been grappling a lot lately with the degree to which pride is associated
with Second System Syndrome and the "write my own version of everything"
problem. A lot of this comes, honestly, from one's own perception of your
abilities as a programmer, and your ability to recreate anything you want to.
Software engineering is a heady business! And the tools out there today are so
powerful that it's easy to convince yourself that anything is possible for
someone--let's admit it--as smart, as skilled, and as good-looking as you.

Rewrite your own version of Twitter? No problem. I've got an afternoon.

Don't like the latest World of Warcraft expansion? I'll create my own.

Wikipedia editors got you down? I'll show them, and write a distributed wiki
and blogging system that uses blockchain for secure verification and
publishing. Hell, it will probably pull a perfect head of foam on your Guiness,
too, if you give me an extra week. (Isn't there an npm-install for that?)

By now, you probably see where I'm going with this. Even if you are the wizard
of modern tech and coding you think you are, it's not going to end well.

The Universe Is Big (but the universe of code is bigger)
--------------------------------------------------------

We all know (or are at least familiar with, second-hand) the numbers on how
quickly our civilization is generating new data. Something like 90% of all
bytes in the history of the world have been generated in the past two years,
according to the most recent estimate I've read. It's not tough to believe that
you'll never see all the YouTube videos on the internet. And there might even
be some Laughing Leo memes that I'll never get around to seeing.

But that's okay, because we can write software! Whether it's a scraper or some
form of AI, we can use programming to give us the tools to ingest, process, and
prioritize all the data we need. Our software will do all of it for us, and
scale to a global set! Aren't we wonderful?

Ah, goes Godel. Ah, but your tools are data, too.

And here's where I have to admit something today that I hadn't really
appreciated before. The universe of tools is getting Too Big. In particular,
it's getting too big for any one person to know. Too big to know that, if you
make a tech selection of any kind, you're really getting the best option--and
that you won't be bit in the ass by a lock-in problem two years down the road.

The problem sets are growing. So the tools to solve them are growing too.

I don't know about you, but I hate overspecialization. I live in fear that I
will get pigeon-holed into some backwater specialty of tech engineering (hello,
database administrators!) where my value is sufficient to keep a job for a
couple of years, but where I'll a) be bored, and b) become obsolescent faster
that I can learn enough new skills to break out of the stovepipe.

But that's what the growing marketplace of tools is forcing all of us to do.
You thought you were a full stack developer, but have you tried Flutter and
Feathers? And how long would you need to check them out before trying another
similar technology that won't QUITE fit into the need you have, but might be
shoe-horned enough for the Next Guy to worry about how to fix the inevitable
abstraction leaks? You won't.

JavaScript Documentation
------------------------

Let me give you one example. There's some requirements coming down the pipe
that will likely force a key project to conduct thorough documentation of all
software objects within the codebase--everything from function calls to API
endpoints. "That's fine," I told myself. We've been pretty good about
commenting things rigorously in a somewhat-comprehensive Python-style docstring
fashion, it shouldn't be tough to just plug an existing tool into our CI
configuration to scape, collate, and format that documentation. Hell, I just
did a brownbag on setting up that exact process with our Python codebase using
Sphinx.

Some precursory research into the options, however, quickly banished any such
optimism. Here's a bare handful of the Sphinx-like options you could spend
(waste?) time investigating:

* Sphinx (with some configuration, it can work for JavaScript code, too)

* HeaderDoc

* JSDoc

* APIDoc

* Docco

* ESDoc

* Doctrine

* DocX

* LeafDoc

Let's say it takes me an hour or two to poke through one of the above, run some
basic tutorials, look at the configuration requirements, and figure out how
effective it would be if we adjusted all of our code comments to process and
generate the desired artifacts in the way we wanted. That's AT LEAST (keeping
in mind this list is not complete, and using 1.5 hours/option as an average)
14 hours--just about two workdays--down the tubes. And that doesn't even
include the time to actually adapt and implement the tech selection, or to
write up your findings in a report!

The best we can hope for seems to revolve around something like the following
process:

* Ask other team members what they've used, and their impressions

* Estimate cost-of-adoption and probability-of-lockin

* Error on the side of simplicity (sorry, Sphinx, but the config alone to adapt
  to a JavaScript project throws you out of the box).

* ALWAYS go with the more transparent option. You never know what you'll need
  to customize--or, more likely, debug--in the future.

* Don't be shy about choosing the "popular" option. Peruse GitHub project pages
  to inspect stars/follows, outstanding issues, release frequency/delay, etc.

Of course, a lot of these are specific to open source options. So, license
constraints can also apply if you're planning on integrating or modifying
source. But can you imagine how much worse the evaluation would get if you also
had to sit through proprietary options?

(For what it's worth, we stuck with the basic JSDoc option--and it plugged into
our CI seamlessly, with minimal tweaking and transparent configuration, though
some testing was required before we fully understood how to best structure
docstrings for various module, export, and class ontologies.)

Distributed Messaging Networks
------------------------------

Okay, I can see you're not convinced. It's just a documentation system, right?
Here's a more life-threatening example:

We have a messaging solution that is VERY use-case specific. There's a hell of
a lot of assumptions about message structure, indexing, etc., that makes it
very unsuitable for expansion to cloud-scale datastores, multiple ontologies,
and other scientific domains. This has become a real problem as we expand/pivot
into a greater emphasis on event handling across a software architecture.

There's plenty of modern tooling (WebSockets, Redis databases, enterprise cloud
schemas, etc.) that can be applied here. There's a proprietary commercial
solution we've used on other projects, enough to learn what works and what
doesn't while letting someone else take the risk. But we need our own solution.
Something distributed, so we can scale and plug in new message processing nodes
as need be. Surely this is a solved problem?

Well, yes and no.

Do you want to configure Hadoop? Probably not. Learning, and practicing, robust
deployment of many Apache products is a full-time job. And we already talked
about overspecialization. Same goes for many cloud-scale assumptions.

I've toyed with a few interesting things I've written for other projects (some
of which show real promise: as they are applied across more and more problem
sets, really useful patterns are emerging that we can adapt subsequent
iterations to optimizing). But, fortunately, I had a moment of "wait this can't
be a good idea" and consulted a colleague I greatly respect. After expressing
dismay at how underconstrained, and overdesigned, my problem/solution pair was,
he summarized his options thusly:

* If it just needs to run on one node, ZeroMQ (0mq) is a good option and easy
  to pick up

* For pretty much everything else, redis pub/sub (and anything else you want it
  to do)

* If you love pain, but really have to get 5 nines, and have the team to deploy
  and run it: RabbitMQ

These are solid recommendations. The first is out, though, because I know the
message processing network is going to need to scale to multiple nodes, if for
organization of processing by message type if nothing else. The last is out,
because a) I want to learn and experiment with it myself on my own machine in a
short amount of time, and b) clearly we won't have the resources, or we'd go
straight to some Apache / AWS combination anyways.

So, Redis it is! That seems to be the answer to a lot of problems lately.

Conclusion
----------

I think one of my takeaways is, you're always going to have arguments with
people (who typically come along near to, or after, the deadline has passed)
who CLEARLY know you chose the wrong thing, and you should have passed messages
by using an Ethereum-backed ledger, and you're using the wrong web server
anyways, and didn't you already know about this tech that's SO obvious...

(Strangely, a lot of these people are fresh out of college. It's amazing how
often this attitude actually reflects someone unable to step out of a fixed
tech stack and learn something new.)

But there's more to the decision than "what will be the most argument-proof".
Evidence is nice. So, I've started making a long-term habit out of documenting
tech selection decisions, with the same rigour we would otherwise use for
something like a design review. Even if it's just my choice, I like knowing
what I looked at a year later, and beyond just being able to explain your
decision, it's amazingly useful when you hear about a colleague from another
office who's facing a similar problem/decision and you can help them jumpstart
(or even circumvent entirely) their analysis paralysis (it's a real thing--give
yourself a deadline, and try to minimize regrests).

After all, there's nothing more valuable than making sure you only have to
solve a problem once.

Just don't write your own. Unless you are willing "your own" to become a
full-time job--and have the resources to sustain it.
