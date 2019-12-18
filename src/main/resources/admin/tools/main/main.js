var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');
var contextLib = require('/lib/xp/context');
var authLib = require('/lib/xp/auth');

function handleGet(req) {
    if (isSettingsPage(req) && !isAllowedToAccessSettingsPage()) {
        return {
            status: 403
        }
    }

    var view = resolve('./main.html');

    var context = contextLib.get();
    var repository = context.repository;
    var branch = context.branch;
    var allowScriptsInEditor = app.config['htmlinput.allowScripts'] === 'true' || false;

    var params = {
        adminUrl: admin.getBaseUri(),
        adminAssetsUri: admin.getAssetsUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        appName: 'Content Studio',
        appId: app.name,
        appVersion: app.version,
        branch: branch,
        repository: repository,
        locale: admin.getLocale(),
        launcherPath: admin.getLauncherPath(),
        launcherUrl: admin.getLauncherUrl(),
        stylesUrl: portal.serviceUrl({service: 'styles'}),
        i18nUrl: portal.serviceUrl({service: 'i18n'}),
        allowScriptsInEditor: allowScriptsInEditor,
        mainUrl: portal.pageUrl()
    };

    log.info(JSON.stringify(req));

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

function isSettingsPage(req) {
    return req.url.indexOf('settings') > 0;
}

function isAllowedToAccessSettingsPage() {
    return authLib.hasRole('system.admin') || authLib.hasRole('cms.admin');
}

exports.get = handleGet;
