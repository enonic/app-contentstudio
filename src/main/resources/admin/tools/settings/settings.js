var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');
var contextLib = require('/lib/xp/context');
var authLib = require('/lib/xp/auth');

function handleGet(req) {
    var view = resolve('./../main/main.html');

    var context = contextLib.get();
    var repository = context.repository;
    var branch = context.branch;
    var allowScriptsInEditor = app.config['htmlinput.allowScripts'] === 'true' || false;

    var params = {
        adminUrl: admin.getBaseUri(),
        adminAssetsUri: admin.getAssetsUri(),
        assetsUri: replaceSettingsInPath(portal.assetUrl({
            path: ''
        })),
        appName: 'Content Studio',
        appId: app.name,
        appVersion: app.version,
        branch: branch,
        repository: repository,
        locale: admin.getLocale(),
        launcherPath: replaceSettingsInPath(admin.getLauncherPath()),
        launcherUrl: admin.getLauncherUrl(),
        stylesUrl: replaceSettingsInPath(portal.serviceUrl({service: 'styles'})),
        i18nUrl: replaceSettingsInPath(portal.serviceUrl({service: 'i18n'})),
        allowScriptsInEditor: allowScriptsInEditor,
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
