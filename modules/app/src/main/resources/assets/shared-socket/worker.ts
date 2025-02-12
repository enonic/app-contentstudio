import {broadcast, subscribe, unsubscribe} from "./subscriptions";
import {$isConnected, connect, sendMessage, WebSocketMessage} from "./websocket";

export function initialize(self: SharedWorkerGlobalScope): void {
    if (self.onconnect != null) {
        return;
    }

    self.onconnect = handleConnection;

    const urlParams = new URLSearchParams(self.location.search);
    const url = urlParams.get("wsUrl") ?? '';
    const protocol = urlParams.get("protocol") ?? undefined;

    if (url) {
        console.log('Connecting to', url, protocol);
        connect({url, protocol, customHandler: handleWebSocketMessage});
    }
}

//
//* Connection
//

function handleConnection(event: MessageEvent): void {
    const port = event.ports[0];

    port.onmessage = handlePortMessage;

    postMessage(port, {type: 'connected'});
    postMessage(port, {type: 'status', payload: {ready: $isConnected.get()}});
}

function postMessage<T extends OutWorkerMessage>(port: MessagePort, message: T): void {
    port.postMessage(message);
}

function handlePortMessage(event: MessageEvent): void {
    const port = event.ports.at(0);

    if (!isInWorkerMessage(event.data) || port == null) {
        return;
    }

    const message = event.data;

    switch (message.type) {
        case 'subscribe':
            handleSubscribe(port, message);
            break;
        case 'unsubscribe':
            handleUnsubscribe(port, message);
            break;
        case 'send':
            handleSend(message);
            break;
    }
}

function handleSubscribe(port: MessagePort, message: SubscribeWorkerMessage): void {
    subscribe(port, message.payload.operation);
}

function handleUnsubscribe(port: MessagePort, message: UnsubscribeWorkerMessage): void {
    unsubscribe(port, message.payload.operation);
}

function handleSend(message: SendWorkerMessage): void {
    sendMessage(message.payload as WebSocketMessage);
}


//
//* WebSocket
//

$isConnected.subscribe(connected => {
    broadcast({type: 'status', payload: {ready: connected}});
});

function handleWebSocketMessage(message: Record<string, unknown>): void {
    broadcast(message);
}
