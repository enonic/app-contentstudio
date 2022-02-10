const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');

exports.renderTemplate = function (params) {
    const view = resolve('./main.html');

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
        headers: {
            'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-eval\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:'
        }
    };
}

exports.getParams = function () {
    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: 'Content Studio',
        launcherPath: admin.getLauncherPath(),
        configServiceUrl: portal.serviceUrl({service: 'config'})
    }
}

function handleGet() {
    return exports.renderTemplate(exports.getParams());
}

exports.get = handleGet;
