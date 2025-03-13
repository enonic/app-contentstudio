import type {ApplicationMessage, CollaborationInMessage, ContentOperatorInMessage, ContentStudioEventBaseType, InMessage, NodeMessage, RepositoryMessage, TaskMessage} from '../shared/messages';
import {join, leave} from './collaboration';
import type {EnonicEvent} from '/lib/xp/event';
import * as eventLib from '/lib/xp/event';
import * as websocketLib from '/lib/xp/websocket';

type CustomEventType<T extends string> = `custom.${T}`;

type AnyEnonicEvent = EnonicEvent<Record<string, unknown>>;

type ServerEvent<Message extends InMessage = InMessage, Type extends Message['type'] = Message['type']> = Merge<
    EnonicEvent<Message>,
    {type: Type | CustomEventType<Type>}
>;

type EventData = Record<string, unknown> & {
    type: string;
}

function sendEvent(data: EventData) {
    eventLib.send({
        type: data.type,
        distributed: false,
        data,
    });
}

function fromCustom(eventType: string): string {
    return eventType.replace(/^custom./, '');
}

function isAiContentOperatorEventType(type: string): boolean {
    return fromCustom(type).indexOf('ai.contentoperator.') === 0 ;
}

function isAiContentOperatorEvent(event: AnyEnonicEvent): event is ServerEvent<ContentOperatorInMessage> {
    return isAiContentOperatorEventType(event.type);
}

function isCollaborationEventType(type: string): type is `${ContentStudioEventBaseType}.${string}` {
    return fromCustom(type).indexOf('com.enonic.app.contentstudio.collaboration.') === 0;
}

function isContentStudioEventType(type: string): type is `${ContentStudioEventBaseType}.${string}` {
    return fromCustom(type).indexOf('com.enonic.app.contentstudio.') === 0;
}

function isContentStudioEvent(event: AnyEnonicEvent): event is ServerEvent<InMessage> {
    return isContentStudioEventType(event.type);
}

function handleCollaborationEvent(message: CollaborationInMessage, userKey: string) {
    const params = {
        userKey,
        contentId: message.payload.contentId,
        project: message.payload.project,
        clientId: message.payload.clientId,
    }

    if (message.type === 'com.enonic.app.contentstudio.collaboration.in.join') {
        join(params);
    } else if (message.type === 'com.enonic.app.contentstudio.collaboration.in.leave') {
        leave(params);
    }
}

export function isEventType(type: string): boolean {
    const eventType = fromCustom(type);
    return isAiContentOperatorEventType(eventType) || isContentStudioEventType(eventType);
}

export function handleMessage(message: InMessage, userKey: string): void {
    if (isAiContentOperatorEventType(message.type)) {
        sendEvent(message);
    } else if (isCollaborationEventType(message.type)) {
        handleCollaborationEvent(message as CollaborationInMessage, userKey);
    }
}

export function init(): void {
    // TODO: Replace with subscriptions and other supported event types
    eventLib.listener({
        type: 'custom.ai.contentoperator.out.*',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            if (isAiContentOperatorEvent(event)) {
                websocketLib.sendToGroup('events', JSON.stringify(event.data));
            }
        },
    });

    eventLib.listener({
        type: 'custom.com.enonic.app.contentstudio.collaboration.out.*',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            if (isContentStudioEvent(event)) {
                websocketLib.sendToGroup('collaboration', JSON.stringify(event.data));
            }
        },
    });

    eventLib.listener({
        type: 'application',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            const message = JSON.stringify({
                type: 'com.enonic.app.contentstudio.server.out.application',
                payload: event,
            } satisfies ApplicationMessage);
            websocketLib.sendToGroup('application', message);
        },
    });

    eventLib.listener({
        type: 'node.*',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            const message = JSON.stringify({
                type: 'com.enonic.app.contentstudio.server.out.node',
                payload: event,
            } satisfies NodeMessage);
            websocketLib.sendToGroup('node', message);
        },
    });

    eventLib.listener({
        type: 'repository.*',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            const message = JSON.stringify({
                type: 'com.enonic.app.contentstudio.server.out.repository',
                payload: event,
            } satisfies RepositoryMessage);
            websocketLib.sendToGroup('repository', message);
        },
    });

    eventLib.listener({
        type: 'task.*',
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            const message = JSON.stringify({
                type: 'com.enonic.app.contentstudio.server.out.task',
                payload: event,
            } satisfies TaskMessage);
            websocketLib.sendToGroup('task', message);
        },
    });
}
