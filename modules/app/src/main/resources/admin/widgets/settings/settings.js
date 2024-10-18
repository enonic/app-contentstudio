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
        configScriptId: configLib.generateScriptConfigId(),
        configAsJson: JSON.stringify(configLib.getConfig(), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
}

exports.get = handleGet;
