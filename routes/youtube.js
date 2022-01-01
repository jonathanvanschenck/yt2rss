const { createWriteStream } = require('fs');
const { spawn } = require('child_process');
const ytdl = require('ytdl-core');

const Router = require("../lib/Router");
const YTManager = require("../lib/YTManager");

let router = new Router('youtube');
let yt_manager = new YTManager();

router.on("init", ({ log, mp3_manager }) => yt_manager.init({ log, mp3_manager }));

function generate_url(req, res) {
    let { v } = req.query;
    if ( !v ) {
        Router.send_error(res, 403, "Missing query parameter 'v'");
        return;
    }
    if ( !ytdl.validateID(v) ) {
        Router.send_error(res, 403, "Invalid query parameter 'v'");
        return;
    }
    return `http://youtube.com/watch?v=${v}`;
}


router.GET('/status', {}, async (req, res) => {
    Router.send_response(res, 200, yt_manager.status);
});

router.GET('/format', {}, async (req, res) => {

    let url = generate_url(req, res);
    if ( !url ) return;

    let format = await yt_manager.get_format(url);
    
    Router.send_response(res, 200, format);
});

router.GET('/info', {}, async (req, res) => {

    let url = generate_url(req, res);
    if ( !url ) return;

    let data = await yt_manager.get_info(url);

    Router.send_response(res, 200, data);
});

router.GET('/basic_info', {}, async (req, res) => {

    let url = generate_url(req, res);
    if ( !url ) return;

    let data = await yt_manager.get_basic_info(url);

    Router.send_response(res, 200, data);
});

router.POST('/podcasts', {}, async (req, res) => {

    let url = generate_url(req, res);
    if ( !url ) return;

    Router.send_response(res, 200, { message : "ok" });

    try {
        yt_manager.queue_task( url );
    } catch (e) {
        console.error(e.stack);
    }
});

router.GET('/podcasts', {}, async (req, res) => {
    let mp3s = await router.mp3_manager.all_mp3s();
    Router.send_response(res, 200, mp3s.map(mp3 => mp3.to_api()));
});

router.GET('/podcast/:id', {}, async (req, res) => {
    let mp3 = await router.mp3_manager.one_mp3(req.params.id);
    if ( !mp3 ) {
        Router.send_error(res, 404, "not found");
        return
    }
    Router.send_response(res, 200, mp3.to_api());
});

router.POST('/channels', {}, async (req, res) => {
    Router.send_error(res, 503, "TBD");
});

router.GET('/channels', {}, async (req, res) => {
    let channels = await router.mp3_manager.all_channels();
    Router.send_response(res, 200, channels.map(channel => channel.to_api()));
});

router.GET('/channel/:id', {}, async (req, res) => {
    let channel = await router.mp3_manager.one_channel(req.params.id);
    if ( !channel ) {
        Router.send_error(res, 404, "not found");
        return
    }
    Router.send_response(res, 200, channel.to_api());
});

router.GET('/channel/:id/podcasts', {}, async (req, res) => {
    let channel = await router.mp3_manager.one_channel(req.params.id);
    if ( !channel ) {
        Router.send_error(res, 404, "not found");
        return
    }
    let mp3s = await router.mp3_manager.all_mp3s_for(req.params.id);
    Router.send_response(res, 200, mp3s.map(mp3 => mp3.to_api()));
});


module.exports = exports = router;
