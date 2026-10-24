import { useEffect, useRef, type RefObject } from 'react';
import { useOnceWhen } from './useOnce';

type FocusTarget = RefObject<HTMLElement | null>;

const focusFirstAvailable = (targets: readonly FocusTarget[], options?: FocusOptions): HTMLElement | null => {
    for (const { current: target } of targets) {
        if (
            !target?.isConnected ||
            target.matches(':disabled') ||
            target.closest('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]')
        ) {
            continue;
        }
        target.focus(options);
        if (target.matches(':focus')) return target;
    }
    return null;
};

/** Focuses the first available target on open and optionally once when ready. */
export const useDialogInitialFocus = (
    targetRef: FocusTarget | readonly FocusTarget[],
    ready = false,
    options?: FocusOptions,
): ((event: Event) => void) => {
    const targets = 'current' in targetRef ? [targetRef] : targetRef;
    const pendingOrigin = useRef<Element | null>(null);
    const placedFocus = useRef<Element | null>(null);

    useOnceWhen(() => {
        pendingOrigin.current = null;
        // The user may be typing elsewhere in the dialog by the time it becomes ready.
        if (placedFocus.current && !placedFocus.current.matches(':focus')) return;
        focusFirstAvailable(targets, options);
    }, ready);

    // Conditional fallback controls can mount after loading without making the primary action ready.
    useEffect(() => {
        const origin = pendingOrigin.current;
        if (!origin) return;
        if (!origin.matches(':focus')) {
            pendingOrigin.current = null;
            return;
        }
        const focused = focusFirstAvailable(targets, options);
        if (focused) {
            pendingOrigin.current = null;
            placedFocus.current = focused;
        }
    });

    return (event: Event): void => {
        const ownerDocument = targets.find((ref) => ref.current)?.current?.ownerDocument ?? document;
        let origin = ownerDocument.activeElement;
        while (origin?.shadowRoot?.activeElement) origin = origin.shadowRoot.activeElement;

        pendingOrigin.current = null;
        const focused = focusFirstAvailable(targets, options);
        placedFocus.current = focused ?? origin;
        if (focused) {
            event.preventDefault();
        } else if (targets.length > 1) {
            pendingOrigin.current = origin;
        }
    };
};
