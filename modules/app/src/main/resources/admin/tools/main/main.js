const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const aiLib = require('/lib/ai');
const configHelper = require('/services/config/config');

const AI_TRANSLATOR_APP_KEY = 'com.enonic.app.ai.translator';
const AI_CONTENT_OPERATOR_APP_KEY = 'com.enonic.app.ai.contentoperator';

exports.renderTemplate = function (params) {
    const view = resolve('./main.html');

    const enableSecurityPolicy = app.config['contentSecurityPolicy.enabled'] !== 'false';

    const response = {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };

    if (enableSecurityPolicy) {
        let securityPolicy = app.config['contentSecurityPolicy.header'];
        const marketApi = configHelper.getMarketApi();
        const baseMarketUrl = marketApi.substring(0, marketApi.indexOf('/', 9));

        if (!securityPolicy) {
            securityPolicy = `default-src 'self'; connect-src 'self' ws: wss: ${baseMarketUrl}; script-src 'self' 'unsafe-inline'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:`;
        }
        response.headers = {
            'Content-Security-Policy': securityPolicy
        }
    }

    return response;
}

exports.getParams = function (path) {
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');

    const isAiContentOperatorEnabled = aiLib.aiContentOperatorRunning && !isBrowseMode;
    const isAiTranslatorEnabled = aiLib.aiTranslatorRunning && !isBrowseMode;

    const locales = admin.getLocales();

    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: locales
        }),
        aiContentOperatorAssetsUrl: isAiContentOperatorEnabled ? portal.assetUrl({application: AI_CONTENT_OPERATOR_APP_KEY}) : undefined,
        aiTranslatorAssetsUrl: isAiTranslatorEnabled ? portal.assetUrl({application: AI_TRANSLATOR_APP_KEY}) : undefined,
        launcherPath: admin.getLauncherPath(),
        configServiceUrl: portal.serviceUrl({service: 'config'}),
        isBrowseMode: isBrowseMode,
        aiLocales: locales ? locales.join(',') : '',
    }
}

function handleGet(req) {
    const params = exports.getParams(req.path);
    return exports.renderTemplate(params);
}

exports.get = handleGet;
