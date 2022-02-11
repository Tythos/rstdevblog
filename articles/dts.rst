SOAs with Docker Compose and Nginx Reverse-Proxy
================================================

Introduction
------------

If you have been doing container-based development (and who hasn't, lately?),
but haven't scaled to the point where you need full-up Kubernetes (though you
probably will, at some point), you're likely looking at a situation where you
need to manage a multitude of containers that define your application. Some of
these are databases (stateful), some of them are intermediate services
(stateless), and at least one of them probably define some sort of web-based
front-end application to make use of it all. It's a common pattern, and
properly organized it can be very powerful.

But you won't want to expose all of these things (like the databases) to the
world! And you don't want to constantly enable (or dance around) cross-origin
problems on your front-end when reaching out to other services. Instead, you'd
be much better off with a production-quality front-end server that can also
seamlessly manage HTTPS upgrades; caching; OAuth handoffs; and other
capabilities as transparently as possible.

One particularly useful intermediate solution for these cases is Docker Compose
and an Nginx reverse-proxy. Docker Compose is used to organize your containers,
including the internal network they use to talk to one another. Nginx is used
to route external requests to the appropriate containers without exposing any
of them directly. You can also extend the Nginx server (which lives in its own
container) directly by modifying the "nginx.conf" file to include (for example)
security certificates without either Docker Compose or any of the other
containers knowing--or caring--what the front-end server is up to.

This is an elegant solution and can scale nicely. However, if you're like me,
you may have been puzzled (and a little overwhelmed) by examples on the
internet that attempt to show you how this can be set up. (And, of course,
rarely will those examples work in a way that isn't very usecase-specific.) So,
here we are! I hope this helps you as much as it's helped me.

Individual Containers
---------------------

We're going to define three individual containers that constitute our
service-oriented architecture (or SOA). These cover three separate usecases
that you're likely to use in different combinations.

* "user" is a static-file web application. We'll use an Nginx instance to just
  host an "index.html" for demonstration purposes. This constitutes the "front
  end" application that your users would load in order to interact with the
  rest of your services.

* "wsgi" is a Flask-based WSGI application, implemented in Python. Flask is a
  wonderful tool, and can be used (as in this case) to construct procedural
  endpoints--including to other services, as well. In this case, our Flask
  instance will include an endpoint that uses the "redis3" Python package to
  reach out to the Redis database working within another container.

* "data" is a Redis-based database that populates on startup from an
  "appendonly.aof" file. This is the only stateful service in the architecture,
  which is a HUGE benefit of this approach. Everything else can be restarted or
  balanced across multiple instances with nary a hiccup.

So, to summarize, "user" hosts our static files (.HTML, .CSS, .JS, etc.) for
the front end; "wsgi" is a Flask-based Python application; and "data" is a
Redis database. Simple.

The Compose Suite
-----------------

Before we dive into the reverse proxy, let's look at how Docker Compose is used
to manage (build, launch) our "suite" of containers. For now, we'll expose
everything on public ports since there's no reverse-proxy yet.

Within the "docker-compose.yml" file, each service will have its own entry. In
this case, we'll use the "build" field in each service entry to tell Docker
Compose where it can dynamically build each image without any extra "pull"
operations (though this would change in production, of course). Here's how the
"data" service might be listed::

  services:
    data-svc:
      restart: on-failure
      build: ./data
      ports:
        - 8081:80

One key thing to note here: the "data-svc" name will be used as the actual
"name" of the service within the internal network Docker Compose sets up. This
is very important (if implicit) because it determines how our services
(including Nginx request forwarding) will be able to locate other services at
runtime without knowing what IP addresses each service will have ahead of time.

Note, in this case, we'll use the port 8081 to test access to the contianer.
Once the reverse-proxy is up, we can completly remote the "ports" entry for
each of the individual services to "hide" them from the outside.

Nginx Reverse-Proxy: Configuration
----------------------------------

We're going to add one more container, which will define our reverse proxy
using an Nginx configuration. We'll call this one "revprox". First, we'll look
at how it's configured, then we'll look at how it can be "folded into" our
Docker Compose suite.

The "revprox" Dockerfile simply loads the "nginx" reference image and copies a
local "nginx.conf" file to the appropriate internal location::

  FROM nginx
  COPY ./nginx.conf /etc/nginx/nginx.conf

It's the "nginx.conf" file where the real magic happens, of course. Let's dive
in. At the top level, we'll define worker, event, and error information::

  worker_processes auto;
  events { worker_connections 1024; }
  error_log /dev/stdout info;

Within an "http" block, we'll define a "server" that will handle our routing on
port 80 (you can change this later to forward to 443 if you set up
certificates, of course)::

  http {
    server {
      listen 80;
      ...
    }
  }

Within the "server" block, after the "listen" directive, we'll list all of the
(two) forwarding rules for individual containers. Note that this does NOT
include the "data" service, because we will be hiding the database from
external eyes. Here's the entry for "user", which you can copy-paste for "wsgi"
(replacing "user" with "wsgi", of course)::

  location /user/ {
    proxy_pass http://user-svc:80/;
  }

One key concept here: As far as Docker Compose is concerned, the Nginx
reverse-proxy is "just" another container operating on the internal network.
Therefore, it can use the service names (as defined in the "docker-compose.yml"
file) to look up the internal addreses of the individual containers. In this
case, we use the default ports (80) for each one because Docker Compose is
organizing them on different IP addresses--we don't have to worry about
deconfliction. Pretty neat, if you ask me.

These location rules will route requests beginning with the "/user" (or
"/wsgi") pattern to the appropriate endpoints. However, what happens when you
just browse to the root endpoint ("/")? It can be useful to define specific
"default" endpoints (for both "/" and "/index.html", which some browsers will
check as a fallback). This is easily done by an explicit mapping ("=") used by
two additional "location" block directives::

  location = / {
    proxy_pass http://user-svc:80/;
  }

  location = /index.html {
    proxy_pass http://user-svc:80/;
  }

In this case, we route the root endpoint to our static file web application.
Hopefully this makes sense. There's a *LOT* more you can do with the Nginx
configuration, of course (from HTTP support to TLS restrictions to caching...),
but for now we have something that works (and can be upgraded transparently),
so let's look at how this new service can be folded into our
"docker-compose.yml" file to complete our SOA.

Nginx Reverse-Proxy: Integration
--------------------------------

Back in our "docker-compose.yml" file, we'll add another entry for the
"revprox" service. At first, this will look a lot like the others::

  revprox-svc:
    restart: on-failure
    build: ./revprox
    ports:
      - 80:80

We're also going to add a "depends_on" property to tell Docker Compose that
the reverse proxy really shouldn't be fully operational until the other
services it forwards to have been spun up. These will be referenced (again) by
the service name we used to define their entries earlier in the
"docker-compose.yml" file::

  depends_on:
    - data-svc
    - user-svc
    - wsgi-svc

With that, you can actually run "docker-compose build" and "docker-compose up"
to verify that everything is spun up and forwarded correctly. But there's one
more step: Since the reverse proxy is forwarding requests from port 80 to the
individual containers, we no longer need to expose them within the
"docker-compose.yml" file. So: delete all "ports" properties for every
indvidual container, and you're good to go.

Finally
-------

Believe it or not, that's actually it. Most setup doesn't have to be too
complicated. Once you have this pattern working, it's easy to extend in many
differnt directions incrementally. We've already mentioned several upgrades you
can make to your Nginx reverse-proxy configuration; you could also add in a
multitude of other services, making only a small number of changes each time:

* Add the service to the Docker Compose configuration

* Add the appropriate routing rule to the Nginx configuration

I've uploaded the "DTS" repository to my GitHub; I hope you find it to be a
useful reference:

  https://github.com/Tythos/dts
