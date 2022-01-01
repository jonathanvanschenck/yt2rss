#!/usr/bin/node

const fs = require('fs');
const path = require('path');

let [ mysql_host, mysql_database, mysql_user, mysql_password ] = process.argv.slice(2);

let obj = {
    "DO NOT CHANGE" : "MANAGED BY SETUP SCRIPT",
    mysql : {
        host : mysql_host,
        database : mysql_database,
        user : mysql_user,
        password : mysql_password
    }
};

let string = "";
string = string + `MYSQL_RANDOM_ROOT_PASSWORD="true"\n`
string = string + `MYSQL_HOST="${mysql_host}"\n`;
string = string + `MYSQL_DATABASE="${mysql_database}"\n`;
string = string + `MYSQL_USER="${mysql_user}"\n`;
string = string + `MYSQL_PASSWORD="${mysql_password}"\n`;

fs.writeFileSync( path.resolve(__dirname, "../mysql_config.json"), JSON.stringify( obj, null, '    ' ));
fs.writeFileSync( path.resolve(__dirname, "../db/.env"), string );
