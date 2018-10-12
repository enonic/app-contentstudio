var admin = require('/lib/xp/admin');
var mustache = require('/lib/xp/mustache');
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
        messages: admin.getPhrases(),
        locale: admin.getLocale(),
        launcherPath: admin.getLauncherPath(),
        launcherUrl: admin.getLauncherUrl(),
        imagePreviewUrl: portal.serviceUrl({service: 'image-preview'}),
        imageStylesUrl: portal.serviceUrl({service: 'image-styles'}),
        stylesUrl: portal.serviceUrl({service: 'styles'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.get = handleGet;
