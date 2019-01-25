var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');
var contextLib = require('/lib/xp/context');

function handleGet() {
    var view = resolve('./main.html');

    var context = contextLib.get();
    var repository = context.repository;
    var branch = context.branch;

    var params = {
        adminUrl: admin.getBaseUri(),
        adminAssetsUri: admin.getAssetsUri(),
        assetsUri: portal.assetUrl({
            path: ''
        }),
        appName: 'Content Studio',
        appId: app.name,
        xpVersion: app.version,
        branch: branch,
        repository: repository,
        messages: admin.getPhrases(),
        locale: admin.getLocale(),
        launcherPath: admin.getLauncherPath(),
        launcherUrl: admin.getLauncherUrl(),
        stylesUrl: portal.serviceUrl({service: 'styles'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.get = handleGet;
