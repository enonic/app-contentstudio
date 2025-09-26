/*global __*/

const authLib = require('/lib/xp/auth');
const configLib = require('/lib/config');

exports.post = function (req) {
    const version = JSON.parse(req.body).version;

    if (!version) {
        return {
            status: 500,
            contentType: 'application/json',
            body: {
                error: 'Missing required parameter: version'
            }
        };
    }

    const user = authLib.getUser();

    if (!user) {
        return {
            status: 500,
            contentType: 'application/json',
            body: {
                error: 'User is not authenticated'
            }
        };
    }

    authLib.modifyProfile({
        key: user.key,
        scope: configLib.profileScope,
        editor: () => configLib.createDismissVersionObject(version)
    });

    return {
        status: 200
    };
};

