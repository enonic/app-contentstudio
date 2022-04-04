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
        let collaborators = collaborationLib.join({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        log.debug(`List of collaborators ${JSON.stringify(collaborators)} for content with id = "${event.data.contentId}"`);
        break;
    }
    case 'message': {
        let collaborators = collaborationLib.heartbeat({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        log.debug(`List of collaborators ${JSON.stringify(collaborators)} for content with id = "${event.data.contentId}"`);
        break;
    }
    case 'error': {
        log.debug(`Error: ${JSON.stringify(event)}`);
        break;
    }
    case 'close': {
        let collaborators = collaborationLib.leave({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        log.debug(`List of collaborators ${JSON.stringify(collaborators)} for content with id = "${event.data.contentId}"`);
        break
    }
    default:
        // do nothing
    }
};
