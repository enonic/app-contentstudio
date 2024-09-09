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
    const serviceBaseUrl = `${toolUri}/_/${app.name}`;
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
                contentUrl: `${serviceBaseUrl}/content`,
                i18nUrl: `${serviceBaseUrl}/i18n`,
                licenseUrl: `${serviceBaseUrl}/license`,
                stylesUrl: `${serviceBaseUrl}/styles`,
                collaborationUrl: `${serviceBaseUrl}/collaboration`,
                exportServiceUrl: `${serviceBaseUrl}/export`,
            },
            theme: 'light',
            /* Remove in CS/lib-admin-ui 5.0 */
            launcher: {
                theme: 'light'
            }
        }
    };
}

function parseTime(value) {
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(value) ? value : null;
}

exports.get = handleGet;
