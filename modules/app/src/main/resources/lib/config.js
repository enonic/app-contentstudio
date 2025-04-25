/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const contextLib = require('/lib/xp/context');
const i18n = require('/lib/xp/i18n');
const authLib = require('/lib/xp/auth');

function getPhrases(locales) {
    const phrases = {};
    const bundles = ['i18n/common', 'i18n/phrases', 'i18n/cs-plus', 'i18n/dialogs', 'i18n/page-editor', 'i18n/wcag'];

    bundles.forEach(function (bundle) {
        const bundlePhrases = i18n.getPhrases(locales, [bundle]);
        for (const key in bundlePhrases) {
            if (Object.prototype.hasOwnProperty.call(bundlePhrases, key)) {
                phrases[key] = bundlePhrases[key];
            }
        }
    });

    return phrases;
}

function getConfig(locales) {
    const context = contextLib.get();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const defaultPublishFromTime = parseTime(app.config['publishingWizard.defaultPublishFromTime'] || '12:00');
    const toolUri = admin.getToolUrl(
        app.name,
        'main'
    );
    const theme = 'light';
    const user = authLib.getUser();

    return {
        allowContentUpdate,
        excludeDependencies,
        allowPathTransliteration,
        adminUrl: admin.getHomeToolUrl(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        toolUri: toolUri,
        appId: app.name,
        appVersion: app.version,
        branch,
        enableCollaboration,
        defaultPublishFromTime,
        locale: locales[0],
        services: {
            contentUrl: portal.apiUrl({
                api: 'content'
            }),
            stylesUrl: portal.apiUrl({
                api: 'styles'
            }),
            collaborationUrl: portal.apiUrl({
                api: 'collaboration'
            }),
            exportServiceUrl: portal.apiUrl({
                api: 'export'
            }),
            aiContentOperatorWsServiceUrl: portal.serviceUrl({service: 'ws', application: 'com.enonic.app.ai.contentoperator', type: 'websocket'}),
            aiTranslatorLicenseServiceUrl: portal.serviceUrl({service: 'license', application: 'com.enonic.app.ai.translator'}),
            aiTranslatorWsServiceUrl: portal.serviceUrl(
                {service: 'ws', application: 'com.enonic.app.ai.translator', type: 'websocket'}),
        },
        theme,
        widgetApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'widget'
        }),
        statusApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'status'
        }),
        eventApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'event'
        }),
        phrasesAsJson: JSON.stringify(getPhrases(locales)),
        launcherUrl: admin.widgetUrl({
            application: 'com.enonic.xp.app.main',
            widget: 'launcher',
            params: {
                appName: app.name,
                theme,
            }
        }),
        user,
        principals: authLib.getMemberships(user.key, true)
    };
}

function parseTime(value) {
    return /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/.test(value) ? value : null;
}

function generateScriptConfigId() {
    return Math.random().toString(36).substring(2, 15);
}

exports.getConfig = getConfig;
exports.generateScriptConfigId = generateScriptConfigId;
exports.configJsonId = "contentstudio-config-json";
