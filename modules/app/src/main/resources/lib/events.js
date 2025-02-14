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

function isEventType(type) {
    const eventType = fromCustom(type);
    return eventType.indexOf('ai.contentoperator.') === 0;
}
exports.isEventType = isEventType;

function handleMessage(message) {
    sendEvent(message);
}
exports.handleMessage = handleMessage;

function init() {
    // TODO: Replace with subscriptions and other supported event types
    eventLib.listener({
        type: `custom.ai.contentoperator.out.*`,
        localOnly: false,
        callback: (event) => {
            if (isEventType(event.type)) {
                websocketLib.sendToGroup('events', JSON.stringify(event.data));
            }
        },
    });
}
exports.init = init;
