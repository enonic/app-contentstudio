var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');

function handleGet() {
    var view = resolve('./main.html');

    var params = {
        adminUrl: admin.getBaseUri(),
        adminAssetsUri: admin.getAssetsUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        appName: 'Content Studio',
        appId: app.name,
        xpVersion: app.version,
        locale: admin.getLocale(),
        launcherPath: admin.getLauncherPath(),
        launcherUrl: admin.getLauncherUrl(),
        stylesUrl: portal.serviceUrl({service: 'styles'}),
        i18nUrl: portal.serviceUrl({service: 'i18n'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.get = handleGet;
