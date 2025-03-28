import * as adminLib from '/lib/xp/admin';
import * as authLib from '/lib/xp/auth';
import * as contextLib from '/lib/xp/context';
import * as i18nLib from '/lib/xp/i18n';
import * as portalLib from '/lib/xp/portal';

export const configJsonId = 'contentstudio-config-json';

function getPhrases(locales: string[]): Record<string, string> {
    const phrases: Record<string, string> = {};
    const bundles = ['i18n/common', 'i18n/phrases', 'i18n/cs-plus', 'i18n/dialogs', 'i18n/page-editor', 'i18n/wcag'];

    bundles.forEach(function (bundle) {
        const bundlePhrases = i18nLib.getPhrases(locales, [bundle]);
        for (const key in bundlePhrases) {
            if (Object.prototype.hasOwnProperty.call(bundlePhrases, key)) {
                phrases[key] = bundlePhrases[key];
            }
        }
    });

    return phrases;
}

export function getConfig(locales: string[]): Record<string, unknown> {
    const context = contextLib.get();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const defaultPublishFromTime = parseTime(app.config['publishingWizard.defaultPublishFromTime'] || '12:00');
    const toolUri = adminLib.getToolUrl(
        app.name,
        'main'
    );
    const theme = 'light';
    const user = authLib.getUser();

    if (!user) {
        throw new Error('User not found');
    }

    return {
        allowContentUpdate,
        excludeDependencies,
        allowPathTransliteration,
        adminUrl: adminLib.getBaseUri(),
        assetsUri: portalLib.assetUrl({
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
            contentUrl: portalLib.apiUrl({
                api: 'content'
            }),
            stylesUrl: portalLib.apiUrl({
                api: 'styles'
            }),
            exportServiceUrl: portalLib.apiUrl({
                api: 'export'
            }),
            eventsUrl: portalLib.apiUrl({
                api: 'events'
            }),
            aiTranslatorLicenseServiceUrl: portalLib.serviceUrl({service: 'license', application: 'com.enonic.app.ai.translator'}),
            aiTranslatorWsServiceUrl: portalLib.serviceUrl(
                {service: 'ws', application: 'com.enonic.app.ai.translator', type: 'websocket'}),
        },
        theme,
        widgetApiUrl: portalLib.apiUrl({
            application: 'admin',
            api: 'widget'
        }),
        statusApiUrl: portalLib.apiUrl({
            application: 'admin',
            api: 'status'
        }),
        eventApiUrl: portalLib.apiUrl({
            application: 'admin',
            api: 'event'
        }),
        phrasesAsJson: JSON.stringify(getPhrases(locales)),
        sharedSocketUrl: portalLib.assetUrl({
            path: 'shared-socket.js'
        }),
        launcherUrl: adminLib.widgetUrl({
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

function parseTime(value: string): Optional<string> {
    return /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/.test(value) ? value : null;
}

export function generateScriptConfigId(): string {
    return Math.random().toString(36).substring(2, 15);
}
