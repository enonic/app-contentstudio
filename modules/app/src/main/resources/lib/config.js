/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const contextLib = require('/lib/xp/context');
const i18n = require('/lib/xp/i18n');

function getPhrases() {
    const locales = admin.getLocales();
    const phrases = {};
    const bundles = ['i18n/common', 'i18n/common_wcag', 'i18n/phrases', 'i18n/dialogs', 'i18n/wcag', 'i18n/page-editor'];

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

function getConfig() {
    const context = contextLib.get();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const defaultPublishFromTime = parseTime(app.config['publishingWizard.defaultPublishFromTime']);
    const toolUri = admin.getToolUrl(
        app.name,
        'main'
    );
    return {
        allowContentUpdate,
        excludeDependencies,
        allowPathTransliteration,
        adminUrl: admin.getBaseUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        toolUri: toolUri,
        appId: app.name,
        appVersion: app.version,
        branch,
        enableCollaboration,
        defaultPublishFromTime,
        locale: admin.getLocale(),
        services: {
            contentUrl: portal.apiUrl({
                api: 'content',
            }),
            licenseUrl: portal.apiUrl({
                api: 'license',
            }),
            stylesUrl: portal.apiUrl({
                api: 'styles',
            }),
            collaborationUrl: portal.apiUrl({
                api: 'collaboration',
            }),
            exportServiceUrl: portal.apiUrl({
                api: 'export',
            }),
        },
        theme: 'light',
        /* Remove in CS/lib-admin-ui 5.0 */
        launcher: {
            theme: 'light'
        },
        widgetApiUrl: portal.apiUrl({
            application: 'admin',
            api: 'widget',
        }),
        phrasesAsJson: JSON.stringify(getPhrases(), null, 4),
    };
}

function parseTime(value) {
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(value) ? value : null;
}

function generateScriptConfigId() {
    return Math.random().toString(36).substring(2, 15);
}

exports.getConfig = getConfig;
exports.generateScriptConfigId = generateScriptConfigId;
