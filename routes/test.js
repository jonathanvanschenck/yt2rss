const Router = require("../lib/Router");

let router = new Router('test');

router.GET('/', {}, async (req, res) => {
    Router.send_response(res, 200, { message : "OK" });
});

module.exports = exports = router;
