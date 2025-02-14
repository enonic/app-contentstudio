import {WebSocketMessage} from "../websocket/data";
import {sendMessage} from "../websocket/init";
import {isInWorkerMessage, OutWorkerMessage} from "./data";
import {subscribe, unsubscribe, unsubscribeAll} from "./subscriptions";

const ports = new Map<MessagePort, string>();

export function addPort(port: MessagePort): string {
    const portId = ports.get(port);
    if (portId != null) {
        return portId;
    }

    const newPortId = crypto.randomUUID();
    ports.set(port, newPortId);
    port.onmessage = (event) => handlePortMessage(port, event);

    return newPortId;
}

export function removePort(port: MessagePort): void {
    const portId = ports.get(port);
    if (!portId) {
        return;
    }

    unsubscribeAll(portId);
    ports.delete(port);
}

//
//* Outgoing Messages
//

export function sendTo<T extends OutWorkerMessage>(port: MessagePort, message: T): void {
    if (ports.has(port)) {
        port.postMessage(message);
    }
}

export function sendToId<T extends OutWorkerMessage>(id: string, message: T): void {
    const port = Array.from(ports.keys()).find(port => ports.get(port) === id);
    port?.postMessage(message);
}

export function broadcast(message: OutWorkerMessage): void {
    ports.keys().forEach(port => port.postMessage(message));
}

//
//* Incoming Messages
//

function handlePortMessage(port: MessagePort, event: MessageEvent): void {
    if (!isInWorkerMessage(event.data)) {
        return;
    }

    const message = event.data;
    const portId = ports.get(port);
    if (!portId) {
        return;
    }

    switch (message.type) {
        case 'subscribe':
            subscribe(portId, message.payload.operation);
            break;

        case 'unsubscribe':
            unsubscribe(portId, message.payload.operation);
            break;

        case 'send':
            sendMessage(message.payload as WebSocketMessage);
            break;
    }
}
