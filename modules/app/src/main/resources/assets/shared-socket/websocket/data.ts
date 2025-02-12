type WebSocketInMessage = 'connected' | 'pong' | 'disconnected';

type WebSocketOutMessage = 'connect' | 'ping' | 'subscribe' | 'disconnect';

type WebSocketMessageType = WebSocketInMessage | WebSocketOutMessage;

export type WebSocketMessage = {
    type: LiteralUnion<WebSocketMessageType>;
};

export function isWebSocketMessage(message: unknown): message is WebSocketMessage {
    return typeof message === 'object' &&
        message !== null &&
        'type' in message &&
        typeof message.type === 'string';
}
