import {$isConnected} from '../websocket/init';
import {addPort, broadcast, sendTo} from './ports';

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

    $isConnected.subscribe(connected => {
        broadcast({type: 'status', payload: {ready: connected}});
    });
}
