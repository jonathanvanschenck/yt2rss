const express = require("express");
const morgan = require('morgan');
const { resolve, join } = require("path");
const Router = require("./Router.js");
const MP3Manager = require("./MP3Manager.js");

/**
 * Attach a router object to an express app
 *
 * @param {ExpressApp} express_app
 * @param {Logger} log
 * @param {Pool|Connection} database
 * @param {MP3Manager} mp3_manager
 * @param {Object} proxy_params
 * @param {String} fp - file path to router module
 * @param {String} [prefix="/api"]
 */
function attach_router ( express_app, log, database, mp3_manager, proxy_params, fp, prefix="/api" ) {
    try {

        log.info("Attaching Router : " +fp);

        let router = require( resolve(fp) );
        let virtual_path = join( prefix, router.namespace );

        router.init({ database, log, mp3_manager, proxy_params, virtual_path });

        express_app.use( virtual_path, router.router );

        // Log the routes that were included in this router
        for(let item of router.router.stack) {
            let methods=Object.keys(item.route.methods).map((i)=>i.toUpperCase()).join(" ");   //"GET POST PUT" etc
            log.info("... "+methods+" "+join( virtual_path, item.route.path ));
        }

    } catch(e) {
        log.error(`Error loading route ${fp}: ` + e.stack||e);
    }
}

/**
 * Generate an express application
 *
 * @param {Object} config
 * @param {Connect|Pool} config.database - A promise-mysql database connection
 * @param {Logger|undefined} [config.log=undefined] - bunyan-esk logger instance, or undefined for no logging
 * @param {Path[]} [config.router_list=[]] - List of absolute file paths to each router
 * @param {Path[]} [config.middleware_list=[]] - List of absolute file paths to each middleware
 * @param {Path|undefined} [config.public_folder=undefined] - Path to a public folder, which is served on '/'
 * @param {Object} [config.mp3_manager_config={}] - Configuration for the mp3_manager
 * @param {Object} [config.proxy_params={}] - Configuration for the proxy
 */
function app_factory({ database, log, router_list=[], middleware_list=[], public_folder, mp3_manager_config={}, proxy_params={} }={}) {
    let app = express();

    let mp3_manager = new MP3Manager(mp3_manager_config);
    mp3_manager.init({ database, log, proxy_params });

    let _log, morgan_middleware;
    if ( log ) {
        morgan.token('user_id', (req) => {
            if ( req.auth ) {
                return req.auth.username;
            }
            return `Unauthorized`;
        });

        // A stream to pipe morgan (http logging) to bunyan
        const stream = require("stream");
        let info_log_stream = new stream.Writable();
        info_log_stream._write = (chunk, encoding, done) => {
            log.info(chunk.toString().replace(/^[\r\n]+|[\r\n]+$/g,""));
            done();
        };

        // Morgan HTTP logging
        morgan_middleware = morgan(
            ':remote-addr - :user_id ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms',
            { "stream" : info_log_stream }
        );
    } else {
        _log = {
            debug : () => {},
            info : () => {},
            warn : () => {},
            error : () => {}
        };
    };

    middleware_list.forEach(fp => {
        log.info("Attaching Middleware : " +fp);
        app.use( require(fp) );
    });

    if ( morgan_middleware ) app.use(morgan_middleware);

    router_list.forEach(fp => {
        attach_router( app, log, database, mp3_manager, proxy_params, fp );
    });

    if ( public_folder ) app.use("/", express.static(public_folder));

    // Accept JSON formatted posts
    app.use(express.json({
        type: ["application/json"]
    }));

    // Handle 404
    app.use(function(req, res) {
        Router.send_error( res, 404, "404: Not found" );
    });

    return app;
}

module.exports = exports = app_factory;
