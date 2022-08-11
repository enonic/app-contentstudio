const appLib = require('/lib/xp/app');

exports.get = function () {
    const apps = appLib.list();

    return {
        status: 200,
        contentType: 'application/json',
        body: apps
    }
};
