/* eslint-disable @typescript-eslint/consistent-type-definitions */
export const MESSAGE_BASE = 'com.enonic.app.contentstudio.collaboration';

export const IN_BASE = `${MESSAGE_BASE}.in`;
export const OUT_BASE = `${MESSAGE_BASE}.out`;

export enum MessageType {
    // client → server
    JOIN = `${IN_BASE}.join`,
    LEAVE = `${IN_BASE}.leave`,

    // server → client
    UPDATED = `${OUT_BASE}.updated`,
}

//
//* Client -> Server
//

export type InMessageType = MessageType.JOIN | MessageType.LEAVE;

type BaseInMessage<T extends InMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type InMessage = JoinMessage | LeaveMessage;

//
//* Server -> Client
//

export type OutMessageType = MessageType.UPDATED;

type BaseOutMessage<T extends OutMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type OutMessage = UpdatedMessage;

//
//* Messages
//

// Client requests generate
export type JoinMessage = BaseInMessage<MessageType.JOIN, {
    contentId: string;
    project: string;
    clientId: string;
}>;

export type JoinMessagePayload = JoinMessage['payload'];

// Client requests stop generation
export type LeaveMessage = BaseInMessage<MessageType.LEAVE, {
    contentId: string;
    project: string;
    clientId: string;
}>;

export type LeaveMessagePayload = LeaveMessage['payload'];

// Server returns prompt for analysis and the result
export type UpdatedMessage = BaseOutMessage<MessageType.UPDATED, {
    contentId: string;
    project: string;
    collaborators: string[];
}>;

export type UpdatedMessagePayload = UpdatedMessage['payload'];
