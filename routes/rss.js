const { readFileSync } = require("fs");
const { resolve, join } = require("path");
const { render } = require("mustache");

const Router = require("../lib/Router");

const TEMPLATE = readFileSync(resolve(join(__dirname,"../templates/rss_base.xml")), "utf-8");

let router = new Router('rss');


function generate_duration(tot_seconds) {
    // prepare seconds
    let duration = "";
    let seconds = 1*tot_seconds;

    // Subtract off any whole minutes, and attach seconds to string
    let minutes = Math.trunc(seconds/60);
    seconds = seconds - minutes*60;
    duration = seconds.toString() + duration;

    // If no whole minutes, we are done
    if ( minutes < 1 ) return duration;

    // Subtract off any whole hours, and attach minutes to string
    let hours = Math.trunc(minutes/60);
    minutes = minutes - hours*60;
    while ( duration.length < 2 ) duration = "0" + duration;
    duration = minutes.toString() + ":" + duration;

    // If no whole hours, we are done
    if ( hours < 1 ) return duration;

    // attach hours to string and return
    while ( duration.length < 2 ) duration = "0" + duration;
    duration = hours.toString() + ":" + duration;
    return duration;
}

async function generate_rss_for(channel_identifier) {
    let channel = await router.mp3_manager.one_channel(channel_identifier);
    let mp3s = await router.mp3_manager.all_mp3s_for(channel_identifier);
    return render(TEMPLATE,{
        title : channel.title,
        self_url : router.get_url_path_for(channel_identifier+".xml"),
        description : channel.description,
        pub_date : (channel.published ? channel.published : new Date()).toUTCString(),
        build_date : (new Date()).toUTCString(),
        items_list : mp3s.sort((a,b) => ( a.created > b.created ? -1 : ( b.created > a.created ? 1 : 0 ) )).map(mp3 => {
            return {
                title : mp3.title,
                self_url : router.mp3_manager.get_url_path_for(mp3.identifier),
                description : mp3.description,
                author : mp3.author,
                guid : `Podcast of ${mp3.identifier}`,
                pub_date : (mp3.created ? mp3.created : new Date()).toUTCString(),
                length : mp3.length,
                duration : generate_duration(mp3.duration),
            };
        })
    });
}

router.GET('/misc.xml', {}, async (req, res) => {
    let xml = await generate_rss_for('misc');
    Router.send(res, 200, xml, 'application/rss+xml');
});

module.exports = exports = router;
