type WorkerMessage<T> = {
    type: T;
}

type WorkerMessageWithPayload<T, P extends Record<string, unknown> = Record<string, unknown>> = WorkerMessage<T> & {
    payload: P;
}

//
//* Incoming Messages
//

type SubscribeWorkerMessage = WorkerMessageWithPayload<'subscribe', {operation: string}>;

type UnsubscribeWorkerMessage = WorkerMessageWithPayload<'unsubscribe', {operation: string}>;

type SendWorkerMessage = WorkerMessageWithPayload<'send'>;

type InWorkerMessage = SubscribeWorkerMessage | UnsubscribeWorkerMessage | SendWorkerMessage;

//
//* Outgoing Messages
//

type ConnectedWorkerMessage = WorkerMessage<'connected'>;

type DisconnectedWorkerMessage = WorkerMessage<'disconnected'>;

type StatusWorkerMessage = WorkerMessageWithPayload<'status', {ready: boolean}>;

type SubscribedWorkerMessage = WorkerMessageWithPayload<'subscribed', {subscriberId: string}>;

type ReceivedWorkerMessage = WorkerMessageWithPayload<'received'>;

type OutWorkerMessage = ConnectedWorkerMessage | DisconnectedWorkerMessage | StatusWorkerMessage | SubscribedWorkerMessage | ReceivedWorkerMessage;

//
//* Utils
//

function isWorkerMessage(message: unknown): message is InWorkerMessage | OutWorkerMessage {
    return typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        'payload' in message &&
        typeof message.type === 'string' &&
        typeof message.payload === 'object';
}

function isInWorkerMessage(message: unknown): message is InWorkerMessage {
    return isWorkerMessage(message) && (
            message.type === 'subscribe' ||
            message.type === 'unsubscribe' ||
            message.type === 'send'
        );
}

function isOutWorkerMessage(message: unknown): message is OutWorkerMessage {
    return isWorkerMessage(message) && (
            message.type === 'connected' ||
            message.type === 'disconnected' ||
            message.type === 'status' ||
            message.type === 'subscribed' ||
            message.type === 'received'
        );
}
