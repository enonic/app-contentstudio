const admin = require('/lib/xp/admin');
const appLib = require('/lib/xp/app');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');

const SAGA_APP_KEY = 'com.enonic.app.saga';

exports.renderTemplate = function (path, params) {
    const view = resolve('./main.html');
    const toolUri = admin.getToolUrl(app.name, 'main');
    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    params.isBrowseMode = path === toolUri;
    params.hasSaga = appLib.get({key: SAGA_APP_KEY}) != null;

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];

        if (!securityPolicy) {
            securityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-eval\' \'unsafe-inline\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
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
        sagaAssetUrl: portal.assetUrl({application: SAGA_APP_KEY}),
        launcherPath: admin.getLauncherPath(),
        configServiceUrl: portal.serviceUrl({service: 'config'})
    }
}

function handleGet(req) {
    return exports.renderTemplate(req.path, exports.getParams());
}

exports.get = handleGet;
