type CustomEventDetail<T> = {
    detail: T;
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
};

type EventDescriptor<T> = {
    readonly name: string;
    dispatch(detail: T, options?: Partial<CustomEventDetail<T>>): boolean;
    listen(handler: (detail: T) => void, options?: AddEventListenerOptions): () => void;
};

/**
 * Creates a typed event descriptor with built-in dispatch and listen methods.
 * This eliminates magic strings and provides type-safe event handling.
 */
export function defineEvent<T>(eventName: string): EventDescriptor<T> {
    return {
        name: eventName,

        dispatch(detail: T, options?: Partial<CustomEventDetail<T>>): boolean {
            return dispatchCustomEvent(eventName, {
                detail,
                bubbles: options?.bubbles ?? true,
                cancelable: options?.cancelable ?? true,
                composed: options?.composed ?? false,
            });
        },

        listen(handler: (detail: T) => void, options?: AddEventListenerOptions): () => void {
            return listen<T>(eventName, (event) => handler(event.detail), options);
        },
    };
}

// *
// * Utilities
// *
function createCustomEvent<T>(name: string, config: CustomEventDetail<T>): CustomEvent<T> {
    const {detail, bubbles = true, cancelable = true, composed = false} = config;

    return new CustomEvent<T>(name, {
        detail,
        bubbles,
        cancelable,
        composed,
    });
}

function dispatchCustomEvent<T>(name: string, config: CustomEventDetail<T>): boolean {
    const event = createCustomEvent(name, config);
    return window.dispatchEvent(event);
}

function listen<T>(
    name: string,
    handler: (event: CustomEvent<T>) => void,
    options?: AddEventListenerOptions
): () => void {
    const listener = (event: Event) => {
        handler(event as CustomEvent<T>);
    };

    window.addEventListener(name, listener, options);

    return () => {
        window.removeEventListener(name, listener, options);
    };
}
