/*global app, resolve*/

const admin = require('/lib/xp/admin');
const appLib = require('/lib/xp/app');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const configLib = require('/lib/config');
const assetLib = require('/lib/enonic/asset');

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

        if (!securityPolicy) {
            securityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-inline\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:';
        }
        response.headers = {
            'Content-Security-Policy': securityPolicy
        };
    }

    return response;
};

exports.getParams = function (path, locales) {
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');
    const aiContentOperatorApp = appLib.get({key: AI_CONTENT_OPERATOR_APP_KEY});
    const aiTranslatorApp = appLib.get({key: AI_TRANSLATOR_APP_KEY});
    const isAiContentOperatorEnabled = aiContentOperatorApp != null && aiContentOperatorApp.started && !isBrowseMode;
    const isAiTranslatorEnabled = aiTranslatorApp != null && aiTranslatorApp.started && !isBrowseMode;

    return {
        assetsUri: assetLib.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: locales
        }),
        aiContentOperatorAssetsUrl: isAiContentOperatorEnabled ? portal.assetUrl({application: AI_CONTENT_OPERATOR_APP_KEY}) : undefined,
        aiTranslatorAssetsUrl: isAiTranslatorEnabled ? portal.assetUrl({application: AI_TRANSLATOR_APP_KEY}) : undefined,
        configScriptId: configLib.configJsonId,
        configAsJson: JSON.stringify(configLib.getConfig(locales), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
        isBrowseMode: isBrowseMode,
        aiLocales: locales ? locales.join(',') : '',
    };
};

function handleGet(req) {
    const params = exports.getParams(req.path, req.locales);
    return exports.renderTemplate(params);
}

exports.get = handleGet;
