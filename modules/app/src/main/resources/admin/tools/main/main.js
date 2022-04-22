const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');

exports.renderTemplate = function (path, params) {
    const view = resolve('./main.html');
    const toolUri = admin.getToolUrl(app.name, 'main');
    const isBrowseMode = path === toolUri;
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    params.isBrowseMode = isBrowseMode;

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            const baseSecurityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-eval\'{0}; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
            securityPolicy = baseSecurityPolicy.replace('{0}', isBrowseMode ? '' : ' \'unsafe-inline\'');
        }
        response.headers = {
            'Content-Security-Policy': securityPolicy
        }
    }

    return response;
}

exports.getParams = function () {
    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: admin.getLocales()
        }),
        launcherPath: admin.getLauncherPath(),
        configServiceUrl: portal.serviceUrl({service: 'config'})
    }
}

function handleGet(req) {
    return exports.renderTemplate(req.path, exports.getParams());
}

exports.get = handleGet;
