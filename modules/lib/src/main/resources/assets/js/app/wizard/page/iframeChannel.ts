import type {IncomingMessage, OutgoingMessage} from '@enonic/page-editor';

let iframeWindow: Window | undefined;

export function setIframeWindow(win: Window | undefined): void {
    iframeWindow = win;
}

export function postToIframe(message: IncomingMessage): void {
    if (iframeWindow == null) return;
    iframeWindow.postMessage(message, '*');
}

export function subscribeToIframe(handler: (message: OutgoingMessage) => void): () => void {
    const listener = (event: MessageEvent): void => {
        if (event.source !== iframeWindow) return;
        handler(event.data as OutgoingMessage);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
}
