/**
 * Handles script execution within Shadow DOM with a proxied document object
 * that redirects DOM queries to the shadow root. Tracks timers and intervals
 * for cleanup when the widget is deactivated.
 */
export class WidgetScriptExecutor {

    private readonly shadowRoot: ShadowRoot;

    private readonly documentProxy: Document;

    private readonly windowProxy: Window;

    private readonly timeouts = new Set<number>();

    private readonly intervals = new Set<number>();

    private readonly eventListeners: { target: EventTarget; type: string; listener: EventListener }[] = [];

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
        this.documentProxy = this.createDocumentProxy();
        this.windowProxy = this.createWindowProxy();
    }

    private createDocumentProxy(): Document {
        const shadowRoot = this.shadowRoot;
        const eventListeners = this.eventListeners;

        return new Proxy<Document>(document, {
            get(target: Document, prop: string | symbol): unknown {
                // Redirect DOM queries to shadow root
                if (prop === 'querySelector') {
                    return (selector: string) => shadowRoot.querySelector(selector);
                }
                if (prop === 'querySelectorAll') {
                    return (selector: string) => shadowRoot.querySelectorAll(selector);
                }
                if (prop === 'getElementById') {
                    return (id: string) => shadowRoot.getElementById(id);
                }
                if (prop === 'getElementsByClassName') {
                    return (classNames: string) => {
                        const container = shadowRoot.host as HTMLElement;
                        return container.getElementsByClassName(classNames);
                    };
                }
                if (prop === 'getElementsByTagName') {
                    return (tagName: string) => {
                        const container = shadowRoot.host as HTMLElement;
                        return container.getElementsByTagName(tagName);
                    };
                }

                // Return shadow root host for body/documentElement queries
                if (prop === 'body' || prop === 'documentElement') {
                    return shadowRoot.host;
                }

                // Prevent head manipulation
                if (prop === 'head') {
                    return null;
                }

                // Allow safe operations
                if (prop === 'createElement' ||
                    prop === 'createTextNode' ||
                    prop === 'createDocumentFragment' ||
                    prop === 'createComment' ||
                    prop === 'createEvent' ||
                    prop === 'createRange' ||
                    prop === 'createTreeWalker') {
                    const method = target[prop as keyof Document];
                    if (typeof method === 'function') {
                        return method.bind(target);
                    }
                }

                // Wrap addEventListener to track listeners
                if (prop === 'addEventListener') {
                    return (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => {
                        eventListeners.push({target, type, listener});
                        return target.addEventListener(type, listener, options);
                    };
                }

                // Return value from target for other properties
                const value = target[prop as keyof Document];
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            }
        });
    }

    private createWindowProxy(): Window {
        const trackTimeoutFn = this.trackTimeout.bind(this);
        const trackIntervalFn = this.trackInterval.bind(this);
        const clearTrackedTimeoutFn = this.clearTrackedTimeout.bind(this);
        const clearTrackedIntervalFn = this.clearTrackedInterval.bind(this);
        const eventListeners = this.eventListeners;

        return new Proxy<Window>(window, {
            get(target: Window, prop: string | symbol): unknown {
                // Provide tracked timeout/interval functions
                if (prop === 'setTimeout') {
                    return trackTimeoutFn;
                }
                if (prop === 'setInterval') {
                    return trackIntervalFn;
                }
                if (prop === 'clearTimeout') {
                    return clearTrackedTimeoutFn;
                }
                if (prop === 'clearInterval') {
                    return clearTrackedIntervalFn;
                }

                // Wrap addEventListener to track listeners
                if (prop === 'addEventListener') {
                    return (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => {
                        eventListeners.push({target, type, listener});
                        return target.addEventListener(type, listener, options);
                    };
                }

                // Pass through most window properties
                const value = target[prop as keyof Window];
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            }
        });
    }

    private trackTimeout(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const id = window.setTimeout(() => {
            this.timeouts.delete(id);
            if (typeof fn === 'function') {
                fn(...args);
            } else {
                // eslint-disable-next-line no-eval
                eval(fn);
            }
        }, delay);
        this.timeouts.add(id);
        return id;
    }

    private trackInterval(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const id = window.setInterval(() => {
            if (typeof fn === 'function') {
                fn(...args);
            } else {
                // eslint-disable-next-line no-eval
                eval(fn);
            }
        }, delay);
        this.intervals.add(id);
        return id;
    }

    private clearTrackedTimeout(id: number): void {
        this.timeouts.delete(id);
        window.clearTimeout(id);
    }

    private clearTrackedInterval(id: number): void {
        this.intervals.delete(id);
        window.clearInterval(id);
    }

    /**
     * Executes a script element within the controlled scope.
     * If the script has a src attribute, fetches and executes it.
     * Otherwise, executes the inline script content.
     */
    async executeScript(scriptEl: HTMLScriptElement): Promise<void> {
        let code: string;

        if (scriptEl.src) {
            try {
                const response = await fetch(scriptEl.src);
                if (!response.ok) {
                    console.warn(`WidgetScriptExecutor: Failed to fetch script: ${scriptEl.src}`);
                    return;
                }
                code = await response.text();
            } catch (error) {
                console.warn(`WidgetScriptExecutor: Error fetching script: ${scriptEl.src}`, error);
                return;
            }
        } else {
            code = scriptEl.textContent || '';
        }

        if (!code.trim()) {
            return;
        }

        this.executeCode(code);
    }

    /**
     * Executes JavaScript code within the controlled scope with proxied globals.
     */
    executeCode(code: string): void {
        const context = {
            document: this.documentProxy,
            window: this.windowProxy,
            console: console,
            fetch: fetch.bind(window),
            setTimeout: this.trackTimeout.bind(this),
            setInterval: this.trackInterval.bind(this),
            clearTimeout: this.clearTrackedTimeout.bind(this),
            clearInterval: this.clearTrackedInterval.bind(this),
            Promise: Promise,
            JSON: JSON,
            URL: URL,
            URLSearchParams: URLSearchParams,
            FormData: FormData,
            Headers: Headers,
            Request: Request,
            Response: Response,
            Event: Event,
            CustomEvent: CustomEvent,
            EventTarget: EventTarget,
            Node: Node,
            Element: Element,
            HTMLElement: HTMLElement,
            Text: Text,
            DocumentFragment: DocumentFragment,
            DOMParser: DOMParser,
            XMLSerializer: XMLSerializer,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Boolean: Boolean,
            Date: Date,
            Math: Math,
            RegExp: RegExp,
            Error: Error,
            Map: Map,
            Set: Set,
            WeakMap: WeakMap,
            WeakSet: WeakSet,
            Symbol: Symbol,
            Proxy: Proxy,
            Reflect: Reflect,
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
            encodeURI: encodeURI,
            decodeURI: decodeURI,
            encodeURIComponent: encodeURIComponent,
            decodeURIComponent: decodeURIComponent,
            atob: atob,
            btoa: btoa
        };

        try {
            const fn = new Function(...Object.keys(context), `"use strict";\n${code}`);
            fn.call(this.shadowRoot, ...Object.values(context));
        } catch (error) {
            console.error('WidgetScriptExecutor: Error executing script:', error);
        }
    }

    /**
     * Cleans up all tracked resources (timers, intervals, event listeners).
     * Should be called when the widget is deactivated or removed.
     */
    cleanup(): void {
        // Clear all tracked timeouts
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.timeouts.clear();

        // Clear all tracked intervals
        this.intervals.forEach(id => window.clearInterval(id));
        this.intervals.clear();

        // Remove all tracked event listeners
        this.eventListeners.forEach(({target, type, listener}) => {
            try {
                target.removeEventListener(type, listener);
            } catch (e) {
                // Listener may already be removed
            }
        });
        this.eventListeners.length = 0;
    }
}
