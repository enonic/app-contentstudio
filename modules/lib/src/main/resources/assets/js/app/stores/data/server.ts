/* eslint-disable @typescript-eslint/consistent-type-definitions */
export const MESSAGE_BASE = 'com.enonic.app.contentstudio.server';

export const IN_BASE = `${MESSAGE_BASE}.in`;
export const OUT_BASE = `${MESSAGE_BASE}.out`;

export enum MessageType {
    // client → server

    // server → client
    APPLICATION = `${OUT_BASE}.application`,
    NODE = `${OUT_BASE}.node`,
    REPOSITORY = `${OUT_BASE}.repository`,
    TASK = `${OUT_BASE}.task`,
    PROJECT = `${OUT_BASE}.project`,
}

//
//* Client -> Server
//

//
//* Server -> Client
//

export type OutMessageType = MessageType.APPLICATION | MessageType.NODE | MessageType.REPOSITORY | MessageType.TASK | MessageType.PROJECT;

type BaseOutMessage<T extends OutMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type OutMessage =
    | ApplicationMessage
    | NodeMessage
    | RepositoryMessage
    | TaskMessage
    | ProjectMessage;

//
//* Messages
//

export type ServerMessagePayload = {
    type: string;
    timestamp: number;
    data?: Record<string, unknown>;
}

export type ApplicationMessage = BaseOutMessage<MessageType.APPLICATION, ServerMessagePayload>;

export type NodeMessage = BaseOutMessage<MessageType.NODE, ServerMessagePayload>;

export type RepositoryMessage = BaseOutMessage<MessageType.REPOSITORY, ServerMessagePayload>;

export type TaskMessage = BaseOutMessage<MessageType.TASK, ServerMessagePayload>;

export type ProjectMessage = BaseOutMessage<MessageType.PROJECT, ServerMessagePayload>;
