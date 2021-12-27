const { readFileSync } = require("fs");
const { resolve, join } = require("path");
const { render } = require("mustache");

const Router = require("../lib/Router");


const TEMPLATE = readFileSync(resolve(join(__dirname,"../templates/rss_base.xml")), "utf-8");

let router = new Router('rss');

router.GET('/', {}, async (req, res) => {

    // TODO : look this up in a database

    // FIXME
    let snip_list = [
        {
            title : "Show 2",
            self_url : "google.com/2",
            description : "Another desc.",
        },
        {
            title : "Show 1",
            self_url : "google.com/1",
            description : "A desc.",
        }
    ];

    let xml = render(TEMPLATE, {
        title : "Cool Show",
        self_url : "google.com",
        description : "My cool show",
        items_list : snip_list
    });

    Router.send(res, 200, xml, 'application/rss+xml');
});

module.exports = exports = router;
