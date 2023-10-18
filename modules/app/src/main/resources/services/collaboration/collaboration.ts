import type {Request, Response} from '/types/';

import {heartbeat, join, leave} from '/lib/collaboration';

function createJoinOrLeaveParams(event) {
    return {
        contentId: event.data.contentId,
        sessionId: event.session.id,
        userKey: event.session.user.key
    }
}

export function get(req: Request): Response {
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

export function webSocketEvent(event: {
    data: unknown
    session: {
        user: string
    },
    type: 'open'|'message'|'close'
}) {
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
        join(createJoinOrLeaveParams(event));
        break;
    }
    case 'message': {
        heartbeat(createJoinOrLeaveParams(event));
        break;
    }
    case 'close': {
        if (event && event.data) {
            leave(createJoinOrLeaveParams(event));
        }
        break;
    }
    default:
        // do nothing
    }
};
