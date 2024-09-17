/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const contextLib = require('/lib/xp/context');

function handleGet() {
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
    const sagaPollDelay = Number(app.config['openai.poll.delay']) || 0;
    const sagaPollLimit = Number(app.config['openai.poll.limit']) || 0;

    return {
        status: 200,
        contentType: 'application/json',
        body: {
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
                    application: app.name,
                    api: 'content',
                }),
                i18nUrl: portal.apiUrl({
                    application: app.name,
                    api: 'i18n',
                }),
                licenseUrl: portal.apiUrl({
                    application: app.name,
                    api: 'license',
                }),
                stylesUrl: portal.apiUrl({
                    application: app.name,
                    api: 'styles',
                }),
                collaborationUrl: portal.apiUrl({
                    application: app.name,
                    api: 'collaboration',
                }),
                exportServiceUrl: portal.apiUrl({
                    application: app.name,
                    api: 'export',
                }),
                aiContentOperatorServiceUrl: portal.apiUrl({
                    application: 'com.enonic.app.ai.contentoperator',
                    api: 'rest',
                }),
                sagaTranslationServiceUrl: portal.apiUrl({
                    application: 'com.enonic.app.ai.translator',
                    api: 'rest',
                }),
                appServiceUrl: portal.apiUrl({
                    application: app.name,
                    api: 'applications',
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
        }
    };
}

function parseTime(value) {
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(value) ? value : null;
}

exports.get = handleGet;
