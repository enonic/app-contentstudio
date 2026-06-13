/*global __*/

const authLib = require('/lib/xp/auth');
const configLib = require('/lib/config');
const portalLib = require('/lib/xp/portal');

exports.post = function (req) {
    // Fetch-only API: lock down so a direct browser navigation to this endpoint is inert.
    portalLib.csp().strict();
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
