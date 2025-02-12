import {WebSocketMessage} from '../websocket/data';
import {$isConnected, connect as connectWebSocket, sendMessage} from '../websocket/init';
import {isInWorkerMessage, isMessageWithMetadata, OutWorkerMessage} from '../worker/data';
import {subscribe, unsubscribe} from '../worker/subscriptions';
import {NS} from './constants';

const CLIENT_ID = crypto.randomUUID();

export function initialize(): void {
    window.addEventListener(`${NS}:open`, handleOpen);
    window.addEventListener(`${NS}:close`, handleClose);

    $isConnected.subscribe(connected => {
        send({type: 'status', payload: {ready: connected}});
    });
}

function handleOpen(): void {
    window.addEventListener(`${NS}:message:in`, handleMessage);
    send({type: 'connected', payload: {clientId: CLIENT_ID}});
    send({type: 'status', payload: {ready: $isConnected.get()}});
}

function handleClose(): void {
    send({type: 'disconnected'});
}

function handleMessage(event: Event): void {
    if (!isFallbackEvent(event)) {
        return;
    }

    if (!isInWorkerMessage(event.detail)) {
        return;
    }

    const message = event.detail;

    switch (message.type) {
        case 'init':
            connectWebSocket(message.payload.wsUrl, (payload: Record<string, unknown>): void => {
                const clientId = isMessageWithMetadata(payload) ? payload.metadata.clientId : undefined;
                if (!clientId || clientId === CLIENT_ID) {
                    send({type: 'received', payload});
                }
            });
            subscribe(CLIENT_ID, message.payload.wsUrl);
            break;

        case 'subscribe':
            subscribe(CLIENT_ID, message.payload.operation);
            break;

        case 'unsubscribe':
            unsubscribe(CLIENT_ID, message.payload.operation);
            break;

        case 'send':
            sendMessage(message.payload as WebSocketMessage);
            break;
    }
}

function isFallbackEvent(event: Event): event is CustomEvent<unknown> {
    return event.type.startsWith(`${NS}:message:in`) &&
        'detail' in event &&
        event.detail !== undefined;
}


function send(message: OutWorkerMessage): void {
    window.dispatchEvent(new CustomEvent(`${NS}:message:out`, {detail: message}));
}
