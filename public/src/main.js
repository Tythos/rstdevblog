/*
*/

require(["quajax", "rst2html", "handlebars", "jtx"], function(quajax, rst2html, handlebars, jtx) {
	// Initialize listings object, register handlebars helper
	listings = {};
	handlebars.registerHelper("formatDate", function(datetime) {
		return jtx.Date.format(new Date(parseInt(datetime)), "%Y-%m-%d @ %H:%M");
	});

	function clear(element) {
		// Removes all children from element
		while (element.childElementCount > 0) {
			element.removeChild(element.children[0]);
		}
	}

	function onError() {
		// On error, we redirect to the client-side error page
		window.location.href = "/?error";
	}

	function renderArticle(hbsPath, templateArgs, afterRender) {
		/* Loads handlebars template from given path, populates with arguments,
		   then writes results to article element. Invokes a callback, if
		   given, once rendering is complete, with article element as argument.
		*/
		if (typeof(templateArgs) == "undefined") { templateArgs = {}; }
		if (typeof(afterRender) == "undefined") { afterRender = function() {}; }
		var article = window.document.querySelector("#article");
		clear(article);
		quajax.get(hbsPath, function(hbs) {
			article.innerHTML = handlebars.compile(hbs)(templateArgs);
			afterRender(article);
		});
	}

	function onKeywordListing(article) {
		/*
		*/
		var ai = article.querySelectorAll("a");
		ai.forEach(function(a) {
			a.addEventListener("click", onKeywordClick);
		});
	}

	function onKeywordClick(event) {
		/*
		*/
		var keyword = event.target.textContent;
		var articles = [];
		listings.forEach(function(listing) {
			if (listing.keywords.indexOf(keyword) >= 0) {
				articles.push(listing);
			}
		});
		quajax.get("/hbs/listings.hbs", function(hbs) {
			var article = window.document.querySelector("#article");
			var div = article.children[0];
			clear(article);
			article.appendChild(div);
			var div = document.createElement("div");
			div.innerHTML = handlebars.compile(hbs)({ listings: articles });
			article.appendChild(div);
		});
	}

	function getListingByName(name) {
		/* Returns listing Object matching given name
		*/
		for (var i = 0; i < listings.length; i++) {
			var listing = listings[i];
			if (listing.name == name) {
				return listing;
			}
		}
		console.error("Unable to match article with name '" + name + "'");
	}

	function getPermalink(listing) {
		/* Creates a permanent link label for the given listing
		*/
		var div = window.document.createElement("div");
		var a = window.document.createElement("a");
		div.setAttribute("class", "permalink");
		a.textContent = "(permanent link to this article)";
		a.href = window.location.protocol + "//" + window.location.host + "/?name=" + listing.name;
		div.appendChild(a);
		return div;
	}

	function onSearchFocus(event) {
		/* Clears search input and resets color style
		*/
		var input = window.document.querySelector("#searchInput");
		input.value = "";
		input.setAttribute("style", "");
	}

	function onSearchSubmit(event) {
		/* Renders subset of listings with any search terms in keywords
		*/
		event.preventDefault();
		var input = window.document.querySelector("#searchInput");
		var terms = input.value.toLowerCase().split(/\s+/);
		var nMatches = [];
		listings.forEach(function(listing) {
			nMatches.push(jtx.Array.intersect(terms, listing.keywords).length);
		});
		listings = jtx.Array.argsort(listings, nMatches); // most matches to least
		var isMatches = nMatches.map(function(n) { return n > 0; });
		var matches = jtx.Array.mask(listings, isMatches);
		if (matches.length > 0) {
			renderArticle("/hbs/listings.hbs", {listings: matches});
		} else {
			renderArticle("/hbs/404.hbs", {}, function(element) {
				var div = window.document.createElement("div");
				div.textContent = "No matching search results. Sorry!";
				div.setAttribute("style", "font-size:0.5em;font-style:italic;");
				element.children[element.children.length-1].appendChild(div);
			});
		}
		window.document.title = "Search Results";
	}

	// Initialize after listings are loaded
	quajax.get("/listings", function(jsonText) {
		listings = JSON.parse(jsonText);

		// Determine routing possibilities:
		var query = window.location.search;
		var mBy = query.match(/^\?by=(.+)$/)
		var mName = query.match(/^\?name=(.+)$/)
		if (mName) {
			// Specific article
			//console.log("Loading article at '" + query + "'");
			quajax.get("/article" + query, function(rst) {
				var div = window.document.createElement("div");
				div.innerHTML = rst2html(rst);
				var article = window.document.querySelector("#article");
				clear(article);
				article.appendChild(div);
				var listing = getListingByName(mName[1])
				window.document.title = listing.title;
			});
		} else if (mBy) {
			// Category listing
			//console.log("Loading category listing at '" + query + "'");
			if (mBy[1] == "date") {
				var args = listings.map(function(listing) { return listing.date; });
				listings = jtx.Array.argsort(listings, args);
				renderArticle("/hbs/listings.hbs", {listings: listings});
				window.document.title = "Articles by Date";
			} else if (mBy[1] == "keyword") {
				var keywords = [];
				listings.forEach(function(listing) {
					keywords = Array.concat(keywords, listing.keywords);
				});
				keywords = jtx.Array.unique(keywords);
				renderArticle("/hbs/keywords.hbs", { keywords: keywords }, onKeywordListing);
				window.document.title = "Articles by Keyword";
			} else {
				onError();
			}
		} else if (query.match(/^$/)) {
			// Index/lastest
			//console.log("Loading index/latest");
			var args = listings.map(function(listing) { return listing.date; });
			listings = jtx.Array.argsort(listings, args);
			quajax.get("/article?name=" + listings[0].name, function(rst) {
				var div = window.document.createElement("div");
				div.innerHTML = rst2html(rst);
				var article = window.document.querySelector("#article");
				clear(article);
				article.appendChild(div);
				window.document.title = listings[0].title;
				article.appendChild(getPermalink(listings[0]));
			});
		} else {
			// Bad query; also triggered by "onError()" redirect
			//console.log("Bad query");
			renderArticle("/hbs/404.hbs");
			window.document.title = "NOPE!";
		}

		// Add event listeners for search bar
		window.document.querySelector("#searchInput").addEventListener("focus", onSearchFocus);
		window.document.querySelector("#searchForm").addEventListener("submit", onSearchSubmit);
	});
});
