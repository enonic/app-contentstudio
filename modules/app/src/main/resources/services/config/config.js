/*global app, resolve*/

const admin = require('/lib/xp/admin');
const portal = require('/lib/xp/portal');
const contextLib = require('/lib/xp/context');

function handleGet() {
    const context = contextLib.get();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const hideDefaultProject = app.config['settings.hideDefaultProject'] === 'true' || false;
    const projectAppsEnabled = app.config['projectApps.enabled'] === 'true' || false;

    return {
        status: 200,
        contentType: 'application/json',
        body: {
            allowContentUpdate,
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
            projectAppsEnabled,
            locale: admin.getLocale(),
            services: {
                contentUrl: portal.serviceUrl({service: 'content'}),
                i18nUrl: portal.serviceUrl({service: 'i18n'}),
                licenseUrl: portal.serviceUrl({service: 'license'}),
                stylesUrl: portal.serviceUrl({service: 'styles'}),
                collaborationUrl: portal.serviceUrl({service: 'collaboration'}),
                appServiceUrl: portal.serviceUrl({service: 'applications'})
            },
            theme: 'light',
            /* Remove in CS/lib-admin-ui 5.0 */
            launcher: {
                theme: 'light'
            }
        }
    };
}

exports.get = handleGet;
