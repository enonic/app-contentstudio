// * Content Studio
export type ContentStudioEventBaseType = 'com.enonic.app.contentstudio';

// *   Collaboration
export type CollaborationEventBaseType = `${ContentStudioEventBaseType}.collaboration`;
// client → server
type CollaborationInEventType = `${CollaborationEventBaseType}.in`;
export type JoinMessageType = `${CollaborationInEventType}.join`;
export type LeaveMessageType = `${CollaborationInEventType}.leave`;
export type CollaborationInMessageType = JoinMessageType | LeaveMessageType;
// server → client
type CollaborationOutEventType = `${CollaborationEventBaseType}.out`;
export type UpdatedMessageType = `${CollaborationOutEventType}.updated`;
export type CollaborationOutMessageType = UpdatedMessageType;

// *   Server Events
// XP → server
type ApplicationEventType = 'application';
type NodeEventType = `node.${string}`;
type RepositoryEventType = `repository.${string}`;
type TaskEventType = `task.${string}`;
export type ServerInMessageType = ApplicationEventType | NodeEventType | RepositoryEventType | TaskEventType;

// server → client
type ServerOutEventType = `${ContentStudioEventBaseType}.server.out`;
type ApplicationOutEventType = `${ServerOutEventType}.application`;
type NodeOutEventType = `${ServerOutEventType}.node`;
type RepositoryOutEventType = `${ServerOutEventType}.repository`;
type TaskOutEventType = `${ServerOutEventType}.task`;
export type ServerOutMessageType = ApplicationOutEventType | NodeOutEventType | RepositoryOutEventType | TaskOutEventType;

// * Content Operator
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

export type ContentOperatorInMessage = BaseInMessage<ContentOperatorMessageType, Record<string, unknown>>;

export type InMessage = CollaborationInMessage | ContentOperatorInMessage;

//
//* Server -> Client
//

export type OutMessageType = CollaborationOutMessageType | ServerOutMessageType;

type BaseOutMessage<T extends OutMessageType, P = unknown> = {
    type: T;
    payload: P;
};

export type OutMessage = CollaborationOutMessage | ServerOutMessage;

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

export type CollaborationInMessage = JoinMessage | LeaveMessage;

// Server returns prompt for analysis and the result
export type UpdatedMessage = BaseOutMessage<UpdatedMessageType, {
    contentId: string;
    project: string;
    collaborators: string[];
}>;

export type UpdatedMessagePayload = UpdatedMessage['payload'];

type CollaborationOutMessage = UpdatedMessage;

type ServerMessagePayload = {
    type: LiteralUnion<ServerInMessageType>;
    timestamp: number;
    data: Record<string, unknown>;
};

export type ServerInMessage = Record<string, unknown>;

export type ApplicationMessage = BaseOutMessage<ApplicationOutEventType, ServerMessagePayload>;
export type NodeMessage = BaseOutMessage<NodeOutEventType, ServerMessagePayload>;
export type RepositoryMessage = BaseOutMessage<RepositoryOutEventType, ServerMessagePayload>;
export type TaskMessage = BaseOutMessage<TaskOutEventType, ServerMessagePayload>;

export type ServerOutMessage = ApplicationMessage | NodeMessage | RepositoryMessage | TaskMessage;
