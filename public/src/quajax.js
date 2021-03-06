/*
*/

define(function(require, exports, module) {
    function get(url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                cb(xhr.responseText);
            }
        };
        xhr.open('GET', url);
        xhr.send();
    }

    function gets(urls, cb) {
        var results = new Array(urls.length);
        results.fill(null);
        urls.forEach(function(url, ndx) {
            get(url, function(res) {
                results[ndx] = res;
                if (results.every(function(v) { return v != null; })) {
                    cb.apply(null, results);
                }
            });
        });
    }

    Object.assign(exports, {
        __name__: "quajax",
        __version__: "0.0.1",
        get: get,
        gets: gets
    });
});
