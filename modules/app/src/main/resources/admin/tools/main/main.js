/*global app, resolve*/

const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const i18n = require('/lib/xp/i18n');
const aiLib = require('/lib/ai');
const configLib = require('/lib/config');

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
            securityPolicy = 'default-src \'self\'; connect-src \'self\' ws: wss:; script-src \'self\' \'unsafe-inline\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\' data:';
        }
        response.headers = {
            'Content-Security-Policy': securityPolicy
        };
    }

    return response;
};

exports.getParams = function (path, locales) {
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');

    const isAiContentOperatorEnabled = aiLib.aiContentOperatorRunning && !isBrowseMode;
    const isAiTranslatorEnabled = aiLib.aiTranslatorRunning && !isBrowseMode;
    const isAiEnabled = isAiContentOperatorEnabled || isAiTranslatorEnabled;

    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: locales
        }),
        aiContentOperatorAssetsUrl: isAiContentOperatorEnabled ? portal.assetUrl({path: '', application: AI_CONTENT_OPERATOR_APP_KEY}) : undefined,
        aiTranslatorAssetsUrl: isAiTranslatorEnabled ? portal.assetUrl({path: '', application: AI_TRANSLATOR_APP_KEY}) : undefined,
        configScriptId: configLib.configJsonId,
        configAsJson: JSON.stringify(configLib.getConfig(locales, isAiEnabled), null, 4).replace(/<(\/?script|!--)/gi, "\\u003C$1"),
        isBrowseMode: isBrowseMode,
        aiLocales: locales ? locales.join(',') : '',
    };
};

function handleGet(req) {
    const params = exports.getParams(req.path, req.locales);
    return exports.renderTemplate(params);
}

exports.get = handleGet;
