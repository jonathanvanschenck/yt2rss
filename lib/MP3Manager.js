const { resolve, join } = require('path');
const { readdir } = require('fs/promises');

const spawn_promise = require("./spawn_promise");

const MP3 = require('../models/MP3.js');
const Channel = require('../models/Channel.js');

class MP3Manager {
    constructor({
        public_path = "public",
        url_path = "audio",
        expiration_time_ms = 3*24*60*60*1000 // 3 days
    }) {
        this.file_path = resolve(join(__dirname,"..",public_path,url_path));
        this.url_path = url_path;
        this.expiration_time_ms = parseInt(expiration_time_ms);
    }


    init ({ database, log, proxy_params }) {
        this.log = new Proxy(log,{
            get : (log, property, self) => { // eslint-disable-line no-unused-vars
                return (...args) => { log[property]("MP3Manager :",...args); };
            }
        });
        this.database = database;

        this._protocol = proxy_params.protocol || "http";
        this._address = proxy_params.address || "localhost";
        this._port = proxy_params.port || 1234;

        this.clean_up();
    }

    get_file_path_for(identifier) {
        return resolve(join(this.file_path, `${identifier}.mp3`));
    }

    get_url_path_for(identifier) {
        return `${this._protocol}://` + join(`${this._address}:${this._port}`, this.url_path, `${identifier}.mp3`);
    }

    async reserver_file_for(identifier) {
        let fp = this.get_file_path_for(identifier);
        this.log.info(`Reserving file ${fp}`);

        // Remove any past entries from the database and the file structure
        await MP3.delete(this.database, identifier)
        await spawn_promise('rm', [ fp ])

        return fp;
    }

    async save({
        identifier = '',
        channel_identifier = '',
        title = '',
        description = '',
        author = '',
        published = null,
        duration = 0
    }) {
        let mp3 = new MP3({
            identifier,
            channel_identifier,
            title,
            description,
            author,
            published : published ? new Date(published) : null,
            length : await this.get_num_of_bytes(identifier),
            duration,
            created : new Date(),
            expires : new Date(Date.now() + this.expiration_time_ms),
        });
        let old = await MP3.one(this.database, identifier);
        if ( !old ) {
            return await mp3.save(this.database);
        }
        return mp3.update(this.database)
    }

    async clean_up() {
        this.log.info("Starting to reconcile db and file structure");

        // Build up what SHOULD be perfectly matching lists
        let mp3s = await MP3.unexpired(this.database);
        let files = await readdir(this.file_path);

        let mp3_deletions = [];
        for ( let mp3 of mp3s ) {
            let idx = files.indexOf(`${mp3.identifier}.mp3`);
            if ( idx < 0 ) {
                this.log.info("Found orphaned database entry for " + mp3.identifier + ", removing it");
                mp3_deletions.push(mp3.delete(this.database));
                continue;
            }
            files.splice(idx,1);
        }
        await Promise.all(mp3_deletions);

        let file_deletions = [];
        for ( let file of files ) {
            this.log.info("Found orphaned file " + file + ", removing it");
            file_deletions.push(spawn_promise(
                    "rm", 
                    [resolve(join(this.file_path, file))]
                )
            );
        }
        await Promise.all(file_deletions);

        this.log.info("Finished reconciling db and file structure");
    }

    async get_num_of_bytes(identifier) {
        let fp = this.get_file_path_for(identifier);
        let { code, stdout, stderr } = await spawn_promise('ls', ['-la', fp]);
        if ( code !== 0 ) {
            throw new Error("Something is amiss. . . \n"+stderr)
        }
        return parseInt(stdout.split(/\s+/)[4])
    }

    all_mp3s() {
        return MP3.all(this.database);
    }

    all_mp3s_for(channel_identifier) {
        return MP3.all(this.database, channel_identifier);
    }

    one_mp3(identifier) {
        return MP3.one(this.database, identifier);
    }

    all_channels() {
        return Channel.all(this.database);
    }

    one_channel(identifier) {
        return Channel.one(this.database, identifier);
    }
}

module.exports = exports = MP3Manager;
