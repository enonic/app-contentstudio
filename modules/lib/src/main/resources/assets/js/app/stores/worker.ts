import {computed, map} from 'nanostores';

import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {
    IN_BASE,
    InMessage,
    JoinMessage,
    LeaveMessage,
    MessageType,
    UpdatedMessagePayload
} from './data/messages';
import {
    ConnectedWorkerMessage,
    OutWorkerMessage,
    ReceivedWorkerMessage,
    SendWorkerMessage,
    SubscribeWorkerMessage,
} from './data/worker';

type WorkerLifecycle = 'mounting' | 'mounted' | 'unmounting' | 'unmounted';

type WorkerState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected';

interface WorkerStore {
    lifecycle: WorkerLifecycle;
    state: WorkerState;
    ready: boolean;
    connection: Optional<SharedWorker>;
    clientId: Optional<string>;
    online: boolean;
}

interface ContentStore {
    contentId: Optional<string>;
    project: Optional<string>;
    collaborators: Optional<string[]>;
}

const $worker = map<WorkerStore>({
    lifecycle: 'unmounted',
    state: 'disconnected',
    ready: false,
    connection: null,
    clientId: null,
    online: navigator.onLine,
});

export const $content = map<ContentStore>({
    contentId: null,
    project: null,
    collaborators: null,
});

//
//* State
//

export const $isConnected = computed($worker, ({connection, state, online, ready}) => {
    return connection != null && state === 'connected' && online && ready;
});

//
//* Lifecycle
//

const $needsUnmount = computed([$worker], ({lifecycle}) => lifecycle === 'unmounting');

let unsubscribeUnmount: Optional<() => void>;

export function mountWorker(): () => void {
    const {lifecycle} = $worker.get();

    if (lifecycle === 'unmounting' || lifecycle === 'unmounted') {
        unsubscribeUnmount?.();

        $worker.setKey('lifecycle', 'mounting');
        $worker.setKey('online', navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        connect();

        $worker.setKey('lifecycle', 'mounted');
    }

    return () => {
        $worker.setKey('lifecycle', 'unmounting');
        unsubscribeUnmount = $needsUnmount.subscribe(needsUnmount => {
            if (!needsUnmount) {
                return;
            }

            // `subscribe` may be undefined if handler is called instantly
            setTimeout(() => unsubscribeUnmount?.(), 0);

            disconnect();

            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);

            $worker.setKey('lifecycle', 'unmounted');
        });
    };
}

//
//* Connection
//

function connect(): void {
    const {state, connection} = $worker.get();

    if (state === 'connecting' || state === 'connected') {
        return;
    }

    cleanup(connection);

    const sharedSocketUrl = `${CONFIG.getString('assetsUri')}/shared-socket.js`;
    const worker = new SharedWorker(sharedSocketUrl, {type: 'module'});

    worker.onerror = event => {
        // TODO: Handle error
        console.error(event);
    };

    worker.port.onmessageerror = event => {
        // TODO: Handle error
        console.error(event);
    };

    $worker.setKey('connection', worker);
    $worker.setKey('state', 'connecting');

    worker.port.addEventListener('message', event => {
        handleMessage(event as MessageEvent<OutWorkerMessage>);
    });

    worker.port.addEventListener('error', event => {
        console.error(event);
    });

    worker.port.start();
}

function disconnect(): void {
    const {state, connection} = $worker.get();
    if (state !== 'disconnected' && state !== 'disconnecting') {
        $worker.setKey('state', 'disconnecting');
    }

    cleanup(connection);
}

function handleOnline(): void {
    $worker.setKey('online', true);
}

function handleOffline(): void {
    $worker.setKey('online', false);
}

function cleanup(worker: Optional<SharedWorker>): void {
    worker?.port.close();

    const {connection} = $worker.get();
    if (worker !== connection) {
        return;
    }


    $worker.setKey('state', 'disconnected');
    $worker.setKey('connection', null);
    $worker.setKey('clientId', null);
    $worker.setKey('online', navigator.onLine);
}

function handleConnected(message: ConnectedWorkerMessage): void {
    $worker.setKey('state', 'connected');
    $worker.setKey('clientId', message.payload.clientId);

    subscribeTo(`${IN_BASE}.*`);
}

function handleDisconnected(): void {
    const {state} = $worker.get();
    if (state !== 'disconnected' && state !== 'disconnecting') {
        $worker.setKey('state', 'disconnected');
    }
    $worker.setKey('clientId', null);
}

//
//* Receive
//

function handleMessage(event: MessageEvent<OutWorkerMessage>): void {
    const message = event.data;

    switch (message.type) {
        case 'connected':
            handleConnected(message);
            break;

        case 'status':
            $worker.setKey('ready', message.payload.ready);
            break;

        case 'received':
            handleReceivedMessage(message);
            break;

        case 'disconnected':
            handleDisconnected();
            break;
    }
}

function handleReceivedMessage(message: ReceivedWorkerMessage): void {
    const {type, payload} = message.payload;

    switch (type) {
        case MessageType.UPDATED:
            handleUpdatedMessage(payload);
            break;
    }
}

//
//* Send
//

function subscribeTo(operation: string): void {
    const {connection} = $worker.get();
    connection?.port.postMessage({
        type: 'subscribe',
        payload: {operation},
    } satisfies SubscribeWorkerMessage);
}

function sendMessage(message: InMessage): void {
    const {connection} = $worker.get();
    connection?.port.postMessage({type: 'send', payload: message} satisfies SendWorkerMessage);
}

//
//* Flow: Client → Server
//

export function sendJoin(contentId: string, project: string): void {
    const {clientId} = $worker.get();
    if (!clientId) {
        sendMessage({type: MessageType.JOIN, payload: {
            contentId,
            project,
            clientId,
        }} satisfies JoinMessage);
    }
}

export function sendLeave(contentId: string, project: string): void {
    const {clientId} = $worker.get();
    if (!clientId) {
        sendMessage({type: MessageType.LEAVE, payload: {
            contentId,
            project,
            clientId,
        }} satisfies LeaveMessage);
    }
}

//
//* Flow: Server → Client
//

function handleUpdatedMessage({contentId, project, collaborators}: UpdatedMessagePayload): void {
    console.log('Updated message', {contentId, project, collaborators});
}
