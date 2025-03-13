import {InMessage as CollaborationInMessage, OutMessage as CollaborationOutMessage} from './collaboration';
import {OutMessage as ServerOutMessage} from './server';

interface WorkerMessage<T> {
    type: T;
}

type WorkerMessageWithPayload<T, P extends Record<string, unknown> = Record<string, unknown>> = WorkerMessage<T> & {
    payload: P;
};

type InMessage = CollaborationInMessage;

type OutMessage = CollaborationOutMessage | ServerOutMessage;

//
//* Client -> Worker
//

export type SubscribeWorkerMessage = WorkerMessageWithPayload<'subscribe', {operation: string}>;

export type UnsubscribeWorkerMessage = WorkerMessageWithPayload<'unsubscribe', {operation: string}>;

export type SendWorkerMessage = WorkerMessageWithPayload<'send', InMessage>;

export type InWorkerMessage = SubscribeWorkerMessage | UnsubscribeWorkerMessage | SendWorkerMessage;

//
//* Worker -> Client
//

export type ConnectedWorkerMessage = WorkerMessageWithPayload<'connected', {clientId: string}>;

export type DisconnectedWorkerMessage = WorkerMessage<'disconnected'>;

export type StatusWorkerMessage = WorkerMessageWithPayload<'status', {ready: boolean}>;

export type ReceivedWorkerMessage = WorkerMessageWithPayload<'received', OutMessage>;

export type OutWorkerMessage =
    | ConnectedWorkerMessage
    | DisconnectedWorkerMessage
    | StatusWorkerMessage
    | ReceivedWorkerMessage;

//
//* Utils
//

export function isWorkerMessage(message: unknown): message is InWorkerMessage | OutWorkerMessage {
    return (
        typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        'payload' in message &&
        typeof message.type === 'string' &&
        typeof message.payload === 'object'
    );
}

export function isInWorkerMessage(message: unknown): message is InWorkerMessage {
    return (
        isWorkerMessage(message) &&
        (message.type === 'subscribe' || message.type === 'unsubscribe' || message.type === 'send')
    );
}

export function isOutWorkerMessage(message: unknown): message is OutWorkerMessage {
    return (
        isWorkerMessage(message) &&
        (message.type === 'connected' ||
            message.type === 'disconnected' ||
            message.type === 'status' ||
            message.type === 'received')
    );
}
