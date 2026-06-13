/*global __*/

const authLib = require('/lib/xp/auth');
const configLib = require('/lib/config');

exports.post = function (req) {
    let version;
    if (req.body) {
        version = JSON.parse(req.body).version;
    }

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
        editor: () => createDismissVersionObject(version)
    });

    return {
        status: 200
    };
};

function createDismissVersionObject(version) {
    return {
        [configLib.getUnderscoredAppName()]: {
            "upgrade": {
                "version": version,
                "dismissed": new Date().toUTCString()
            }
        }
    }
}
