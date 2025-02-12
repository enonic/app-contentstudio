/*global app, resolve*/

const admin = require('/lib/xp/admin');
const aiLib = require('/lib/ai');
const portal = require('/lib/xp/portal');
const contextLib = require('/lib/xp/context');

function handleGet(request) {
    const context = contextLib.get();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const hideDefaultProject = app.config['settings.hideDefaultProject'] !== 'false';
    const defaultPublishFromTime = parseTime(app.config['publishingWizard.defaultPublishFromTime']);

    const isBrowseMode = request.path === admin.getToolUrl(app.name, 'main');
    const aiEnabled = !isBrowseMode && (aiLib.aiContentOperatorRunning || aiLib.aiTranslatorRunning);

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
            toolUri: admin.getToolUrl(
                app.name,
                'main'
            ),
            appId: app.name,
            appVersion: app.version,
            branch,
            hideDefaultProject,
            enableCollaboration,
            defaultPublishFromTime,
            locale: admin.getLocale(),
            services: {
                contentUrl: portal.serviceUrl({service: 'content'}),
                i18nUrl: portal.serviceUrl({service: 'i18n'}),
                licenseUrl: portal.serviceUrl({service: 'license'}),
                stylesUrl: portal.serviceUrl({service: 'styles'}),
                eventsUrl: portal.serviceUrl({service: 'events'}),
                appServiceUrl: portal.serviceUrl({service: 'applications'}),
                exportServiceUrl: portal.serviceUrl({service: 'export'}),
                aiContentOperatorWsServiceUrl: portal.serviceUrl({service: 'ws', application: 'com.enonic.app.ai.contentoperator', type: 'websocket'}),
                aiTranslatorLicenseServiceUrl: portal.serviceUrl({service: 'license', application: 'com.enonic.app.ai.translator'}),
                aiTranslatorWsServiceUrl: portal.serviceUrl(
                    {service: 'ws', application: 'com.enonic.app.ai.translator', type: 'websocket'}),
            },
            sharedSocketUrl: portal.assetUrl({path: 'shared-socket.js'}),
            aiEnabled,
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
