import {type InWorkerMessage, type OutWorkerMessage} from '../data/worker';
import {importScript} from './scripts';

export class SharedSocketProxy {
    private static readonly NS = 'shared-socket';

    private readonly url: string;

    private worker: Optional<SharedWorker> = null;

    private messageListener: Optional<(message: OutWorkerMessage) => void>;

    private unsubscribeAll: Optional<() => void>;

    private isReady: boolean = false;

    private openOnLoaded: boolean = false;

    constructor(url: string) {
        this.url = url;

        if (typeof SharedWorker !== 'undefined') {
            try {
                this.worker = new SharedWorker(this.url, {type: 'module', name: 'shared-socket-worker'});
                this.isReady = true;
                this.initSharedWorkerListeners();
            } catch (err) {
                console.error('[Shared Socket Proxy] Failed to create SharedWorker, attempting fallback:', err);
                this.worker = null;
                void this.initFallback();
            }
        } else {
            console.log('[Shared Socket Proxy] SharedWorker not supported. Initializing fallback...');
            void this.initFallback();
        }
    }

    private static dispatchEvent(type: `${typeof SharedSocketProxy.NS}:${string}`, detail?: unknown): void {
        window.dispatchEvent(new CustomEvent(type, {detail}));
    }

    private async initFallback(): Promise<void> {
        try {
            // TODO: Replace with regular import once target is es2022+
            // await import(/* webpackIgnore: true */ url);
            await importScript(this.url);
            this.isReady = true;

            this.initFallbackListeners();

            if (this.openOnLoaded) {
                this.openOnLoaded = false;
                SharedSocketProxy.dispatchEvent(`${SharedSocketProxy.NS}:open`);
            }
        } catch (err) {
            console.error('[Shared Socket Proxy] Failed to import fallback script:', err);
        }
    }

    private initSharedWorkerListeners(): void {
        if (!this.worker) {
            return;
        }

        this.worker.onerror = (event) => {
            console.error('[Shared Socket Proxy] SharedWorker global error:', event);
            this.messageListener?.({type: 'disconnected'});
        };

        this.worker.port.onmessageerror = (event) => {
            console.error('[Shared Socket Proxy] Failed to deserialize message from SharedWorker:', event);
        };

        this.worker.port.onmessage = (event: MessageEvent<OutWorkerMessage>) => {
            this.messageListener?.(event.data);
        };
    }

    private initFallbackListeners(): void {
        this.unsubscribeAll?.();

        const windowMessageListener = (event: Event) => {
            this.messageListener?.((event as CustomEvent<OutWorkerMessage>).detail);
        };

        const windowErrorListener = () => {
            this.messageListener?.({type: 'disconnected'});
        };

        window.addEventListener(`${SharedSocketProxy.NS}:message:out`, windowMessageListener);
        window.addEventListener(`${SharedSocketProxy.NS}:error`, windowErrorListener);

        this.unsubscribeAll = () => {
            window.removeEventListener(`${SharedSocketProxy.NS}:message:out`, windowMessageListener);
            window.removeEventListener(`${SharedSocketProxy.NS}:error`, windowErrorListener);
            this.unsubscribeAll = null;
        };
    }

    onMessage(listener: (message: OutWorkerMessage) => void): void {
        this.messageListener = listener;
    }

    send(message: InWorkerMessage): void {
        if (!this.isReady) {
            console.error('[Shared Socket Proxy] Cannot send message, proxy not ready yet.');
            return;
        }

        if (this.worker) {
            this.worker.port.postMessage(message);
        } else {
            SharedSocketProxy.dispatchEvent(`${SharedSocketProxy.NS}:message:in`, message);
        }
    }

    open(): void {
        if (!this.isReady) {
            this.openOnLoaded = true;
            return;
        }

        if (this.worker) {
            this.worker.port.start();
        } else {
            SharedSocketProxy.dispatchEvent(`${SharedSocketProxy.NS}:open`);
        }
    }


    close(): void {
        if (!this.isReady) {
            return;
        }

        if (this.worker) {
            this.worker.port.close();
        } else {
            SharedSocketProxy.dispatchEvent(`${SharedSocketProxy.NS}:close`);
            this.unsubscribeAll?.();
        }

        this.messageListener = null;
        this.worker = null;
        this.isReady = false;
        this.openOnLoaded = false;
    }
}
