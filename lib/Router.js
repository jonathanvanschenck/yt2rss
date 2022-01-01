const { EventEmitter } = require("events");
const { Router : _Router } = require("express");
const { join } = require('path');

/**
 * Base router class
 */
class Router extends EventEmitter {
    /**
     * Router constructor
     *
     * @param {String} [namespace=""] - namespace of router
     */
    constructor(namespace="") {
        super();
        this._namespace = namespace;
        this._router = _Router();
    }


    /**
     * Initialize the router instance
     *
     * @param {Object} opts
     * @param {Connection|Pool} opts.database - the database handle created by the server
     * @param {Logger} opts.log - the logger created by the server
     * @param {MP3Manager} opts.mp3_manager - the manager for the mp3s
     * @param {String} opts.virutal_path - the path prefix of this router (i.e. '/api/auth`)
     * @param {Object} opts.proxy_params - parameters for the proxy
     * @param {String} opts.proxy_params.address
     * @param {Number} opts.proxy_params.port
     * @param {String} opts.proxy_params.protocol
     */
    init ({ database, log, mp3_manager, virtual_path, proxy_params }) {
        this._database = database;
        this._mp3_manager = mp3_manager;
        this.virtual_path = virtual_path;

        this._protocol = proxy_params.protocol || "http";
        this._address = proxy_params.address || "localhost";
        this._port = proxy_params.port || 1234;

        // Prepend all logs from this router with the namespace
        this._log = new Proxy(log,{
            get : (log, property, self) => { // eslint-disable-line no-unused-vars
                return (...args) => { log[property]("Router '"+this.namespace+"' :",...args); };
            }
        });

        this.emit("init", { database, log, mp3_manager, virtual_path });
    }

    /**
     * Namespace getter
     */
    get namespace() { return this._namespace; }

    /**
     * Express router object getter
     */
    get router() { return this._router; }

    /**
     * Database instance getter
     */
    get database() { return this._database; }

    /**
     * MP3Manager instance getter
     */
    get mp3_manager() { return this._mp3_manager; }

    /**
     * Logger instance getter
     */
    get log() { return this._log; }

    get_url_path_for( url ) {
        return `${this._protocol}://` + join(`${this._address}:${this._port}`, this.virtual_path, url);
    }

    /**
     * HTTP GET request
     *
     * @param {string} path - the path for this route
     * @param {Object} config - middleware configuration, currently not used
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express.
     *                        The expected call signature is (request, response).
     */
    GET(path, config, fn) {
        this._method("get", path, config, fn);
    }

    /**
     * HTTP POST request
     *
     * @param {string} path - the path for this route
     * @param {Object} config - middleware configuration, currently not used
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express. The
     *                        expected call signature is (request, response).
     */
    POST(path, config, fn) {
        this._method("post", path, config, fn);
    }

    /**
     * HTTP PATCH request
     *
     * @param {string} path - the path for this route
     * @param {Object} config - middleware configuration, currently not used
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express.
     *                        The expected call signature is (request, response).
     */
    PATCH(path, config, fn) {
        this._method("patch", path, config, fn);
    }

    /**
     * HTTP PUT request
     *
     * @param {string} path - the path for this route
     * @param {Object} config - middleware configuration
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express.
     *                        The expected call signature is (request, response).
     */
    PUT(path, config, fn) {
        this._method("put", path, config, fn);
    }

    /**
     * HTTP DELETE request
     *
     * @param {string} path - the path for this route
     * @param {Object} config - middleware configuration, currently not used
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express. The
     *                        expected call signature is (request, response).
     */
    DELETE(path, config, fn) {
        this._method("delete", path, config, fn);
    }



    /**
     * Internal express get/post/put/delete wrapper
     * object to aid with error logging and expose a more convient interface for other
     * internal methods. Note that this method does not expect the provided express handler
     * function (`fn`)  to take the parameter `next`, so no other middleware will act
     * on the express request after thsi method returns.
     *
     * @param {string} method - the method for the express router to use.
     *                        Must be "get", "put", "patch", "post" or "delete".
     * @param {string} path - the file path to target for get/post/put/delete
     * @param {Object} config - middleware configuration, currently not used
     * @param {function} fn - the handler (router function) for this route. Will get
     *                        called with request/response objects from Express. The
     *                        expected call signature is (request, response).
     * @private
     */
    _method(method, path, config, fn) {
        // get the proper express router type (GET,POST,PUT,DELETE)
        this.router[method](path, async (req, res)=>{
            try {
                await fn(req, res);
            } catch(e) {
                this._handle_error(e, res);
            }
        });
    }


    /**
     * JSON Error Handler
     *
     * This is the default handler for the METHOD calls (GET, etc). It will send HTTP
     * error codes, log some stuff, let the user know a limited amount about what is going on.
     *
     * @param {Error} e - the error that was thrown
     * @param {object} res - the Express response object
     * @private
     */
    _handle_error(e, res){

        this.log.error("Error: " + e.stack);
        Router.send_error( res, 500, "internal error" );
    }

    /**
     * Send a response
     *
     * @param {Response} response - The Express response object
     * @param {number} code - the status code ( usaully 200 );
     * @param {String|Object|null} [body=null] - the body of the response, will be stringified if an object
     * @param {String|null} [content_type=null] - the content type of the body
     */
    static send ( response, code, body=null, content_type=null ) {
        if (content_type) response.set('Content-Type', content_type);
        response.status(code);
        if (body) {
            if ( typeof(body) !== "string" ) body = JSON.stringify(body);
            response.send(body);
        } else {
            response.send();
        }
    }

    /**
     * Send a response with a json body
     *
     * @param {Response} response - The Express response object
     * @param {number} [code=204] - the status code ( usaully 204 );
     * @param {Object|null} [body=null] - the body of the response, will be stringified if an object
     */
    static send_response ( response, code=204, body=null ) {
        return this.send( response, code, body, 'application/json' );
    }

    /**
     * Send an error message
     *
     * @param {Response} response - The Express response object
     * @param {number} code - the status code
     * @param {string} text - the message of the error
     */
    static send_error ( response, code, text ) {
        return this.send( response, code, { message : text || 'error' }, 'application/json' );
    }

}

module.exports = Router;
