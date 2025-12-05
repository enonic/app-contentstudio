import type {RefObject} from 'react';
import {useEffect} from 'react';

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T> | RefObject<T>[],
    handler: (event: MouseEvent | TouchEvent | FocusEvent) => void,
    eventType: 'mousedown' | 'touchend' | 'pointerdown' = 'pointerdown'
): void {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent | PointerEvent) => {
            const target = event.target as Node;

            if (!target || !target.isConnected) {
                return;
            }

            const isOutside = Array.isArray(ref)
                ? ref.filter((r) => Boolean(r.current)).every((r) => r.current && !r.current.contains(target))
                : ref.current && !ref.current.contains(target);

            if (isOutside) {
                handler(event);
            }
        };

        document.addEventListener(eventType, listener);

        return () => {
            document.removeEventListener(eventType, listener);
        };
    }, [ref, handler, eventType]);
}
