/*global app, resolve*/

const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');
const configLib = require('../../../lib/config');

function handleGet() {
    // Fetched and injected into the admin shell, so the host page's CSP governs the widget; this
    // tight policy only takes effect if the endpoint is navigated to directly, keeping it inert.
    portal.csp().strict();
    const view = resolve('./settings.html');
    const params = {
        assetsUri: portal.assetUrl({
            path: 'js/settings.js'
        }),
        configScriptId: configLib.configJsonId
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
        headers: {
            'Cache-Control': 'no-store',
        },
    };
}

exports.get = handleGet;
