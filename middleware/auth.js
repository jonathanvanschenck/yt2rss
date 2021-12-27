/**
 * Basic Auth middleware
 */
module.exports = exports = async function ( req, res, next ) {
    let token = (req.headers.authorization || '').split(/\s+/).pop() || '';
    let [ username, password ] = Buffer.from(token, 'base64').toString().split(/:/);

    // TODO : actually check authentication

    if ( username && password ) {
        req.auth = { username, password };
    } else {
        req.auth = null;
    }
    next();
};
