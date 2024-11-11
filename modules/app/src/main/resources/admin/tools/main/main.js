/*global app, resolve*/

const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const configLib = require('/lib/config');

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
            securityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-eval\' \'unsafe-inline\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
        }
        response.headers = {
            'Content-Security-Policy': securityPolicy
        };
    }

    return response;
};

exports.getParams = function () {
    const toolUrlBase = admin.getToolUrl(
        app.name,
        'main'
    );
    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: admin.getLocales()
        }),
        launcherPath: admin.getLauncherPath(),
        configScriptId: configLib.configJsonId,
        configAsJson: JSON.stringify(configLib.getConfig(), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
        toolBaseUrl: toolUrlBase,
        toolAppName: app.name
    };
};

function handleGet(req) {
    return exports.renderTemplate(req.path, exports.getParams());
}

exports.get = handleGet;
