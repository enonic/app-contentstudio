import {subscribe, unsubscribe} from "./subscriptions";
import {$isConnected} from "./websocket";

export function handleConnection(event: MessageEvent): void {
    const port = event.ports[0];

    port.onmessage = handleMessage;

    if ($isConnected.get()) {
        postMessage(port, {type: 'status', payload: {ready: true}});
    }
}

function postMessage<T extends OutWorkerMessage>(port: MessagePort, message: T): void {
    port.postMessage(message);
}

function handleMessage(event: MessageEvent): void {
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
    console.log('send', message);
}
