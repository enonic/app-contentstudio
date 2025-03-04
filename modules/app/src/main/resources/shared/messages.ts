export type ContentStudioEventBaseType = 'com.enonic.app.contentstudio';
export type CollaborationEventBaseType = `${ContentStudioEventBaseType}.collaboration`;
export type CollaborationInEventType = `${CollaborationEventBaseType}.in`;
export type CollaborationOutEventType = `${CollaborationEventBaseType}.out`;

export enum MessageType {
    // client → server
    JOIN = 'com.enonic.app.contentstudio.collaboration.in.join',
    LEAVE = 'com.enonic.app.contentstudio.collaboration.in.leave',

    // server → client
    UPDATED = `com.enonic.app.contentstudio.collaboration.out.updated`,
}

// String literal types that mirror the enum values
export type JoinMessageType = 'com.enonic.app.contentstudio.collaboration.in.join';
export type LeaveMessageType = 'com.enonic.app.contentstudio.collaboration.in.leave';
export type UpdatedMessageType = 'com.enonic.app.contentstudio.collaboration.out.updated';

export type ContentOperatorMessageType = `custom.ai.contentoperator.${string}`;

//
//* Client -> Server
//

// Use string literal types instead of enum references
export type InMessageType = JoinMessageType | LeaveMessageType | ContentOperatorMessageType;

type BaseInMessage<T extends InMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type InMessage = JoinMessage | LeaveMessage;

export type ContentOperatorInMessage = BaseInMessage<ContentOperatorMessageType, Record<string, unknown>>;

export type AnyInMessage = InMessage | ContentOperatorInMessage;

//
//* Server -> Client
//

export type OutMessageType = UpdatedMessageType;

type BaseOutMessage<T extends OutMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type OutMessage = UpdatedMessage;

//
//* Messages
//

// Client requests generate
export type JoinMessage = BaseInMessage<JoinMessageType, {
    contentId: string;
    project: string;
    clientId: string;
}>;

export type JoinMessagePayload = JoinMessage['payload'];

// Client requests stop generation
export type LeaveMessage = BaseInMessage<LeaveMessageType, {
    contentId: string;
    project: string;
    clientId: string;
}>;

export type LeaveMessagePayload = LeaveMessage['payload'];

// Server returns prompt for analysis and the result
export type UpdatedMessage = BaseOutMessage<UpdatedMessageType, {
    contentId: string;
    project: string;
    collaborators: string[];
}>;

export type UpdatedMessagePayload = UpdatedMessage['payload'];
