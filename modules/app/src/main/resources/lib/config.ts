import {widgetUrl, getToolUrl, getHomeToolUrl, getVersion} from '/lib/xp/admin';
import {User, UserKey, getUser, getProfile, getMemberships} from '/lib/xp/auth';
import {getPhrases} from '/lib/xp/i18n';
import {assetUrl, apiUrl, serviceUrl} from '/lib/xp/portal';

export const configJsonId = 'contentstudio-config-json';
export const profileScope = 'notifications';

interface GetMarketConfigBean {
    getMarketApi(): string;
}

function geti18nPhrases(locales: string[]): Record<string, string> {
    const phrases: Record<string, string> = {};
    const bundles = ['i18n/common', 'i18n/phrases', 'i18n/cs-plus', 'i18n/dialogs', 'i18n/page-editor', 'i18n/wcag'];

    bundles.forEach(function (bundle) {
        const bundlePhrases = getPhrases(locales, [bundle]);
        for (const key in bundlePhrases) {
            if (Object.prototype.hasOwnProperty.call(bundlePhrases, key)) {
                phrases[key] = bundlePhrases[key];
            }
        }
    });

    return phrases;
}

export function getConfig(locales: string[], aiEnabled: boolean): Record<string, unknown> {
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const checkLatestVersion = app.config['settings.checkLatestVersion'] !== 'false';
    const defaultPublishFromTime = parseTime(app.config['publishingWizard.defaultPublishFromTime'] || '12:00');
    const toolUri = getToolUrl(
        app.name,
        'main'
    );
    const theme = 'light';

    const user: User | null = getUser();
    if (!user) {
        throw new Error('User not found');
    }

    let lastDismissedVersion;
    if (checkLatestVersion) {
        lastDismissedVersion = getLastDismissedVersion(user.key);
    }

    return {
        allowContentUpdate,
        excludeDependencies,
        allowPathTransliteration,
        checkLatestVersion,
        adminUrl: getHomeToolUrl(),
        assetsUri: assetUrl({
            path: ''
        }),
        toolUri: toolUri,
        appId: app.name,
        appVersion: app.version,
        xpVersion: getVersion(),
        branch: 'draft',
        enableCollaboration,
        defaultPublishFromTime,
        locale: locales[0],
        marketApi: exports.getMarketApi(),
        services: {
            contentUrl: apiUrl({
                api: 'content'
            }),
            stylesUrl: apiUrl({
                api: 'styles'
            }),
            exportServiceUrl: apiUrl({
                api: 'export'
            }),
            eventsUrl: apiUrl({
                api: 'events'
            }),
            dismissNotificationUrl: apiUrl({
                api: 'dismiss-notification'
            }),
            aiContentOperatorWsServiceUrl: serviceUrl({service: 'ws', application: 'com.enonic.app.ai.contentoperator', type: 'websocket'}),
            aiTranslatorLicenseServiceUrl: serviceUrl({service: 'license', application: 'com.enonic.app.ai.translator'}),
            aiTranslatorWsServiceUrl: serviceUrl(
                {service: 'ws', application: 'com.enonic.app.ai.translator', type: 'websocket'}),
        },
        theme,
        widgetApiUrl: apiUrl({
            api: 'admin:extension'
        }),
        statusApiUrl: apiUrl({
            api: 'admin:status'
        }),
        eventApiUrl: apiUrl({
            api: 'admin:event'
        }),
        phrasesAsJson: JSON.stringify(geti18nPhrases(locales)),
        sharedSocketUrl: assetUrl({
            path: 'shared-socket.js'
        }),
        launcherUrl: widgetUrl({
            application: 'com.enonic.xp.app.main',
            widget: 'launcher',
            params: {
                appName: app.name,
                theme,
            }
        }),
        user,
        principals: getMemberships(user.key, true),
        aiEnabled,
        lastDismissedVersion
    };
}

function parseTime(value: string): Optional<string> {
    return /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/.test(value) ? value : null;
}

export function getMarketApi() {
    const marketConfigBean = __.newBean('com.enonic.app.main.GetMarketConfigBean') as GetMarketConfigBean;
    return __.toNativeObject(marketConfigBean.getMarketApi());
}

function getLastDismissedVersion(principalKey: UserKey): string {
    const userProfile = getProfile({
        key: principalKey,
        scope: profileScope
    }) as Record<string, any>;

    return userProfile?.[getUnderscoredAppName()]?.['upgrade']?.['version'] || '';
}

export function getUnderscoredAppName(): string {
    return app.name.replace(/\./g, '_');
}
