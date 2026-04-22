import type {IncomingMessage, OutgoingMessage} from '@enonic/page-editor';

// ! Envelope must match npm-page-editor transport/channel.ts: `{version: 2, source: 'page-editor', ...}`.
// ! Raw messages are silently dropped by the peer's filter, which blackholes every CS→iframe send.
const WIRE_VERSION = 2;
const WIRE_SOURCE = 'page-editor';

interface WireEnvelope {
    version: typeof WIRE_VERSION;
    source: typeof WIRE_SOURCE;
}

// ? Resolve contentWindow lazily from the iframe element so the subscriber can match
// ? `event.source` even when a `ready` message arrives before the parent's `load` task runs.
let iframeEl: HTMLIFrameElement | undefined;
let iframeOrigin: string | undefined;

export function setIframeElement(el: HTMLIFrameElement | undefined, origin?: string): void {
    iframeEl = el;
    iframeOrigin = origin;
}

export function postToIframe(message: IncomingMessage): void {
    const win = iframeEl?.contentWindow;
    if (win == null) return;
    const envelope: IncomingMessage & WireEnvelope = {version: WIRE_VERSION, source: WIRE_SOURCE, ...message};
    win.postMessage(envelope, iframeOrigin ?? '*');
}

export function subscribeToIframe(handler: (message: OutgoingMessage) => void): () => void {
    const listener = (event: MessageEvent): void => {
        const win = iframeEl?.contentWindow;
        if (win == null || event.source !== win) return;
        if (iframeOrigin != null && event.origin !== iframeOrigin) return;

        const data = event.data;
        if (data == null || typeof data !== 'object') return;

        const wire = data as Record<string, unknown>;
        if (wire.version !== WIRE_VERSION || wire.source !== WIRE_SOURCE) return;

        const {version: _version, source: _source, ...message} = wire;
        handler(message as OutgoingMessage);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
}
