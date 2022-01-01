const { createWriteStream } = require("fs");
const ytdl = require('ytdl-core');

const spawn_promise = require("./spawn_promise");

class YTTask {
    constructor(identifier, url, format_obj, video_details) {
        this.identifier = identifier;
        this.url = url;
        this.format = format_obj;
        this.video_details = video_details;

        this._log = [ "Task created\n\n" ];
        this.__prog = 0;
        this.start_time = null;
        this._attempt = 1;

        this.status = "[1] queued";
    }

    retry() {
        this._attempt += 1;
        return this._attempt < 6;
    }

    get runtime() {
        if ( !this.start_time ) return 0;
        return 1e-3*(Date.now() - this.start_time);
    }
    get logs () {
        return this._log.join("");
    }

    log(string) {
        this._log.push(string);
    }

    set_download_percentage(proportion) {
        let string = `[${this._attempt}] downloading (${(proportion*100).toFixed(1)}%)`;
        this.status = string;
        if ( this.__prog + 0.1 < proportion ) {
            this.log(string);
            this.__prog = Math.floor(proportion*10)/10;
        }
    }

    download(fp) {
        // save a reference to the temporary file for the download
        this.fp = fp;
        this.start_time = Date.now();
        return new Promise(async (res,rej)=>{
            // clean up the temporary file
            await spawn_promise('rm', [this.fp]);

            let stream = ytdl(this.url, { format:this.format })
            stream.on('progress',(len, dld, total) => {
                this.set_download_percentage(dld/total);
                if ( dld === total ) res();
            });
            stream.pipe(createWriteStream(this.fp));
        });
    }

    convert(fp) {
        this.status = `[${this._attempt}] converting`;
        return spawn_promise(
            'ffmpeg',
            ['-i', this.fp, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192000', fp],
            {
                stdout : (data) => {
                    this.log(data);
                },
                stderr : (data) => {
                    this.log(data);
                }
            }
        );
    }

    save() {
        this.status = `[${this._attempt}] saving`;
    }

    complete() {
        // clean up the temporary file
        return spawn_promise('rm', [this.fp]).then(() => {
            this.status = "complete";
        });
    }
}

class YTManager {
    constructor () {
        this._queue = [];
        this.active = null;
    }

    /**
     * Initialize the manager instance
     *
     * @param {Object} opts
     * @param {Logger} opts.log - the logger created by the server
     * @param {Connection|Pool} opts.database - the database handle created by the server
     */
    init ({ log, mp3_manager }) {
        // Prepend all logs from this router with the namespace
        this.log = new Proxy(log,{
            get : (log, property, self) => { // eslint-disable-line no-unused-vars
                return (...args) => { log[property]("YTManager :",...args); };
            }
        });
        this.mp3_manager = mp3_manager;
    }

    async queue_task(url) {
        let data = await this.get_info(url);
        let format = this._get_format(data);
        this._queue.push(new YTTask(data.videoDetails.videoId, url, format, data.videoDetails));
        if ( !this.active ) this.process();
    }

    async process() {

        this.active = this._queue.pop();

        try {
            this.log.info(`Starting to process task ${this.active.identifier}`);

            this.log.info(`Downloading task ${this.active.identifier}`);
            await this.active.download("temp.mp4");

            this.log.info(`Reserving a file path for task ${this.active.identifier}`);
            let fp = await this.mp3_manager.reserver_file_for(this.active.identifier);

            this.log.info(`Converting task ${this.active.identifier}`);
            await this.active.convert(fp);

            this.log.info(`Saving task ${this.active.identifier}`);
            this.active.save();
            await this.mp3_manager.save({
                identifier : this.active.identifier,
                channel_identifier : "misc",
                title : this.active.video_details.title,
                description : this.active.video_details.description,
                author : this.active.video_details.ownerChannelName,
                published : this.active.video_details.publishDate,
                duration : this.active.video_details.lengthSeconds
            });

            await this.active.complete();
            this.log.info(`Finished processing task ${this.active.identifier}`);

            await this.mp3_manager.clean_up();

            // TODO : save into a database
        } catch (e) {
            console.error(e.stack);

            // If we can retry, stick it back on the beginning of the stack
            if ( this.active.retry() ) {
                this._queue.unshift(this.active);
            } else {
                // TODO : handle total error out
            }
        }


        delete this.active;
        if ( this._queue.length > 1 ) {
            this.process();
        }
    }


    get status() {
        if ( !this.active ) {
            return {
                state : "idle",
                queue_length : this._queue.length,
                active : {}
            }
        }
        return {
            state : "active",
            queue_length : this._queue.length,
            active : {
                identifier : this.active.identifier,
                status : this.active.status,
                runtime : this.active.runtime
            }
        }
    }

    async get_info(url) {
        return await ytdl.getInfo(url);
    }

    async get_basic_info(url) {
        return await ytdl.getBasicInfo(url);
    }

    async get_format(url) {
        let data = await this.get_info(url);
        return this._get_format(data);
    }

    _get_format(data) {
        let all = data.formats.filter(f => f.hasAudio).sort((a,b) => b.contentLength - a.contentLength);
        let audio_only = all.filter(f => !f.hasVideo);

        if ( audio_only.length < 1 ) {
            return all[0];
        }
        return audio_only[0];
    }
}

module.exports = exports = YTManager;
