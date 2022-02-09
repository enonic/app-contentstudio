/* global __, log */
const collaborationLib = require('/lib/collaboration');

exports.get = function (req) {
    if (!req.webSocket) {
        return {
            status: 404
        };
    }

    return {
        webSocket: {
            data: {
                branch: req.branch,
                contentId: req.params.contentId
            }
        }
    };
};

exports.webSocketEvent = function (event) {
    if (!event) {
        return;
    }

    switch (event.type) {
    case 'open': {
        collaborationLib.join({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        break;
    }
    case 'error': {
        log.debug(`Error: ${JSON.stringify(event)}`);
        break;
    }
    case 'close': {
        collaborationLib.left({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        break
    }
    default:
        // do nothing
    }
};
