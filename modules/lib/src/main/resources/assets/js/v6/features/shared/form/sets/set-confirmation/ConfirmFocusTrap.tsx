import {FocusTrap} from 'focus-trap-react';
import {FocusContainerContext} from '@enonic/ui';
import {forwardRef, useCallback, useMemo, useState, type CSSProperties, type ReactElement, type ReactNode} from 'react';

type ConfirmFocusTrapProps = {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
};

/**
 * Wraps confirmation portal content in a focus trap and exposes a
 * `FocusContainerContext` so portaled `@enonic/ui` popups (e.g. Combobox.Popup)
 * register themselves and stay reachable by Tab. Mirrors the Dialog.Content
 * pattern in npm-enonic-ui.
 */
export const ConfirmFocusTrap = forwardRef<HTMLDivElement, ConfirmFocusTrapProps>(
    ({className, style, children}, ref): ReactElement => {
        const [container, setContainer] = useState<HTMLDivElement | null>(null);
        const [portalContainers, setPortalContainers] = useState<HTMLElement[]>([]);

        const setRefs = useCallback(
            (node: HTMLDivElement | null) => {
                setContainer(node);
                if (typeof ref === 'function') ref(node);
                else if (ref != null) ref.current = node;
            },
            [ref]
        );

        const focusContainerRegistry = useMemo(
            () => ({
                register: (el: HTMLElement) =>
                    setPortalContainers((prev) => (prev.includes(el) ? prev : [...prev, el])),
                unregister: (el: HTMLElement) => setPortalContainers((prev) => prev.filter((e) => e !== el)),
            }),
            []
        );

        const containerElements = useMemo(() => {
            const arr: HTMLElement[] = [];
            if (container) arr.push(container);
            arr.push(...portalContainers);
            return arr.length > 0 ? arr : undefined;
        }, [container, portalContainers]);

        return (
            <FocusContainerContext.Provider value={focusContainerRegistry}>
                <FocusTrap
                    active={container != null}
                    containerElements={containerElements}
                    focusTrapOptions={{
                        initialFocus: () => container ?? false,
                        fallbackFocus: () => container ?? document.body,
                        escapeDeactivates: false,
                        clickOutsideDeactivates: false,
                        allowOutsideClick: true,
                        returnFocusOnDeactivate: true,
                        preventScroll: false,
                    }}
                >
                    <div ref={setRefs} tabIndex={-1} className={className} style={style}>
                        {children}
                    </div>
                </FocusTrap>
            </FocusContainerContext.Provider>
        );
    }
);

ConfirmFocusTrap.displayName = 'ConfirmFocusTrap';
