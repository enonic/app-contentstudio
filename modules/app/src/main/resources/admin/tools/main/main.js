const admin = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');
const context = require('/lib/xp/context');
const i18n = require('/lib/xp/i18n');
const aiLib = require('/lib/ai');
const configLib = require('/lib/config');

const AI_TRANSLATOR_APP_KEY = 'com.enonic.app.ai.translator';
const AI_CONTENT_OPERATOR_APP_KEY = 'com.enonic.app.ai.contentoperator';

exports.renderTemplate = function (params) {
    const view = resolve('./main.html');

    applySecurityPolicy();

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
};

function applySecurityPolicy() {
    const enabled = app.config['contentSecurityPolicy.enabled'] !== 'false';
    // Shared with extension response processors, which XP invokes after this controller returns.
    context.setCustomLocalAttribute('com.enonic.app.contentstudio.csp.enabled', enabled);

    if (!enabled) {
        return;
    }

    const csp = portal.csp();

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
        .frameAncestors(portal.CspSource.SELF)
        .frameSrc(portal.CspSource.SELF);

    if (baseMarketUrl) {
        csp.connectSrc(portal.CspSource.SELF, baseMarketUrl);
    } else {
        csp.connectSrc(portal.CspSource.SELF);
    }

    // Operator-configured permissions (e.g. for an embedded widget that loads external resources) are
    // unioned on top of the baseline, never replacing it, so a misconfigured value cannot silently
    // disable it.
    csp.merge(app.config['contentSecurityPolicy.header'] || '');

    // CKEditor 4, loaded on demand for HtmlArea inputs on both views, writes an inline script into
    // its editing iframe and uses inline event handlers in its UI, so script-src cannot be
    // nonce-based or 'strict-dynamic'.
    csp.scriptSrc(portal.CspSource.SELF, portal.CspSource.UNSAFE_INLINE);
}

exports.getParams = function (path, locales) {
    const isBrowseMode = path === admin.getToolUrl(app.name, 'main');

    const isAiContentOperatorEnabled = aiLib.aiContentOperatorRunning();
    const isAiTranslatorEnabled = !isBrowseMode && aiLib.aiTranslatorRunning();
    const isAiEnabled = isAiContentOperatorEnabled || isAiTranslatorEnabled;
    const config = configLib.getConfig(locales, isAiEnabled, isBrowseMode);

    return {
        assetsUri: portal.assetUrl({ path: '' }),
        appName: i18n.localize({
            key: 'admin.tool.displayName',
            bundles: ['i18n/phrases'],
            locale: locales,
        }),
        aiContentOperatorAssetsUrl: isAiContentOperatorEnabled
            ? portal.assetUrl({ path: '', application: AI_CONTENT_OPERATOR_APP_KEY })
            : undefined,
        aiTranslatorAssetsUrl: isAiTranslatorEnabled
            ? portal.assetUrl({ path: '', application: AI_TRANSLATOR_APP_KEY })
            : undefined,
        configScriptId: configLib.configJsonId,
        configAsJson: JSON.stringify(config, null, 4).replace(/<(\/?script|!--)/gi, '\\u003C$1'),
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
