let [ config_fp ] = process.argv.slice(2);
if ( !config_fp ) config_fp = 'config.json';

const http = require("http");
const nconf = require('nconf');
const bunyan = require('bunyan');
const mysql = require('mysql2/promise');
const { resolve, join } = require('path');

nconf.argv().file({ file: config_fp });

const factory = require("./lib/app_factory.js");


/**
 * Starts the server
 *
 * @param {ExpressApp} express_app - the express api into which the routes should be loaded
 * @param {Logger} log - the bunyan logger reference
 * @param {array} parameters the parameters to pass to listen() (`[ port, address]`)
 * @return {http.Server}
 */
function start_server( express_app, log, parameters ) {

    let server = http.createServer()
        .on("request", express_app)
        .on("listening", () => log.info(`Webservice listening on http://${server.address().address}:${server.address().port}/`));

    server.listen.apply(server, parameters);
    return server;
}

/**
 * Starts the application
 *
 * @return {http.Server[]} list of servers running the application
 */
async function start() {
    let log = require("bunyan").createLogger({"name":"yt2rss"});
    log.level( nconf.get("log_level") || "debug" );

    let database = await mysql.createPool(nconf.get('mysql'));

    let mp3_config = nconf.get("mp3_manager");
    if ( !mp3_config ) mp3_config = {};
    if ( nconf.get("public_folder") ) {
        mp3_config.public_path = nconf.get("public_folder")
    }
    let proxy_params = nconf.get("proxy_params");
    if ( !proxy_params ) proxy_params = {};
    if ( nconf.get("public_folder") ) {
        mp3_config.public_path = nconf.get("public_folder")
    }
    let app = factory({
        log : log,
        database : database,
        mp3_manager_config : mp3_config,
        proxy_params : proxy_params,
        public_folder : nconf.get("public_folder") ? resolve(join(__dirname,nconf.get("public_folder"))) : undefined,
        router_list : nconf.get("router_list") ? nconf.get("router_list").map(fp => resolve(join(__dirname,fp))) : [],
        middleware_list : nconf.get("middleware_list") ? nconf.get("middleware_list").map(fp => resolve(join(__dirname,fp))) : [],
    });

    // TODO : attach swagger docs

    // Start web service (address/port config, and also "listen" config)
    let servers = [];
    if ( nconf.get("webservice").port && nconf.get("webservice").address ) {
        servers.push(start_server(
            app,
            log,
            [nconf.get("webservice").port, nconf.get("webservice").address]
        ));
    }
    if ( Array.isArray(nconf.get("webservice").listen) ) {
        for (let parameters of nconf.get("webservice").listen) {
            servers.push(start_server(
                app,
                log,
                parameters
            ));
        }
    }

    return servers;
}


start();
