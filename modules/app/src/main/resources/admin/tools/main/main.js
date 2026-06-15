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

    params.nonce = applySecurityPolicy(params.isBrowseMode);

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
};

function applySecurityPolicy(isBrowseMode) {
    if (app.config['contentSecurityPolicy.enabled'] === 'false') {
        return undefined;
    }

    const csp = portal.csp();

    const configuredPolicy = app.config['contentSecurityPolicy.header'];
    if (configuredPolicy) {
        csp.resetTo(configuredPolicy);
        return undefined;
    }

    const marketApi = configLib.getMarketApi();
    const slashIndex = marketApi ? marketApi.indexOf('/', 9) : -1;
    const baseMarketUrl = slashIndex > 0 ? marketApi.substring(0, slashIndex) : marketApi;

    csp.strict()
        .defaultSrc(portal.CspSource.SELF)
        .styleSrc(portal.CspSource.SELF, portal.CspSource.UNSAFE_INLINE)
        .imgSrc(portal.CspSource.SELF, portal.CspSource.DATA)
        .fontSrc(portal.CspSource.SELF, portal.CspSource.DATA)
        .objectSrc(portal.CspSource.NONE)
        .formAction(portal.CspSource.SELF)
        .frameAncestors(portal.CspSource.SELF);

    if (baseMarketUrl) {
        csp.connectSrc(portal.CspSource.SELF, baseMarketUrl);
    } else {
        csp.connectSrc(portal.CspSource.SELF);
    }

    if (!isBrowseMode) {
        // The content wizard loads CKEditor 4, which writes inline scripts into its own editing
        // iframe that cannot carry a per-request nonce; a nonce or 'strict-dynamic' would disable
        // 'unsafe-inline' and break the editor. So the wizard document falls back to 'unsafe-inline'.
        csp.scriptSrc(portal.CspSource.SELF, portal.CspSource.UNSAFE_INLINE);
        return undefined;
    }

    // The browse view loads no CKEditor, so script-src stays nonce-based with 'strict-dynamic'.
    csp.scriptSrc(portal.CspSource.STRICT_DYNAMIC)
        .scriptSrcAttr(portal.CspSource.UNSAFE_INLINE);

    return csp.nonceScriptSrc();
}

exports.getParams = function (path, locales) {
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');

    const isAiContentOperatorEnabled = !isBrowseMode && aiLib.aiContentOperatorRunning();
    const isAiTranslatorEnabled = !isBrowseMode && aiLib.aiTranslatorRunning();
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
        isAiEnabled: isAiEnabled,
        aiLocales: locales ? locales.join(',') : '',
    };
};

function handleGet(req) {
    const params = exports.getParams(req.path, req.locales);
    return exports.renderTemplate(params);
}

exports.get = handleGet;
