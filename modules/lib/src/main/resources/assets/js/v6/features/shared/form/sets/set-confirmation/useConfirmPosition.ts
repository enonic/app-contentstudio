import {useLayoutEffect, useState, type MutableRefObject} from 'react';

type Position = {top: number; left: number; width: number};

type UseConfirmPositionParams<A extends HTMLElement, C extends HTMLElement> = {
    enabled: boolean;
    anchorRef: MutableRefObject<A | null>;
    confirmationRef: MutableRefObject<C | null>;
};

/**
 * Fixed-position coordinates for a confirmation bar anchored above an element.
 * Exists because the shared floating-position utility only supports start/end
 * alignment, whereas the confirmation bar must center over the anchor and
 * track it on resize/scroll.
 */
export function useConfirmPosition<A extends HTMLElement, C extends HTMLElement>({
    enabled,
    anchorRef,
    confirmationRef,
}: UseConfirmPositionParams<A, C>): Position | null {
    const [position, setPosition] = useState<Position | null>(null);

    useLayoutEffect(() => {
        if (!enabled) {
            setPosition(null);
            return;
        }
        const update = (): void => {
            const anchor = anchorRef.current?.getBoundingClientRect();
            const confirmation = confirmationRef.current?.getBoundingClientRect();
            if (!anchor) return;
            const barHeight = confirmation?.height ?? 0;
            setPosition({
                top: anchor.top - barHeight - 20,
                left: anchor.left,
                width: anchor.width,
            });
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);

        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [enabled]);

    return position;
}
