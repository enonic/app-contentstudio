/* global __, log */
const visitorsLib = require('/lib/visitors');

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
        let visitors = visitorsLib.open({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        log.info(`List of visitors ${JSON.stringify(visitors)} for content with id = "${event.data.contentId}"`);
        break;
    }
    case 'close': {
        let visitors = visitorsLib.close({
            contentId: event.data.contentId,
            sessionId: event.session.id,
            userKey: event.session.user.key
        });
        log.info(`List of visitors ${JSON.stringify(visitors)} for content with id = "${event.data.contentId}"`);
        break
    }
    default:
        // do nothing
    }
};
