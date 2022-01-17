/*global resolve*/

var admin = require('/lib/xp/admin');
var mustache = require('/lib/mustache');
var portal = require('/lib/xp/portal');

exports.renderTemplate = function (params) {
    const view = resolve('./main.html');

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.getParams = function () {
    return {
        assetsUri: portal.assetUrl({path: ''}),
        appName: 'Content Studio',
        launcherPath: admin.getLauncherPath(),
        launcherUrl: admin.getLauncherUrl(),
        locale: admin.getLocale(),
        configServiceUrl: portal.serviceUrl({service: 'config'})
    }
}

function handleGet() {
    return exports.renderTemplate(exports.getParams());
}

exports.get = handleGet;
