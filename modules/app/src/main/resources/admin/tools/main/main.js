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

    params.nonce = applySecurityPolicy();

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
};

// Builds the Content-Security-Policy on the request; the portal emits the header at
// response-flush time. Returns the nonce to stamp on inline scripts, when nonce-based.
function applySecurityPolicy() {
    if (app.config['contentSecurityPolicy.enabled'] === 'false') {
        return undefined;
    }

    const csp = portal.csp();

    const configuredPolicy = app.config['contentSecurityPolicy.header'];
    if (configuredPolicy) {
        configuredPolicy.split(';').forEach((part) => {
            const tokens = part.trim().split(/\s+/);
            if (tokens[0]) {
                csp.override.apply(csp, tokens);
            }
        });
        return undefined;
    }

    const marketApi = configLib.getMarketApi();
    const baseMarketUrl = marketApi.substring(0, marketApi.indexOf('/', 9));

    csp.defaultSrc(portal.CspSource.SELF)
        .connectSrc(portal.CspSource.SELF, 'ws:', 'wss:', baseMarketUrl)
        // nonce + 'strict-dynamic': trust propagates from the nonced scripts in main.html to the
        // script elements they inject at runtime (CKEditor plugins, AI bundles); 'self' and
        // 'unsafe-inline' are ignored by CSP3 browsers and only serve as fallbacks for older ones
        .scriptSrc(portal.CspSource.STRICT_DYNAMIC, portal.CspSource.SELF, portal.CspSource.UNSAFE_INLINE)
        // CKEditor 4 chrome (toolbar buttons, dialogs, combos, menus) is wired through inline
        // event-handler attributes ("CKEDITOR.tools.callFunction(...)"), which 'strict-dynamic'
        // does not cover; allow attributes only, script elements stay nonce-gated
        .scriptSrcAttr(portal.CspSource.UNSAFE_INLINE)
        .styleSrc(portal.CspSource.SELF, portal.CspSource.UNSAFE_INLINE)
        .imgSrc(portal.CspSource.SELF, portal.CspSource.DATA)
        .fontSrc(portal.CspSource.SELF, portal.CspSource.DATA)
        .objectSrc(portal.CspSource.NONE)
        .baseUri(portal.CspSource.NONE)
        .formAction(portal.CspSource.SELF)
        .frameAncestors(portal.CspSource.SELF);

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
