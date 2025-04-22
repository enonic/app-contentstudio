/*global app, resolve*/

const mustache = require('/lib/mustache');
const configLib = require('../../../lib/config');
const assetLib = require('/lib/enonic/asset');

function handleGet() {
    const view = resolve('./settings.html');
    const params = {
        assetsUri: assetLib.assetUrl({
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
