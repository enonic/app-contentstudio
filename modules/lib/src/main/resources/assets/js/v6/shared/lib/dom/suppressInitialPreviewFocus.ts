export const PREVIEW_FRAME_ATTRIBUTE = 'data-contentstudio-preview';

// Run before site scripts. Release the startup guard as soon as the user enters the preview.
export function suppressInitialPreviewFocus(): () => void {
    if (!window.frameElement?.hasAttribute(PREVIEW_FRAME_ATTRIBUTE) || document.hasFocus()) {
        return () => {};
    }

    let blocked = true;
    const originalWindowFocus = window.focus;
    const guardedWindowFocus = (): void => {
        if (!blocked || document.hasFocus()) {
            release();
            originalWindowFocus.call(window);
        }
    };

    const restoreElementFocus = [HTMLElement.prototype, SVGElement.prototype].map((prototype) => {
        const originalFocus = prototype.focus;
        const guardedFocus = function (this: HTMLElement | SVGElement, options?: FocusOptions): void {
            if (!blocked || document.hasFocus()) {
                release();
                originalFocus.call(this, options);
            }
        };
        prototype.focus = guardedFocus;

        return () => {
            if (prototype.focus === guardedFocus) {
                prototype.focus = originalFocus;
            }
        };
    });

    // select() focuses inputs internally without calling the public focus() method.
    const restoreSelection = [HTMLInputElement.prototype, HTMLTextAreaElement.prototype].map((prototype) => {
        const originalSelect = prototype.select;
        const guardedSelect = function (this: HTMLInputElement | HTMLTextAreaElement): void {
            if (!blocked || document.hasFocus()) {
                release();
                originalSelect.call(this);
            }
        };
        prototype.select = guardedSelect;

        return () => {
            if (prototype.select === guardedSelect) {
                prototype.select = originalSelect;
            }
        };
    });

    // These native methods focus internally too. Keep their UI/state changes, but suppress focus
    // only for the synchronous native call; inputs are interactive again before the method returns.
    const restoreNativeOpening = [
        guardNativeOpening(HTMLDialogElement.prototype, 'show'),
        guardNativeOpening(HTMLDialogElement.prototype, 'showModal'),
        guardNativeOpening(HTMLElement.prototype, 'showPopover'),
        guardNativeOpening(HTMLElement.prototype, 'togglePopover'),
    ];

    function guardNativeOpening<T extends HTMLElement, K extends keyof T>(prototype: T, method: K): () => void {
        const original = prototype[method];
        if (typeof original !== 'function') {
            return () => {};
        }
        const guarded = function (this: HTMLElement, ...args: unknown[]): unknown {
            if (!blocked || document.hasFocus()) {
                release();
                return Reflect.apply(original, this, args);
            }
            if (this.inert) {
                return Reflect.apply(original, this, args);
            }
            this.inert = true;
            try {
                return Reflect.apply(original, this, args);
            } finally {
                if (this.getAttribute('inert') === '') {
                    this.removeAttribute('inert');
                }
            }
        } as unknown as T[K];
        prototype[method] = guarded;

        return () => {
            if (prototype[method] === guarded) {
                prototype[method] = original;
            }
        };
    }

    const removeAutofocusAttribute = (element: Element): void => {
        if (!element.hasAttribute('autofocus') || element.closest('dialog, [popover]')) {
            return;
        }
        // Consume document-start autofocus once. Restoring it would resurrect flags removed by site code.
        // Dialogs and popovers have their own autofocus scope, used again when opened by the user.
        element.removeAttribute('autofocus');
    };

    const removeAutofocus = (element: Element): void => {
        removeAutofocusAttribute(element);
        element.querySelectorAll('[autofocus]').forEach(removeAutofocusAttribute);
    };

    const observer = new MutationObserver((records) => {
        if (document.hasFocus()) {
            release();
            return;
        }

        records.forEach((record) => {
            if (record.type === 'attributes') {
                removeAutofocusAttribute(record.target as Element);
            } else {
                record.addedNodes.forEach((node) => {
                    if (node instanceof Element) {
                        removeAutofocus(node);
                    }
                });
            }
        });
    });

    const releaseOnInteraction = (event: Event): void => {
        if (event.isTrusted) {
            release();
        }
    };

    function release(): void {
        if (!blocked) {
            return;
        }
        blocked = false;
        observer.disconnect();
        restoreElementFocus.forEach((restore) => restore());
        restoreSelection.forEach((restore) => restore());
        restoreNativeOpening.forEach((restore) => restore());
        if (window.focus === guardedWindowFocus) {
            window.focus = originalWindowFocus;
        }
        document.removeEventListener('pointerdown', releaseOnInteraction, true);
        document.removeEventListener('keydown', releaseOnInteraction, true);
        document.removeEventListener('focusin', releaseOnInteraction, true);
        window.removeEventListener('pagehide', release);
    }

    window.focus = guardedWindowFocus;
    observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['autofocus'] });
    removeAutofocus(document.documentElement);
    document.addEventListener('pointerdown', releaseOnInteraction, true);
    document.addEventListener('keydown', releaseOnInteraction, true);
    document.addEventListener('focusin', releaseOnInteraction, true);
    window.addEventListener('pagehide', release);

    return release;
}
