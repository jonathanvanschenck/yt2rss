#! /usr/bin/node

const fs = require("fs");
const path = require("path");

(async () => {
    let args = process.argv.slice(2);
    if ( !args || args.length < 6 || args.reduce((acc,cur) => acc || cur === undefined, false) ) {
        console.error("Missing arguments");
        process.exit(1);
    }
    let [ proxy_address, proxy_port, webservice_address, webservice_port, mp3_manager_url, mp3_expiration_time_ms ] = args;

    try {

        let external_obj = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../mysql_config.json")).toString());
        let config = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../config.json.template")).toString());

        // Create configurations
        config["mysql"] = external_obj.mysql;

        if ( proxy_address ) config["proxy_params"].address = proxy_address;
        if ( proxy_port ) config["proxy_params"].port = +proxy_port;

        if ( webservice_address ) config["webservice"].address = webservice_address;
        if ( webservice_port ) config["webservice"].port = +webservice_port;

        if ( mp3_manager_url ) config["mp3_manager"].url_path = mp3_manager_url;
        if ( mp3_expiration_time_ms ) config["mp3_manager"].expiration_time_ms = +mp3_expiration_time_ms;

        console.log("Successfully Complete");

        fs.writeFileSync( path.resolve(__dirname, "../config.json"), JSON.stringify( config, null, '    ' ));

    } catch (e) {

        console.error(e.stack);
        process.exit(1);
    }

    process.exit(0);
})();
