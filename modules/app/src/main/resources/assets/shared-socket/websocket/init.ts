import {computed, map} from 'nanostores';
import {WS_PROTOCOL, WS_URL} from './constants';
import {isWebSocketMessage, WebSocketMessage} from './data';

type WebSocketState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

type WebSocketStore = {
    state: WebSocketState;
    connection: Optional<WebSocket>;
    reconnectAttempts: number;
};

const $websocket = map<WebSocketStore>({
    state: 'disconnected',
    connection: null,
    reconnectAttempts: 0,
});

//
//* State
//

const $reconnectTimeout = computed($websocket, ({reconnectAttempts}) => Math.min(2 ** reconnectAttempts * 1000, 30000));

function incrementReconnectAttempts(): void {
    $websocket.setKey('reconnectAttempts', $websocket.get().reconnectAttempts + 1);
}

export const $isConnected = computed($websocket, ({connection, state}) => {
    return connection != null && connection.readyState === WebSocket.OPEN && state === 'connected';
});

function isActiveConnection(connection: Optional<WebSocket>): connection is WebSocket {
    return (
        connection != null &&
        (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING)
    );
}

//
//* Connection
//

const CONNECTION_TIMEOUT = 60000; // ms
const PING_INTERVAL = 50000; // ms
const PONG_TIMEOUT = 15000; // ms

let pingInterval: number;
let pongTimeout: number;
let reconnectTimeout: number;

let customMessageHandler: (message: Record<string, unknown>) => void;

export function connect(customHandler: (message: Record<string, unknown>) => void): void {
    const {state, connection} = $websocket.get();

    if (state === 'connecting' || state === 'connected') {
        return;
    }

    customMessageHandler = customHandler;

    if (isActiveConnection(connection)) {
        cleanup(connection);
    }

    const ws = new WebSocket(WS_URL, [WS_PROTOCOL]);
    $websocket.setKey('connection', ws);

    $websocket.setKey('state', 'connecting');
    const connectionTimeout = setTimeout(() => {
        if ($websocket.get().state === 'connecting') {
            ws.close();
        }
    }, CONNECTION_TIMEOUT);

    ws.onopen = () => {
        clearTimeout(connectionTimeout);

        $websocket.setKey('reconnectAttempts', 0);

        sendMessage({type: 'connect'});

        pingInterval = setInterval(() => {
            sendMessage({type: 'ping'});
            clearTimeout(pongTimeout);
            pongTimeout = setTimeout(() => {
                disconnect();
            }, PONG_TIMEOUT);
        }, PING_INTERVAL);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
        clearTimeout(connectionTimeout);
        cleanup(ws);
        scheduleReconnect();
    };

    ws.onerror = e => {
        console.error(e);
    };
}

function disconnect(): void {
    const {connection} = $websocket.get();

    if (isActiveConnection(connection)) {
        connection.onerror = null;
        connection.close();
    }
}

function scheduleReconnect(): void {
    incrementReconnectAttempts();
    reconnectTimeout = setTimeout(() => {
        connect(customMessageHandler);
    }, $reconnectTimeout.get());
}

function cleanup(ws: WebSocket): void {
    if (isActiveConnection(ws)) {
        ws.close();
    }

    const {connection} = $websocket.get();
    if (ws !== connection) {
        return;
    }

    clearInterval(pingInterval);
    clearTimeout(reconnectTimeout);
    clearTimeout(pongTimeout);

    $websocket.setKey('state', 'disconnected');
    $websocket.setKey('connection', null);
}

function handleDisconnected(): void {
    const {connection} = $websocket.get();
    if (isActiveConnection(connection)) {
        connection.close();
    }
}

export function sendMessage(message: WebSocketMessage): void {
    const {connection} = $websocket.get();

    if (connection != null && connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(message));
    }
}

function handleMessage(event: MessageEvent<string>): void {
    const message = parseMessage(event);
    if (message == null) {
        return;
    }

    switch (message.type) {
        case 'connected':
            $websocket.setKey('state', 'connected');
            break;

        case 'pong':
            clearTimeout(pongTimeout);
            break;

        case 'disconnected':
            handleDisconnected();
            break;

        default:
            customMessageHandler(message);
    }
}

function parseMessage(event: MessageEvent<string>): Optional<WebSocketMessage> {
    try {
        const message = JSON.parse(event.data) as WebSocketMessage | Record<string, unknown>;
        if (isWebSocketMessage(message)) {
            return message;
        }
    } catch (error) {
        console.error(error);
    }

    return null;
}
