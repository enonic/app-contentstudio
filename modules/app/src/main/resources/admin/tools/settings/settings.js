/*global app, resolve*/

var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');
var contextLib = require('/lib/xp/context');

function handleGet() {
    const view = resolve('./../main/main.html');

    const context = contextLib.get();
    const branch = context.branch;
    const allowScriptsInEditor = app.config['htmlinput.allowScripts'] === 'true' || false;
    const allowContentUpdate = app.config['publishingWizard.allowContentUpdate'] !== 'false';
    const allowPathTransliteration = app.config['contentWizard.allowPathTransliteration'] !== 'false';
    const hideDefaultProject = app.config['settings.hideDefaultProject'] === 'true' || false;

    const params = {
        adminUrl: admin.getBaseUri(),
        adminAssetsUri: admin.getAssetsUri(),
        assetsUri: replaceSettingsInPath(portal.assetUrl({
            path: ''
        })),
        appName: 'Content Studio',
        appId: app.name,
        appVersion: app.version,
        branch,
        locale: admin.getLocale(),
        launcherPath: replaceSettingsInPath(admin.getLauncherPath()),
        launcherUrl: admin.getLauncherUrl(),
        services: {
            stylesUrl: portal.serviceUrl({service: 'styles'}),
            i18nUrl: portal.serviceUrl({service: 'i18n'}),
            contentServiceUrl: portal.serviceUrl({service: 'content'}),
            adminToolsUrl: portal.serviceUrl({service: 'admintools'}),
            licenseUrl: portal.serviceUrl({service: 'license'})
        },
        allowScriptsInEditor,
        allowContentUpdate,
        allowPathTransliteration,
        hideDefaultProject,
        mainUrl: portal.pageUrl().replace('/settings', '')
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

function replaceSettingsInPath(url) {
    return url.replace('/settings/', '/main/');
}

exports.get = handleGet;
