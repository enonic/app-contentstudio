import {
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { DAG_NODE_HEIGHT, DAG_NODE_WIDTH } from './projectDag.layout';

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 2;
export const ZOOM_STEP = 1.25;
export const MIN_READABLE_SCALE = 0.85;
const WHEEL_ZOOM_SENSITIVITY = 0.005;
const DRAG_THRESHOLD = 4;

export type ViewportPadding = {
    x: number;
    top: number;
    bottom: number;
};

// ? The bottom band keeps the graph clear of the zoom controls.
export const VIEWPORT_PADDING: ViewportPadding = { x: 24, top: 24, bottom: 68 };

export const PAN_MARGIN: ViewportPadding = {
    x: DAG_NODE_WIDTH,
    top: DAG_NODE_HEIGHT,
    bottom: DAG_NODE_HEIGHT + VIEWPORT_PADDING.bottom,
};

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

/** Fits while the graph stays legible; past that, shows the first cards at a readable scale. */
export function initialTransform(
    content: DagSize,
    container: DagSize,
    padding: ViewportPadding = VIEWPORT_PADDING,
): DagTransform {
    const fitted = fitTransform(content, container, padding);
    if (fitted.k >= MIN_READABLE_SCALE) {
        return fitted;
    }

    // ? Anchor the overflowing axes on the first card, which d3-dag lays out at the
    // ? origin, and center the axes that still fit.
    const centered = centerTransform(content, container, MIN_READABLE_SCALE, padding);
    const overflowsX = content.width * MIN_READABLE_SCALE > container.width - 2 * padding.x;
    const overflowsY = content.height * MIN_READABLE_SCALE > container.height - padding.top - padding.bottom;

    return clampTransform(
        {
            x: overflowsX ? padding.x : centered.x,
            y: overflowsY ? padding.top : centered.y,
            k: MIN_READABLE_SCALE,
        },
        content,
        container,
    );
}

/** Keeps the translation inside the pan bounds, so the graph cannot be pushed off-stage. */
export function clampTransform(
    transform: DagTransform,
    content: DagSize,
    container: DagSize,
    margin: ViewportPadding = PAN_MARGIN,
): DagTransform {
    if (container.width <= 0 || container.height <= 0) {
        return transform;
    }

    return {
        x: clampAxis(transform.x, content.width * transform.k, container.width, margin.x, margin.x),
        y: clampAxis(transform.y, content.height * transform.k, container.height, margin.top, margin.bottom),
        k: transform.k,
    };
}

// ? The bounds swap once the content outgrows the container: below that it must stay
// ? inside the margins, above it the margins cap how far each edge may travel inwards.
function clampAxis(value: number, content: number, container: number, lead: number, trail: number): number {
    const bounds = [lead, container - trail - content];

    return Math.min(Math.max(value, Math.min(...bounds)), Math.max(...bounds));
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
    // ? Which auto view a resize should reapply: the readable start or an explicit fit.
    const autoModeRef = useRef<'initial' | 'fit'>('initial');
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
        autoModeRef.current = 'fit';
        setTransform(fitTransform(content, getContainerSize()));
    }, [content, getContainerSize]);

    const reset = useCallback(() => {
        isAdjustedRef.current = true;
        setTransform(centerTransform(content, getContainerSize()));
    }, [content, getContainerSize]);

    const zoomBy = useCallback(
        (factor: number) => {
            const container = getContainerSize();
            isAdjustedRef.current = true;
            setTransform((current) =>
                clampTransform(
                    zoomAt(current, factor, { x: container.width / 2, y: container.height / 2 }),
                    contentRef.current,
                    container,
                ),
            );
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
            const container = { width: rect.width, height: rect.height };
            const current = transformRef.current;

            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                isAdjustedRef.current = true;
                const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
                const zoomed = zoomAt(current, wheelZoomFactor(event.deltaY), point);
                setTransform(clampTransform(zoomed, contentRef.current, container));
                return;
            }

            // ? Claim the wheel for panning only while the graph overflows, so an
            // ? already visible graph does not trap the statistics panel's scroll.
            const { width, height } = contentRef.current;
            const overflows = width * current.k > rect.width || height * current.k > rect.height;
            if (!overflows) return;

            event.preventDefault();
            isAdjustedRef.current = true;
            const panned = { x: current.x - event.deltaX, y: current.y - event.deltaY, k: current.k };
            setTransform(clampTransform(panned, contentRef.current, container));
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

            const panned = {
                x: pan.transform.x + deltaX,
                y: pan.transform.y + deltaY,
                k: pan.transform.k,
            };

            setTransform(clampTransform(panned, contentRef.current, getContainerSize()));
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
    }, [getContainerSize]);

    // Refit on content change and on container resize, until the user takes over.
    useEffect(() => {
        const element = viewportRef.current;
        if (!element) return;

        isAdjustedRef.current = false;
        autoModeRef.current = 'initial';
        setTransform(initialTransform(content, getContainerSize()));

        const observer = new ResizeObserver(() => {
            if (isAdjustedRef.current) return;

            const apply = autoModeRef.current === 'fit' ? fitTransform : initialTransform;
            setTransform(apply(content, getContainerSize()));
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
