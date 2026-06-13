/*global app, resolve*/

const portalLib = require('/lib/xp/portal');

function handleGet(req) {
    // Handled on the client; lock down so a direct browser navigation to this endpoint is inert.
    portalLib.csp().strict();
    return {
        status: 410,
        body: 'Automatic widget preview should be handled on the client.'
    };
}

exports.get = handleGet;
