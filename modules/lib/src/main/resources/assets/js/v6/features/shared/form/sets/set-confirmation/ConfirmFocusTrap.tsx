import { FocusTrap } from 'focus-trap-react';
import { FocusContainerContext, type FocusContainerRegistry, useFocusContainerRegistry } from '@enonic/ui';
import {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
} from 'react';

type ConfirmFocusTrapProps = {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
};

/**
 * A registry that answers to the enclosing one as well as its own: what the
 * confirmation's popup registers with has to reach the dialog around the form,
 * or the dialog reads a click in that popup as one outside itself and closes.
 */
export function chainFocusContainerRegistry(
    parent: FocusContainerRegistry | null,
    own: FocusContainerRegistry,
): FocusContainerRegistry {
    if (parent === null) return own;
    return {
        register: (element) => {
            parent.register(element);
            own.register(element);
        },
        unregister: (element) => {
            parent.unregister(element);
            own.unregister(element);
        },
    };
}

/**
 * A focus trap around a confirmation's portal, with `@enonic/ui`'s focus
 * container so a popup it opens in another portal stays reachable by Tab — as
 * `Dialog.Content` does it. Both the trap and that popup also register with the
 * enclosing container, so a dialog around the form keeps them as its own.
 */
export const ConfirmFocusTrap = forwardRef<HTMLDivElement, ConfirmFocusTrapProps>(
    ({ className, style, children }, ref): ReactElement => {
        const [container, setContainer] = useState<HTMLDivElement | null>(null);
        // The trap copies its options once, while the container is still null; they read this instead.
        const containerRef = useRef<HTMLDivElement | null>(null);
        const [portalContainers, setPortalContainers] = useState<HTMLElement[]>([]);

        const setRefs = useCallback(
            (node: HTMLDivElement | null) => {
                containerRef.current = node;
                setContainer(node);
                if (typeof ref === 'function') ref(node);
                else if (ref != null) ref.current = node;
            },
            [ref],
        );

        const parentRegistry = useFocusContainerRegistry();
        const registry = useMemo(
            () =>
                chainFocusContainerRegistry(parentRegistry, {
                    register: (el: HTMLElement) =>
                        setPortalContainers((prev) => (prev.includes(el) ? prev : [...prev, el])),
                    unregister: (el: HTMLElement) => setPortalContainers((prev) => prev.filter((e) => e !== el)),
                }),
            [parentRegistry],
        );

        useEffect(() => {
            if (container === null || parentRegistry === null) return undefined;
            parentRegistry.register(container);
            return () => parentRegistry.unregister(container);
        }, [container, parentRegistry]);

        const containerElements = useMemo(() => {
            const arr: HTMLElement[] = [];
            if (container) arr.push(container);
            arr.push(...portalContainers);
            return arr.length > 0 ? arr : undefined;
        }, [container, portalContainers]);

        return (
            <FocusContainerContext.Provider value={registry}>
                <FocusTrap
                    active={container != null}
                    containerElements={containerElements}
                    focusTrapOptions={{
                        initialFocus: () => containerRef.current ?? false,
                        fallbackFocus: () => containerRef.current ?? document.body,
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
    },
);

ConfirmFocusTrap.displayName = 'ConfirmFocusTrap';
