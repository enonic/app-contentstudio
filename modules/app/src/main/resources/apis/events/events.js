const websocketLib = require('/lib/xp/websocket');
const events = require('/lib/events');

const WS_PROTOCOL = 'json';

exports.get = function get(request) {
    if (!request.webSocket) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Trying to access WebSocket with "webSocket" set to "false"'
        };
    }

    const headers = request.headers || {};
    const secWebSocketProtocol = headers['Sec-WebSocket-Protocol'];
    const protocols = secWebSocketProtocol ? secWebSocketProtocol.split(', ') : [];
    const isValidProtocol = protocols.some(protocol => protocol === WS_PROTOCOL);
    if (!isValidProtocol) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: `Expected <${WS_PROTOCOL}>.`
        };
    }

    return {
        status: 101,
        webSocket: {
            subProtocols: [WS_PROTOCOL],
            data: {
                // sessionId: request.cookies.JSESSIONID,
            }
        },
    };
}

exports.webSocketEvent = function webSocketEvent(event) {
    try {
        const type = event.type;

        switch (type) {
            case 'open':
                break;
            case 'message':
                handleMessage(event);
                break;
            case 'close':
                handleClose();
                break;
            case 'error':
                handleError(event);
                break;
        }
    } catch (e) {
        log.error(e);
    }
}

function handleClose() {
    // TODO: Prevent unnecessary operations and call to LLMs in case of close
}

function handleError(event) {
    log.error(event.error);
}

function handleMessage(event) {
    const socketId = event.session.id;
    const message = parseMessage(event.message);
    if (!message) {
        return;
    }

    if (message.type === 'ping') {
        websocketLib.send(socketId, JSON.stringify({type: 'pong'}));
        return;
    }

    if (message.type === 'connect') {
        websocketLib.send(socketId, JSON.stringify({type: 'connected'}));
        return;
    }

    if (message.type === 'subscribe') {
        // TODO: Subscribe only to those events, that were requested by the client
        websocketLib.addToGroup('events', socketId);
        websocketLib.addToGroup('collaboration', socketId);
        return;
    }

    if (events.isEventType(message.type)) {
        const userKey = event.session.user.key;
        events.handleMessage(message, userKey);
        return;
    }
}

function parseMessage(message) {
    try {
        return message != null ? JSON.parse(message) : undefined;
    } catch (e) {
        return undefined;
    }
}
