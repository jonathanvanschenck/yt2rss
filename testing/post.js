#!/usr/bin/node

const { join } = require('path');

const { POST } = require("./lib/requester.js");

let config = require('./config.json');

let [ url ] = process.argv.slice(2);
if ( !url ) {
    console.error(`invalid url '${url}'`)
    process.exit(1);
}

let URL = 'http://' + join(`${config.webservice.address}:${config.webservice.port}`,url);

POST(URL).then((res) => {
    if ( res.statusCode == 200 ) {
        console.log(res.data);
    } else {
        console.error(res.data);
    }
}).catch(console.error);
