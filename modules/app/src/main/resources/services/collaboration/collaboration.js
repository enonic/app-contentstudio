/* global __ */
const collaborationLib = require('/lib/collaboration');

function createJoinOrLeaveParams(event) {
    return {
        contentId: event.data.contentId,
        project: event.data.project,
        sessionId: event.session.id,
        userKey: event.session.user.key
    }
}

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
                contentId: req.params.contentId,
                project: req.params.project,
            }
        }
    };
};

exports.webSocketEvent = function (event) {
    if (!event) {
        return;
    }

    if (!event.session || !event.session.user) {
        return {
            status: 401
        };
    }

    switch (event.type) {
    case 'open': {
        collaborationLib.join(createJoinOrLeaveParams(event));
        break;
    }
    case 'message': {
        collaborationLib.heartbeat(createJoinOrLeaveParams(event));
        break;
    }
    case 'close': {
        if (event && event.data) {
            collaborationLib.leave(createJoinOrLeaveParams(event));
        }
        break;
    }
    default:
        // do nothing
    }
};
