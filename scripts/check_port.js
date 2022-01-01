#!/usr/bin/node

const net = require('net');

let [ port, address ] = process.argv.slice(2);
if ( !port ) {
    console.error("Insufficent arguments");
    process.exit(1);
}

address = address ? address : "localhost";

console.log(`Beginning to wait for connection at ${address}:${port}`);

function connect(port, address) {
    return new Promise((res,rej) => {
        let sock = new net.Socket();
        sock.on('error',(e) => {
            rej(e);
            sock.destroy();
        });
        sock.on('connect',() => {
            res();
            sock.destroy();
        });
        sock.connect(port, address)
        setTimeout(() => {
            rej(new Error("Connection timed out"));
            sock.destroy();
        }, 3000)
    });
}

(async() => {
    let stop = false;
    while (!stop) {
        await connect(port, address).then(() => { stop = true; }).catch(async(e) => {
            if ( e.message.includes("ECONNREFUSED") ) {
                console.log("Connection unavailable, trying again in 1 second");
                await new Promise(res => setTimeout(res,1000)); 
            } else {
                console.log("Connection unavailable because :",e);
                await new Promise(res => setTimeout(res,1000)); 
            }
        })
    }
    console.log("Connection stable");
})();


