const { request : _request } = require("http");

/**
 * Promisify the core http.request function with nice default
 *
 * @param {String} method - the method of the request ('get', 'post', 'put', 'delete')
 * @param {String||URL} url - the url of the request
 * @param {Object} [opts={}] - an options object to be passed to http.request
 * @param {Object||String} [body=''] - the body of the request, must be JSON-valid or empty, ignored for 'get' and 'delete'
 * @return {Promise<http.IncomingMessage>} Resolves to the server response, but with additonal `.data` and `.type` attributes for the response data (auto parsed if JSON), and basic content type
 */
function request(method, url, opts={}, body='') {
    return new Promise((resolve, reject) => {
        let include_body = ( body && ['post','put'].includes(method.toLowerCase()) );
        let options = Object.assign({
            method : method,
            headers : {
                'Content-Type' : 'application/json'
            }
        }, opts);

        if ( include_body ) {
            if ( typeof(body) !== "string" ) body = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        let req = _request(url, options, (res) => {
            res.setEncoding('utf-8');
            res.data = '';
            res.on('data', (chunk) => res.data = res.data + chunk);
            res.on('end', () => {
                let parser;
                res.type = res.headers['content-type'];
                try {
                    res.type = res.type.match(/(application|text)\/([^;]+)/)[2];
                } catch (e) {
                    resolve(res);
                    return;
                }
                if ( res.type.includes("json") ) {
                    try {
                        res.data = JSON.parse( res.data || '' );
                    } catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(res);
                } else {
                    resolve(res);
                }
            });
        });

        req.on('error', reject);

        if ( include_body ) {
            req.write(body);
        }

        req.end();
    });
}


module.exports = exports = {
    $ : request,
    GET : ( url, opts ) => request('get', url, opts),
    DELETE : ( url, opts ) => request('delete', url, opts),
    POST : ( url, opts, body='' ) => request('post', url, opts, body),
    PUT : ( url, opts, body='' ) => request('put', url, opts, body),
}
