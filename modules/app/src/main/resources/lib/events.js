const collaborationLib = require('/lib/collaboration');
const eventLib = require('/lib/xp/event');
const websocketLib = require('/lib/xp/websocket');

function sendEvent(data) {
    eventLib.send({
        type: data.type,
        distributed: false,
        data,
    });
}

function fromCustom(eventType) {
    return eventType.replace(/^custom./, '');
}

function isAiContentOperatorEvent(type) {
    return type.indexOf('ai.contentoperator.') === 0;
}

function isContentStudioEvent(type) {
    return type.indexOf('com.enonic.app.contentstudio.') === 0;
}

function handleCollaborationEvent(message, userKey) {
    const params = {
        userKey: userKey,
        contentId: message.payload.contentId,
        project: message.payload.project,
        clientId: message.payload.clientId,
    }

    if (message.type === 'com.enonic.app.contentstudio.collaboration.in.join') {
        collaborationLib.join(params);
    } else if (message.type === 'com.enonic.app.contentstudio.collaboration.in.leave') {
        collaborationLib.leave(params);
    }
}

exports.isEventType = function (type) {
    const eventType = fromCustom(type);
    return isAiContentOperatorEvent(eventType) || isContentStudioEvent(eventType);
}

exports.handleMessage = function (message, userKey) {
    if (isAiContentOperatorEvent(message.type)) {
        sendEvent(message);
    } else if (isContentStudioEvent(message.type)) {
        handleCollaborationEvent(message, userKey);
    }
}

exports.init = function init() {
    // TODO: Replace with subscriptions and other supported event types
    eventLib.listener({
        type: `custom.ai.contentoperator.out.*`,
        localOnly: false,
        callback: (event) => {
            if (isAiContentOperatorEvent(fromCustom(event.type))) {
                websocketLib.sendToGroup('events', JSON.stringify(event.data));
            }
        },
    });

    eventLib.listener({
        type: `custom.com.enonic.app.contentstudio.collaboration.out.*`,
        localOnly: false,
        callback: (event) => {
            if (isContentStudioEvent(fromCustom(event.type))) {
                websocketLib.sendToGroup('collaboration', JSON.stringify(event.data));
            }
        },
    });
}
