/*global app, resolve*/

const admin = require('/lib/xp/admin');
const appLib = require('/lib/xp/app');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');

const AI_ASSISTANT_APP_KEY = 'com.enonic.app.saga';

exports.renderTemplate = function (params) {
    const view = resolve('./main.html');

    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

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
    const toolUrlBase = admin.getToolUrl(
        app.name,
        'main'
    );
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');
    const aiApp = appLib.get({key: AI_ASSISTANT_APP_KEY});
    const aiAssistantEnabled = aiApp != null && aiApp.started && !isBrowseMode;

    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: admin.getLocales()
        }),
        aiAssistantAssetUrl: aiAssistantEnabled ? portal.assetUrl({application: AI_ASSISTANT_APP_KEY}) : undefined,
        launcherPath: admin.getLauncherPath(),
        configServiceUrl: portal.apiUrl({
            application: app.name,
            api: 'config',
        }),
        toolBaseUrl: toolUrlBase,
        toolAppName: app.name,
        isBrowseMode: isBrowseMode
    }
}

function handleGet(req) {
    const params = exports.getParams(req.path);
    return exports.renderTemplate(params);
}

exports.get = handleGet;
