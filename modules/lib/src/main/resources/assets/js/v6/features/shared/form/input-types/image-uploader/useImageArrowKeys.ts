import { useEffect, useRef } from 'react';
import { type TargetedKeyboardEvent } from 'preact';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
export const IMAGE_KEYBOARD_STEP = 1;
const REPEAT_MS = 50;

export type ImageArrowKeys = {
    keys: ReadonlySet<string>;
    shiftKey: boolean;
    move: boolean;
};

type Options = {
    enabled: boolean;
    allowMove?: boolean;
    allowResizeAll?: boolean;
    onStep: (arrows: ImageArrowKeys, multiplier: number) => void;
};

export function useImageArrowKeys({ enabled, allowMove = false, allowResizeAll = false, onStep }: Options) {
    const arrowsRef = useRef({ keys: new Set<string>(), shiftKey: false, move: false });
    const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const holdStartRef = useRef(0);
    const onStepRef = useRef(onStep);
    onStepRef.current = (arrows, multiplier) => {
        if (enabled) {
            onStep(arrows, multiplier);
        }
    };

    const step = (): void => {
        const heldMs = performance.now() - holdStartRef.current;
        const multiplier = heldMs < 400 ? 1 : heldMs < 800 ? 2 : heldMs < 1600 ? 4 : 8;
        onStepRef.current(arrowsRef.current, multiplier);
    };

    const stop = (): void => {
        arrowsRef.current.keys.clear();
        if (repeatRef.current !== null) {
            clearInterval(repeatRef.current);
            repeatRef.current = null;
        }
    };

    useEffect(() => {
        if (!enabled) {
            return;
        }

        window.addEventListener('blur', stop);
        document.addEventListener('visibilitychange', stop);

        return () => {
            stop();
            window.removeEventListener('blur', stop);
            document.removeEventListener('visibilitychange', stop);
        };
    }, [enabled]);

    const onKeyDown = (event: TargetedKeyboardEvent<SVGSVGElement>): void => {
        if (!enabled || event.defaultPrevented) {
            return;
        }
        if (event.metaKey || (event.altKey && event.ctrlKey) || (!allowMove && (event.ctrlKey || event.altKey))) {
            stop();
            return;
        }

        const arrows = arrowsRef.current;
        const isArrow = ARROW_KEYS.has(event.key);
        const isResizeAll = allowResizeAll && event.key === ' ';
        if (isArrow || isResizeAll) {
            event.preventDefault();
            event.stopPropagation();
            // Our timer handles repeats; they must not overwrite a later modifier change.
            if (arrows.keys.has(event.key)) {
                return;
            }
        }

        arrows.shiftKey = event.shiftKey;
        arrows.move = allowMove && (event.altKey || event.ctrlKey);
        if (!isArrow && !isResizeAll) {
            return;
        }

        arrows.keys.add(event.key);
        if (repeatRef.current === null) {
            holdStartRef.current = performance.now();
        }
        step();
        if (repeatRef.current === null) {
            repeatRef.current = setInterval(step, REPEAT_MS);
        }
    };

    const onKeyUp = (event: TargetedKeyboardEvent<SVGSVGElement>): void => {
        const arrows = arrowsRef.current;
        arrows.shiftKey = event.shiftKey;
        arrows.move = allowMove && (event.altKey || event.ctrlKey);

        if (event.key === 'Meta') {
            stop();
            return;
        }
        if (!arrows.keys.delete(event.key)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (arrows.keys.size === 0) {
            stop();
        }
    };

    return { onKeyDown, onKeyUp, onBlur: stop, stop };
}
