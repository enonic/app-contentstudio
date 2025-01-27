/* global __ */
const collaborationLib = require('/lib/collaboration');
const websocketLib = require('/lib/xp/websocket');

function createJoinOrLeaveParams(event) {
    return {
        contentId: event.data.contentId,
        project: event.data.project,
        sessionId: event.session.id,
        userKey: event.session.user.key,
    };
}

exports.get = function (req) {
    if (!req.webSocket) {
        return {
            status: 404,
        };
    }

    log.info(JSON.stringify(req, null, 2));

    return {
        webSocket: {
            data: {
                branch: req.branch,
                contentId: req.params.contentId,
                project: req.params.project,
            },
        },
    };
};

exports.webSocketEvent = function (event) {
    if (!event) {
        return;
    }

    if (!event.session || !event.session.user) {
        return {
            status: 401,
        };
    }

    log.info(JSON.stringify(event, null, 2));

    switch (event.type) {
        case 'open': {
            collaborationLib.join(createJoinOrLeaveParams(event));
            break;
        }
        case 'message': {
            collaborationLib.heartbeat(createJoinOrLeaveParams(event));
            const data = JSON.parse(event.message);

            if (data.type === 'ping') {
                websocketLib.send(event.session.id, JSON.stringify({type: 'pong'}));
            }
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
