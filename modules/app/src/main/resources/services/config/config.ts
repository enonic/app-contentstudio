import type {Response} from '/types/';

import {getBaseUri, getLocale, getToolUrl} from '/lib/xp/admin';
import {assetUrl, serviceUrl} from '/lib/xp/portal';
import {get as getContext} from  '/lib/xp/context';


export function get(): Response {
    const context = getContext();
    const branch = context.branch;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const excludeDependencies = app.config['publishingWizard.excludeDependencies'] === 'true' || false;
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const enableCollaboration = app.config['contentWizard.enableCollaboration'] !== 'false';
    const hideDefaultProject = app.config['settings.hideDefaultProject'] !== 'false';

    return {
        status: 200,
        contentType: 'application/json',
        body: {
            allowContentUpdate,
            excludeDependencies,
            allowPathTransliteration,
            adminUrl: getBaseUri(),
            assetsUri: assetUrl({
                path: ''
            }),
            toolUri: getToolUrl(
                app.name,
                'main'
            ),
            appId: app.name,
            appVersion: app.version,
            branch,
            hideDefaultProject,
            enableCollaboration,
            locale: getLocale(),
            services: {
                contentUrl: serviceUrl({service: 'content'}),
                i18nUrl: serviceUrl({service: 'i18n'}),
                licenseUrl: serviceUrl({service: 'license'}),
                stylesUrl: serviceUrl({service: 'styles'}),
                collaborationUrl: serviceUrl({service: 'collaboration'}),
                appServiceUrl: serviceUrl({service: 'applications'}),
                exportServiceUrl: serviceUrl({service: 'export'}),
            },
            theme: 'light',
            /* Remove in CS/lib-admin-ui 5.0 */
            launcher: {
                theme: 'light'
            }
        }
    };
}
