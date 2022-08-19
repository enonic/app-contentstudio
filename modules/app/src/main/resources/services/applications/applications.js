const appLib = require('/lib/xp/app');
const iconResolver = __.newBean('com.enonic.xp.app.contentstudio.IconResolver');

exports.get = function (req) {
    const type = req.params.type;

    if (!type) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: type'
        };
    }

    if (type === 'list') {
        return listApps();
    }

    if (type === 'get') {
        return getApps(req.params.keys);
    }

    return {
        status: 404,
        contentType: 'text/plain',
        body: 'Operation ' + type + ' not found'
    }
};

const listApps = function () {
    const apps = appLib.list();
    fetchAppsIcons(apps);

    return {
        status: 200,
        contentType: 'application/json',
        body: apps
    }
}

const fetchAppsIcons = function (apps) {
    apps.forEach(function (app) {
        addAppIcon(app);
    });
}

const addAppIcon = function (app) {
    const icon = iconResolver.getAppIcon(app.key);

    if (icon) {
        app.icon = icon;
    }
}

const getApps = function (keys) {
    if (!keys) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: keys'
        };
    }

    return doGetApps(keys.split(','));
}

const doGetApps = function (keys) {
    const apps = [];

    keys.forEach(function (key) {
        const app = appLib.get({
            key: key,
        });

        apps.push(app);
    });

    fetchAppsIcons(apps);

    return {
        status: 200,
        contentType: 'application/json',
        body: apps
    }
}
