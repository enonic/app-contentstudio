import type {AnyInMessage, ContentOperatorInMessage, InMessage} from '../shared/messages';
import {join, leave} from './collaboration';
import type {EnonicEvent} from '/lib/xp/event';
import * as eventLib from '/lib/xp/event';
import * as websocketLib from '/lib/xp/websocket';

type CustomEventType<T extends string> = `custom.${T}`;

type AnyEnonicEvent = EnonicEvent<Record<string, unknown>>;

type ServerEvent<Message extends AnyInMessage = AnyInMessage, Type extends Message['type'] = Message['type']> = Merge<
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

function isContentStudioEventType(type: string): boolean {
    return fromCustom(type).indexOf('com.enonic.app.contentstudio.') === 0;
}

function isContentStudioEvent(event: AnyEnonicEvent): event is ServerEvent<InMessage> {
    return isContentStudioEventType(event.type);
}

function handleCollaborationEvent(message: InMessage, userKey: string) {
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
    } else if (isContentStudioEventType(message.type)) {
        handleCollaborationEvent(message, userKey);
    }
}

export function init(): void {
    // TODO: Replace with subscriptions and other supported event types
    eventLib.listener({
        type: `custom.ai.contentoperator.out.*`,
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            if (isAiContentOperatorEvent(event)) {
                websocketLib.sendToGroup('events', JSON.stringify(event.data));
            }
        },
    });

    eventLib.listener({
        type: `custom.com.enonic.app.contentstudio.collaboration.out.*`,
        localOnly: false,
        callback: (event: AnyEnonicEvent) => {
            if (isContentStudioEvent(event)) {
                websocketLib.sendToGroup('collaboration', JSON.stringify(event.data));
            }
        },
    });
}
