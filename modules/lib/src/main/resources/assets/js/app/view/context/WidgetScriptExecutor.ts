/**
 * Handles script execution within Shadow DOM.
 *
 * This executor:
 * 1. Creates script elements
 * 2. Temporarily intercepts document query methods to redirect to shadow root
 * 3. Executes scripts by appending them to the shadow root
 * 4. Restores original document methods after execution
 *
 * This provides JavaScript isolation where widget scripts' document queries
 * are redirected to their shadow root container.
 */
export class WidgetScriptExecutor {

    private readonly shadowRoot: ShadowRoot;

    private readonly scriptElements: HTMLScriptElement[] = [];

    private readonly timeouts = new Set<number>();

    private readonly intervals = new Set<number>();

    private isExecuting = false;

    // Store original document methods for restoration
    private static originalMethods: {
        querySelector: typeof document.querySelector;
        querySelectorAll: typeof document.querySelectorAll;
        getElementById: typeof document.getElementById;
        getElementsByClassName: typeof document.getElementsByClassName;
        getElementsByTagName: typeof document.getElementsByTagName;
        bodyDescriptor: PropertyDescriptor | undefined;
    } | null = null;

    private static activeExecutor: WidgetScriptExecutor | null = null;

    constructor(shadowRoot: ShadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    /**
     * Installs document method interceptors that redirect queries to the shadow root.
     */
    private installInterceptors(): void {
        if (WidgetScriptExecutor.originalMethods) {
            // Already installed by another executor, update active executor
            WidgetScriptExecutor.activeExecutor = this;
            return;
        }

        // Store original methods and property descriptors
        WidgetScriptExecutor.originalMethods = {
            querySelector: document.querySelector.bind(document),
            querySelectorAll: document.querySelectorAll.bind(document),
            getElementById: document.getElementById.bind(document),
            getElementsByClassName: document.getElementsByClassName.bind(document),
            getElementsByTagName: document.getElementsByTagName.bind(document),
            bodyDescriptor: Object.getOwnPropertyDescriptor(Document.prototype, 'body'),
        };

        WidgetScriptExecutor.activeExecutor = this;

        const getActiveShadowRoot = () => WidgetScriptExecutor.activeExecutor?.shadowRoot;

        // Override document.body to return shadow root host (acts as body for the widget)
        Object.defineProperty(document, 'body', {
            get: function () {
                const shadowRoot = getActiveShadowRoot();
                if (shadowRoot) {
                    return shadowRoot;
                }
                // Fall back to original body
                return WidgetScriptExecutor.originalMethods?.bodyDescriptor?.get?.call(document);
            },
            configurable: true,
        });

        // Helper to check if selector targets script elements
        const isScriptSelector = (selectors: string): boolean => {
            const lower = selectors.toLowerCase();
            return lower.startsWith('script') || lower.includes(' script') || lower.includes('>script');
        };

        // Override querySelector
        document.querySelector = function <K extends keyof HTMLElementTagNameMap> (selectors: K | string): HTMLElementTagNameMap[K] | Element | null {
            const shadowRoot = getActiveShadowRoot();
            // Don't intercept script queries - scripts are in document.head
            if (shadowRoot && !isScriptSelector(String(selectors))) {
                const result = shadowRoot.querySelector(selectors);
                if (result) {
                    return result;
                }
            }
            return WidgetScriptExecutor.originalMethods.querySelector.call(document, selectors);
        };

        // Override querySelectorAll
        document.querySelectorAll = function <K extends keyof HTMLElementTagNameMap> (selectors: K | string): NodeListOf<HTMLElementTagNameMap[K] | Element> {
            const shadowRoot = getActiveShadowRoot();
            // Don't intercept script queries - scripts are in document.head
            if (shadowRoot && !isScriptSelector(String(selectors))) {
                return shadowRoot.querySelectorAll(selectors);
            }
            return WidgetScriptExecutor.originalMethods.querySelectorAll.call(document, selectors);
        };

        // Override getElementById
        document.getElementById = function (elementId: string): HTMLElement | null {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                const result = shadowRoot.getElementById(elementId);
                if (result) {
                    return result;
                }
            }
            return WidgetScriptExecutor.originalMethods.getElementById.call(document, elementId);
        };

        // Override getElementsByClassName
        document.getElementsByClassName = function (classNames: string): HTMLCollectionOf<Element> {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                // Shadow root doesn't have getElementsByClassName, use querySelectorAll
                const selector = '.' + classNames.trim().split(/\s+/).join('.');
                const elements = shadowRoot.querySelectorAll(selector);
                // Convert NodeList to HTMLCollection-like object
                return elements as unknown as HTMLCollectionOf<Element>;
            }
            return WidgetScriptExecutor.originalMethods.getElementsByClassName.call(document, classNames);
        };

        // Override getElementsByTagName
        document.getElementsByTagName = function <K extends keyof HTMLElementTagNameMap> (qualifiedName: K | string): HTMLCollectionOf<HTMLElementTagNameMap[K] | Element> {
            const shadowRoot = getActiveShadowRoot();
            if (shadowRoot) {
                return shadowRoot.querySelectorAll(qualifiedName) as unknown as HTMLCollectionOf<HTMLElementTagNameMap[K] | Element>;
            }
            return WidgetScriptExecutor.originalMethods.getElementsByTagName.call(document, qualifiedName) as HTMLCollectionOf<HTMLElementTagNameMap[K] | Element>;
        };
    }

    /**
     * Removes document method interceptors and restores original behavior.
     */
    private removeInterceptors(): void {
        if (WidgetScriptExecutor.activeExecutor === this) {
            WidgetScriptExecutor.activeExecutor = null;
        }

        // Only restore if no other executor is active
        if (!WidgetScriptExecutor.activeExecutor && WidgetScriptExecutor.originalMethods) {
            document.querySelector = WidgetScriptExecutor.originalMethods.querySelector;
            document.querySelectorAll = WidgetScriptExecutor.originalMethods.querySelectorAll;
            document.getElementById = WidgetScriptExecutor.originalMethods.getElementById;
            document.getElementsByClassName = WidgetScriptExecutor.originalMethods.getElementsByClassName;
            document.getElementsByTagName = WidgetScriptExecutor.originalMethods.getElementsByTagName;

            // Restore document.body
            if (WidgetScriptExecutor.originalMethods.bodyDescriptor) {
                Object.defineProperty(document, 'body', WidgetScriptExecutor.originalMethods.bodyDescriptor);
            }

            WidgetScriptExecutor.originalMethods = null;
        }
    }

    /**
     * Executes a script element.
     * Scripts are appended to document.head for proper execution,
     * but DOM queries are intercepted to redirect to the shadow root.
     */
    executeScript(scriptEl: HTMLScriptElement): Promise<void> {
        return new Promise((resolve) => {
            const newScript = document.createElement('script');

            // Copy ALL attributes from original script (including data-* attributes)
            // This is important for widgets that use document.currentScript.getAttribute()
            for (const attr of Array.from(scriptEl.attributes)) {
                newScript.setAttribute(attr.name, attr.value);
            }

            // Mark as widget script for identification
            newScript.setAttribute('data-widget-script', 'true');

            // Install interceptors before script execution
            this.installInterceptors();
            this.isExecuting = true;

            if (scriptEl.src) {
                // External script - add cache-busting for modules to ensure re-execution
                let srcUrl = scriptEl.src;
                if (scriptEl.type === 'module') {
                    const separator = srcUrl.includes('?') ? '&' : '?';
                    srcUrl = `${srcUrl}${separator}_cb=${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
                newScript.src = srcUrl;

                newScript.onload = () => {
                    this.isExecuting = false;
                    resolve();
                };
                newScript.onerror = () => {
                    console.warn(`WidgetScriptExecutor: Failed to load script: ${scriptEl.src}`);
                    this.isExecuting = false;
                    resolve();
                };
            } else {
                // Inline script - wrap to redirect document access
                const originalCode = scriptEl.textContent || '';
                newScript.textContent = this.wrapScriptCode(originalCode);
            }

            // Track for cleanup
            this.scriptElements.push(newScript);

            // Append to document.head for proper execution
            // (scripts in shadow DOM don't execute reliably)
            document.head.appendChild(newScript);

            // For inline scripts, execution is synchronous (but modules are async)
            if (!scriptEl.src && scriptEl.type !== 'module') {
                this.isExecuting = false;
                resolve();
            }

            // For module scripts without src, they're async so resolve after a tick
            if (!scriptEl.src && scriptEl.type === 'module') {
                setTimeout(() => {
                    this.isExecuting = false;
                    resolve();
                }, 0);
            }
        });
    }

    /**
     * Wraps script code to set up the execution context.
     */
    private wrapScriptCode(code: string): string {
        // The interceptors are already installed globally, so the code will
        // automatically have its document queries redirected to the shadow root.
        // We wrap in an IIFE to provide a clean scope.
        return `(function() {
    ${code}
})();`;
    }

    /**
     * Creates tracked setTimeout that can be cleaned up.
     */
    trackTimeout(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const id = window.setTimeout(() => {
            this.timeouts.delete(id);
            this.installInterceptors(); // Re-install for async execution
            try {
                if (typeof fn === 'function') {
                    fn(...args);
                }
            } finally {
                this.removeInterceptors();
            }
        }, delay);
        this.timeouts.add(id);
        return id;
    }

    /**
     * Creates tracked setInterval that can be cleaned up.
     */
    trackInterval(fn: TimerHandler, delay?: number, ...args: unknown[]): number {
        const id = window.setInterval(() => {
            this.installInterceptors(); // Re-install for async execution
            try {
                if (typeof fn === 'function') {
                    fn(...args);
                }
            } finally {
                this.removeInterceptors();
            }
        }, delay);
        this.intervals.add(id);
        return id;
    }

    /**
     * Cleans up all resources.
     */
    cleanup(): void {
        // Remove interceptors
        this.removeInterceptors();

        // Clear all tracked timeouts
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.timeouts.clear();

        // Clear all tracked intervals
        this.intervals.forEach(id => window.clearInterval(id));
        this.intervals.clear();

        // Remove script elements
        this.scriptElements.forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        this.scriptElements.length = 0;

        WidgetScriptExecutor.removeScripts();
    }

    static removeScripts() {
        // Ensure all widget scripts are removed from document.head (even those not tracked by this instance)
        document.head.querySelectorAll('script[data-widget-script]').forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
    }
}
