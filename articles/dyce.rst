The Dyce Pattern
================

This is effectively part two of an earlier article I wrote, "DTS", that
described a composition of service-oriented architectures, or SOA, using Docker
Compose and an nginx-based reverse-proxy. The article can be read here:

  https://dev.tythos.net/?name=dts

.. contents::

Refresher
---------

That stack looked roughly like this:

* The nginx-based reverse-proxy ("nrp") element, which we also called
  "revprox", was used for traffic routing of all services, in conjunction with
  the configuration defined within the "docker-compose.yml" file itself.

* A user client was defined as a static-file web application hosted in its own
  nginx container. While technically routed "behind" the reverse-proxy, the
  actual application code was purely JS/HTML/CSS, so in reality this code was
  being "evaluated" within the client browser and reaching out to the other
  elements using XHR requests (or, potentially, Web Socket connections).

* Encapsulated services were designed around a WSGI interface using a Flask
  application, served within their own container by a production-quality
  asynchronous "gevent" server. These were entirely stateless for potential
  replication purposes.

* State was organized entirely within a database layer; in this case, we used
  a Redis-based container that was "hidden" behind the reverse-proxy (it could
  not be accessed directly from external resources) so that only encapsulated
  services could use them.

But deploying a stack like this "in the wild" means there are several other
related components that would need to go with it. Putting these elements
together gives us a nicely-organized six-element software engineering pattern
that has been incredibly useful across a wide variety of projects. I'm calling
it a "dyce" pattern, and if you look at the following diagram, you can probably
tell why:

  https://dev.tythos.net/dyce.png

So, we've covered the "user" element, the "wsgi" element, and the "data"
element. The fourth element, of course, is "nrp", the nginx reverse-proxy that
binds all the elements together and defines (along with the configuration in
the "docker-compose.yml" file) the routing rules they use. That means there are
two new elements at work here: "auth" and "dash".

Auth
----

Every application needs a way to enforce access control. In our case, we had
assumed that public access of the user layer was fine, and that access to the
remaining elements would be enforced by the network configuration (blocking
direct external access to the database, for example). In the "live" world, this
is not realistic. We need an auth/auth service (authentication and
authorization) that can be used to control who can access what. As a reminder:

* "Authentication" means verifying the user is who they say they are. This is
  classically enforced by some sort of secured password database but can, in
  recent years, also be extended by two-factor authentication and other more
  robust login credential verification schemes.

* "Authorization" means verifying the user is allowed to do what they are
  trying to do. comparing actions the user wishes to take against a
  known set of privileges (typically defined by group membership).

Keycloak
````````

But, we don't want to role our own. This is one place, given all that is at
stake, where you *really* want to leverage the expertise of a community that
knows what they are doing. "DON'T ROLE YOUR OWN SECURITY SOLUTIONS" is a mantra
that you should get tattooed on your forehead. Seriously.

We need something hardened, something verified, and (ideally) something that
could easily support both integration with our nginx-based scheme here, perhaps
as a form of middleware with minimal modification to the other service
configurations, but still give us flexibility to extend across a variety of
auth/auth schemes. In other words, we want to use Keycloak:

  https://hub.docker.com/r/jboss/keycloak

If you've used Keycloak before, you know why. It's beautifully encapsulated,
integrates well, can be spun up with minimal expertise required, and can extend
(without significant headache) across a wide variety of auth/auth schemes. From
the Wikipedia summary:

  Keycloak is an open source software product to allow single sign-on with
  Identity and Access Management aimed at modern applications and services...
  [this] project is under the stewardship of Red Hat who use it as the upstream
  project for their RH-SSO product.
  
In our case, we'll focus on an OIDC (OpenID Connect) protocol, based on an
OAuth 2.0 exchange that maps well to middleware insertion.

OpenResty
`````````

But we're not using Apache, we're using nginx, which doesn't have the same
well-rounded environment or integration with middleware modules. We don't want
to hamfist-dely force OAuth exchanges into each individual service, though; we
want to enforce it at the reverse-proxy layer, where we can "assert" access
control across as much of the architecture as we want.

How do we get middleware-like capability injection for nginx, then? In this
case, I decided to extend the reverse-proxy to OpenResty. OpenResty is
described as a "full-fledged web platform", but really it's a transparent
extension of nginx in an environment that lets you "hook" in Lua-based modules
to extend capability with minimal modification to your existing deployment:

  https://openresty.org/en/

It's a beautiful thing, actually, and I would encourage you to mess around with
it. The JIT Lua interpreter doesn't add a huge performance penalty to the
lean-and-mean production-quality nginx, and (since it's Lua-based) it's an easy
matter to install additional modules from the package manager.

First, we need to switch out the base container itself, from "nginx" to
"openresty/openresty". If you're starting from the DTS project, you'll find
this requires a few other changes to the Dockerfile:

* The "FROM" directive is now "openresty/openresty:alpine-fat"

* We add a "RUN" directive to install (using the "luarocks" package manager)
  our OIDC library; in this case, we're using "lua-resty-openidc" (see
  https://luarocks.org/modules/hanszandbelt/lua-resty-openidc for more details)

* We copy the nginx.conf file to a different path, "/usr/local/openresty/nginx/conf/"

* We'll also have some Lua scripts that define our OIDC configuration and the
  specific "hooks" used by the OpenResty server. These will need a "COPY"
  directive, too, to place them in "/opt/app".

About those scripts. You will glean a configuration from the Keycloak setup
later, but for now you can copy-paste from the following file:

  https://github.com/Tythos/dyce/blob/main/nrp/nginx_lua/oidc/acc.lua

Some key things to note:

* Most of this is just specifying OIDC configuration--routes, secrets, schemes,
  etc.--since the logical behavior of the OIDC process itself is pretty well
  defined and standardized

* Note the "require('resty.openidc').authenticate(opts)" line, where the real
  magic happens (within the library, of course) by extending the nginx request
  handler. It's followed by some error handling.

There are several key path values that may take some trial-and-error:

* The "discovery" URL is for an INTERNAL (e.g., from the reverse-proxy to the
  Keycloak image) request. Discovery informs the reverse-proxy what
  configurations are available for what realms, where to route different
  requests, etc.

* The "redirect_after_logout_uri" value is for an EXTERNAL (e.g., URL to which
  the user's browser will be pointed) request.

* The "client_id" and "client_secret" values will be specific to your Keycloak
  configuration; in this case, "client" is the service making a request to the
  Keycloak instance in order to verify auth/auth of a user. You can assign
  these values manually, but I find it helps to configure them once within
  Keycloak then "export" the realm for dynamic loading on container startup, in
  which case you can set them once in the Lua script and not worry about it
  again (though the client secret does have to be manually "pasted" back into
  the realm export file--it is "wiped" by default when the JSON is written).

We still need to "hook" in this file from your "nginx.conf", which requires a
few other modifications as well (defining session support, Lua integration
options, and a few other things). Again, you can copy-paste from the following:

  https://github.com/Tythos/dyce/blob/main/nrp/nginx.conf

The magic here mainly happens in the "access_by_lua_block" directive, which is
passed off to the Lua interpreter. In this case, it imports and runs the script
from "oidc/acc" (acc.lua). The rest is straightforward.

Realm Configuration
```````````````````

So we've defined OIDC hooks into an auth/auth service, we still need to setup
Keycloak instance itself. Before you add a Keycloak container to the compose
integration, spin up a standalone instance you can mess around with to
familiarize yourself with the configuration options and ontology:: 

  > docker run -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=foobar -p=8080:8080 jboss/keycloak

There are several key concepts here:

* A "realm" is a collection of all other Keycloak configurations for a
  particular use case. For example, the "master" realm (configured by default)
  controls access to the Keycloak instance/dashboard itself. Your first job is
  to define a new "realm" for the service-oriented architecture.

* Within a realm, you need to define a "client". Clients are services that will
  use Keycloak to authenticate and authorize users that attempt to access them.
  In our case, the "client" is the OpenResty reverse-proxy. If you are looking
  at the "acc.lua" file linked above, you'll see we defined a client with the
  ID "dyce-client" and a specific secret. If you are setting up your own
  client, you will want to make sure it uses the protocol "openid-connect" and
  the access type "confidential".

* A particular client has to authorize itself to Keycloak, too. In this case,
  we will use a "client secret" that you may remember was included in the Lua
  script parameters. Under the "Credentials" tab of the client configuation,
  select the client authenticator "client id and secret", then make sure you
  copy it before it gets "hidden".

* Lastly, you will want to define a "group" to which new users can be added.

Note that we don't worry about adding specific users yet. Instead, once you
have defined the realm configuration, find the "export" button in the
navigation menu on the left-hand side. Ensure "export groups and roles" and
"export clients" are both set to "ON" before you click "Export". This should
give you a JSON file that looks something like the one from our repo:

  https://github.com/Tythos/dyce/blob/main/auth/realm-export.json

Note that you may need to copy-paste the client secret into this file, if the
export process masked it with asterisks ("*****..."). You may also have noticed
that we didn't see an option to export users. Users are not part of the realm
configuration; you have to add them manually (or import them by script from
another dataset). You could also point Keycloak to a database where state for
these profiles can be maintained (by default, we are using Keycloak's internal
database here). Once the Keycloak instance starts up (which takes a while), it
will need to copy the realm JSON to load and specify the "frontend URL" to use
when users are routed across endpoints:

  ENV KEYCLOAK_FRONTEND_URL http://localhost:8090/auth

  ENV KEYCLOAK_IMPORT /tmp/realm-export.json

  COPY realm-export.json /tmp/realm-export.json

Take A Breath
`````````````

Okay, a short break is in order. We've walked through a lot--but we're almost
there. Take a moment to appreciate how much we did, and how painless it was:

* We hooked in auth/auth using an OIDC protocol, effectively as middleware,
  into a super-charged nginx distribution

* We added a new element to our architecture in the form of Keycloak, a
  resilient and world-class security solution for user management

* We defined a realm, including client and group configurations, that can be
  used to tie the reverse-proxy and auth service together.

Pretty cool.

Dash
----

We have one last element to introduce to our pattern. Production (even at the
small, docker-compose scale we are using here) requires monitoring. What kind
of resources are your containers using? Are they all up right now? How hard is
the network being hammered? Have you lost state, and are your databases in
danger of running out of disk space?

There are professional monitoring solutions out there for running out of
full-up orchestration solutions (K8s, etc.). But at the scale of this pattern,
there's a much more simple solution available, defined by a trio of services:

* "cadvisor" to scrape system metrics like memory usage

* "prometheus" to store metrics and track them across time

* "grafana" to present all of these in a nicely-organized web-based UI

This combination makes for a pretty popular dashboard solution. Since there are
technically three containers that we are treating as one service, though, what
you'll see if you look at our "Dyce" repo is a "docker-compose.yml" referenced
within the main "docker-compose.yml", using the "extends:" directive (which is
pretty close to raw magic):

  https://github.com/Tythos/dyce/tree/main/dash

There are a few "tricks" to integrating these together:

* Each service still has to be "pulled" into the top-level "docker-compose.yml"
  file separately, even though they are all defined within the "dash" folder.

* The "cadvisor" service needs to share volume mounts with the host system to
  track key Docker statistics, like container listing and resources at runtime.

* The "prometheus" service needs its own YML configuration, copied into the
  volume at build time, that defines where (and how often) it will retrieve
  metric data and under what logic.

* We also import a trio of configuration files for the Grafana image: a
  "datasource.yml" that defines (automatically, without any additional
  configuration on your part) the datasource (Prometheus) to be used by the
  Grafana dashboad; a "dashboard.yml" that defines what dashboard configuration
  and layout to use for that datasource; and a "docker-monitoring_rev1.json"
  that is effectively a customized "snapshot" of a particular Grafana dashboard
  fine-tuned to report an interesting variety of Docker-related metrics in a
  particular GUI.

You can run each of these individually, or just raise the "docker-compose.yml"
file for the trio right off the bat, if you want to play around with them
before they are "folded" into the rest of our pattern.

Composition
-----------

At this point, we have defined two independent services (auth and dash) to
extend our pattern with, but not yet integrated them into the top-level
compose. This is pretty straightforward for "auth" (aside from the
reverse-proxy configuration we already described in detail), and largely
identical to all of the other services::

  auth-svc:
    restart: on-failure
    build: ./auth
    ports:
    - "8090:8080"

One exception is that we expose the auth service directly to the outside. If we
didn't, you couldn't redirect to authenticate! Since OAuth schemes are
cross-origin by design, and we don't need to worry about CORS requests to auth
from the user application, this is fine (and even desireable).

The "dash" service (or services) is a little more complicated, because each one
has to be imported independently. If you haven't done this before, it looks a
little like this::

  grafana-svc:
    extends:
      file: dash/docker-compose.yml
      service: grafana-svc

In this case, a top-level service is defined that "extends" another service.
Which service? The one defined within a specific compose path ("file:") with a
particular name ("service:"). This is a pretty powerful trick.

Once that's done, you should be able to run a docker-compose "up" command on
the whole recipe. If you see errors, feel free to clone the Dyce repo, but
remember that Keycloak takes a while to spin up, so be patient:

  https://github.com/Tythos/dyce

You should see the following:

* Navigating to the base URL ("http://localhost") should redirect you to a
  Keycloak login page

* Navigating (in a separate tab) to the Keycloak dashboard 
  ("http://localhost:8090") will let you add a specific user with specific
  credentials (but be sure to add the user to the group created earlier).

* You can then use those credentials in the login page from the first step,
  after which you should see the "normal" client UI we were using in DTS
  (including supporting services).

* You can also navigate to the Grafana dashboard ("http://localhost:3000"). We
  use separate credentials here ("admin/admin"); while we could integrate it
  into a separate Keycloak realm or group ("operators", perhaps), the whole
  purpose of the dashboard is to monitor other services--if Keycloak crashes,
  you should be able to tell from the dashboard, instead of being blocked from
  accessing the dashboard because you can't log in--an event that has actually
  occured to multi-billion dollar companies multiple times! Not fun.

Wrapping It Up
--------------

So what do we have here? We've defined a pattern for service-oriented
architectures that is nicely scalebale and reusable:

* A Redis-base database element for state management

* A Python-based WSGI service element, hosted in production-quality gevent,
  for "backend" stateless service encapsulation

* A user application based in static files that can reach out to other services
  on the same origin using reverse-proxy routing, for XMLHttpRequest or
  WebSocket integration

* An authentication service, transparently integrated into the reverse-proxy,
  based on hardened and proven OAuth implementation

* A production monitoring dashboard that is Docker-specific
 
* Nginx (OpenResty, now) to define a reverse-proxy that ties it all together
  with routing rules and OIDC integration

This is pretty neat, and pretty darn powerful. But there's more you could do:

* Nothing is preventing you from adding multiple services or databases to
  organize the backend, within the same architecture

* Additional "middleware"-like features could extend things like SSL
  certificates and WebSocket behaviors

* This approach (based on Docker Compose) is useful up to a point--but
  eventually you'll have to migrate to a full-up cloud enterprise solution,
  complete with Kubernetes orchestration; something like Terraform
  configuration-as-text; and compatibility with (say) AWS or Azure.

But in the meantime, you've got Dyce.
