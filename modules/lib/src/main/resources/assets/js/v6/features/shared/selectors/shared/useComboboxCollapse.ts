import { useLayoutEffect, useRef, type RefObject } from 'react';

type ComboboxCollapse = {
    rootRef: RefObject<HTMLDivElement>;
    inputRef: RefObject<HTMLInputElement>;
};

// Focus falls back to the body when the element holding it is removed.
const hasLostFocus = (): boolean => {
    const active = document.activeElement;
    return active == null || active === document.body;
};

export function useComboboxCollapse(collapsed: boolean): ComboboxCollapse {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevCollapsedRef = useRef(collapsed);

    useLayoutEffect(() => {
        const wasCollapsed = prevCollapsedRef.current;
        prevCollapsedRef.current = collapsed;

        if (collapsed === wasCollapsed || !hasLostFocus()) {
            return;
        }

        if (collapsed) {
            rootRef.current?.focus();
        } else {
            inputRef.current?.focus();
        }
    }, [collapsed]);

    return { rootRef, inputRef };
}
