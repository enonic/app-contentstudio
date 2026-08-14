import {
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2;
export const ZOOM_STEP = 1.25;
const WHEEL_ZOOM_SENSITIVITY = 0.005;
// ? Pointer travel above this counts as a drag, so the closing click is not a node click.
const DRAG_THRESHOLD = 4;

export type ViewportPadding = {
    x: number;
    top: number;
    bottom: number;
};

// ? The bottom band keeps the graph clear of the zoom controls.
export const VIEWPORT_PADDING: ViewportPadding = { x: 24, top: 24, bottom: 68 };

export type DagSize = {
    width: number;
    height: number;
};

export type DagTransform = {
    x: number;
    y: number;
    k: number;
};

export type DagViewport = {
    viewportRef: RefObject<HTMLDivElement>;
    transform: DagTransform;
    isPanning: boolean;
    canZoomIn: boolean;
    canZoomOut: boolean;
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
    fitToView: () => void;
    startPan: (event: ReactPointerEvent<HTMLDivElement>) => void;
    handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
    wasDragged: () => boolean;
};

const IDENTITY: DagTransform = { x: 0, y: 0, k: 1 };

export function clampScale(scale: number): number {
    return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

/** Centers the content in the padded container, scaled down only as far as needed. */
export function fitTransform(
    content: DagSize,
    container: DagSize,
    padding: ViewportPadding = VIEWPORT_PADDING,
): DagTransform {
    if (content.width <= 0 || content.height <= 0 || container.width <= 0 || container.height <= 0) {
        return IDENTITY;
    }

    const usableWidth = Math.max(container.width - 2 * padding.x, 1);
    const usableHeight = Math.max(container.height - padding.top - padding.bottom, 1);
    const k = clampScale(Math.min(usableWidth / content.width, usableHeight / content.height, 1));

    return centerTransform(content, container, k, padding);
}

/** Centers the content inside the padded container at the given scale. */
export function centerTransform(
    content: DagSize,
    container: DagSize,
    k: number = 1,
    padding: ViewportPadding = VIEWPORT_PADDING,
): DagTransform {
    const usableHeight = Math.max(container.height - padding.top - padding.bottom, 1);

    return {
        x: (container.width - content.width * k) / 2,
        y: padding.top + (usableHeight - content.height * k) / 2,
        k,
    };
}

/** Exponential zoom factor for a wheel delta, so every notch scales by the same ratio. */
export function wheelZoomFactor(deltaY: number): number {
    return Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);
}

/** Scales around a point in container coordinates so it stays put on screen. */
export function zoomAt(transform: DagTransform, factor: number, point: { x: number; y: number }): DagTransform {
    const k = clampScale(transform.k * factor);
    const ratio = k / transform.k;

    return {
        x: point.x - (point.x - transform.x) * ratio,
        y: point.y - (point.y - transform.y) * ratio,
        k,
    };
}

export function useDagViewport(content: DagSize): DagViewport {
    const viewportRef = useRef<HTMLDivElement>(null);
    const panRef = useRef<{ pointerId: number; startX: number; startY: number; transform: DagTransform } | null>(null);
    // ? While untouched the viewport keeps refitting on resize; any manual zoom/pan stops that.
    const isAdjustedRef = useRef(false);
    const transformRef = useRef<DagTransform>(IDENTITY);
    const contentRef = useRef<DagSize>(content);
    const draggedRef = useRef(false);

    const [transform, setTransform] = useState<DagTransform>(IDENTITY);
    const [isPanning, setIsPanning] = useState(false);

    transformRef.current = transform;
    contentRef.current = content;

    const getContainerSize = useCallback((): DagSize => {
        const element = viewportRef.current;
        return { width: element?.clientWidth ?? 0, height: element?.clientHeight ?? 0 };
    }, []);

    const fitToView = useCallback(() => {
        isAdjustedRef.current = false;
        setTransform(fitTransform(content, getContainerSize()));
    }, [content, getContainerSize]);

    const reset = useCallback(() => {
        isAdjustedRef.current = true;
        setTransform(centerTransform(content, getContainerSize()));
    }, [content, getContainerSize]);

    const zoomBy = useCallback(
        (factor: number) => {
            const { width, height } = getContainerSize();
            isAdjustedRef.current = true;
            setTransform((current) => zoomAt(current, factor, { x: width / 2, y: height / 2 }));
        },
        [getContainerSize],
    );

    const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
    const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]);

    const startPan = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return;

        panRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            transform: transformRef.current,
        };
        draggedRef.current = false;
        isAdjustedRef.current = true;
        setIsPanning(true);
    }, []);

    const wasDragged = useCallback((): boolean => draggedRef.current, []);

    const handleKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLDivElement>): void => {
            switch (event.key) {
                case '+':
                case '=':
                    zoomIn();
                    break;
                case '-':
                case '_':
                    zoomOut();
                    break;
                case '0':
                    if (!event.ctrlKey && !event.metaKey) return;
                    reset();
                    break;
                case 'f':
                case 'F':
                    fitToView();
                    break;
                default:
                    return;
            }

            event.preventDefault();
        },
        [zoomIn, zoomOut, reset, fitToView],
    );

    // ! React registers wheel passively on the root, so preventDefault only works natively.
    useEffect(() => {
        const element = viewportRef.current;
        if (!element) return;

        const handleWheel = (event: WheelEvent): void => {
            const rect = element.getBoundingClientRect();
            const current = transformRef.current;
            isAdjustedRef.current = true;

            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
                setTransform(zoomAt(current, wheelZoomFactor(event.deltaY), point));
                return;
            }

            // ? Claim the wheel for panning only while the graph overflows, so an
            // ? already visible graph does not trap the statistics panel's scroll.
            const { width, height } = contentRef.current;
            const overflows = width * current.k > rect.width || height * current.k > rect.height;
            if (!overflows) return;

            event.preventDefault();
            setTransform({ x: current.x - event.deltaX, y: current.y - event.deltaY, k: current.k });
        };

        element.addEventListener('wheel', handleWheel, { passive: false });

        return () => element.removeEventListener('wheel', handleWheel);
    }, []);

    // ! Listen on window, not via setPointerCapture: capture retargets pointerup and
    // ! its compat click to the pan layer, which would swallow clicks on the cards.
    useEffect(() => {
        const handleMove = (event: PointerEvent): void => {
            const pan = panRef.current;
            if (!pan || pan.pointerId !== event.pointerId) return;

            const deltaX = event.clientX - pan.startX;
            const deltaY = event.clientY - pan.startY;

            if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
                draggedRef.current = true;
            }

            setTransform({
                x: pan.transform.x + deltaX,
                y: pan.transform.y + deltaY,
                k: pan.transform.k,
            });
        };

        const handleEnd = (event: PointerEvent): void => {
            if (panRef.current?.pointerId !== event.pointerId) return;
            panRef.current = null;
            setIsPanning(false);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleEnd);
        window.addEventListener('pointercancel', handleEnd);

        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleEnd);
            window.removeEventListener('pointercancel', handleEnd);
        };
    }, []);

    // Refit on content change and on container resize, until the user takes over.
    useEffect(() => {
        const element = viewportRef.current;
        if (!element) return;

        isAdjustedRef.current = false;
        setTransform(fitTransform(content, getContainerSize()));

        const observer = new ResizeObserver(() => {
            if (isAdjustedRef.current) return;
            setTransform(fitTransform(content, getContainerSize()));
        });
        observer.observe(element);

        return () => observer.disconnect();
    }, [content, getContainerSize]);

    return {
        viewportRef,
        transform,
        isPanning,
        canZoomIn: transform.k < MAX_SCALE,
        canZoomOut: transform.k > MIN_SCALE,
        zoomIn,
        zoomOut,
        reset,
        fitToView,
        startPan,
        handleKeyDown,
        wasDragged,
    };
}
