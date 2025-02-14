import {$isConnected, connect as connectWebSocket} from "../websocket/init";
import {isMessageWithMetadata} from "./data";
import {addPort, broadcast, sendTo, sendToId} from "./ports";

export function initialize(self: SharedWorkerGlobalScope): void {
    if (self.onconnect != null) {
        return;
    }

    self.onconnect = (event: MessageEvent): void => {
        const port = event.ports[0];
        const clientId = addPort(port);
        sendTo(port, {type: 'connected', payload: {clientId}});
        sendTo(port, {type: 'status', payload: {ready: $isConnected.get()}});
    };

    connectWebSocket((payload: Record<string, unknown>): void => {
        const clientId = isMessageWithMetadata(payload) ? payload.metadata.clientId : undefined;
        if (clientId) {
            sendToId(clientId, {type: 'received', payload});
        } else {
            broadcast({type: 'received', payload});
        }
    });

    $isConnected.subscribe(connected => {
        broadcast({type: 'status', payload: {ready: connected}});
    });
}
