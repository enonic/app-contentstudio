const portal = require('/lib/xp/portal');
const mustache = require('/lib/mustache');

function handleGet() {
    const view = resolve('./settings.html');
    const params = {
        assetsUri: portal.assetUrl({
            path: 'js/settings.js'
        }),
        configServiceUrl: portal.serviceUrl({service: 'config'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
}

exports.get = handleGet;
