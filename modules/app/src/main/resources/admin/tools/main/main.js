const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');

exports.renderTemplate = function (path, params) {
    const view = resolve('./main.html');
    const toolUri = admin.getToolUrl(app.name,'main');
    const isBrowseMode = path === toolUri;
    const baseSecurityPolicy = 'default-src \'self\'; script-src \'self\' \'unsafe-eval\'{0}; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
    const securityPolicy = baseSecurityPolicy.replace('{0}', isBrowseMode ? '' : ' \'unsafe-inline\'');

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
        headers: {
            'Content-Security-Policy': securityPolicy
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

function handleGet(req) {
    return exports.renderTemplate(req.path, exports.getParams());
}

exports.get = handleGet;
