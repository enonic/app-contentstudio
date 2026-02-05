/*global app, resolve*/

const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');
const configLib = require('../../../lib/config');

function handleGet() {
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
    };
}

exports.get = handleGet;
