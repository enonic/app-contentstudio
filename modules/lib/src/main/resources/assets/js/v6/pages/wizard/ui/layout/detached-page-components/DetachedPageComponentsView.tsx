import { cn, IconButton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Network, X } from 'lucide-react';
import {
    createPortal,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactElement,
} from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { $app, setPageComponentsViewCollapsed } from '../../../../../shared/app-state/app.store';
import { $hasPage, $isContentFormExpanded } from '../../../model/wizardContent.store';
import { PageComponentsView } from '../../content-wizard-tabs/page-components/PageComponentsView';
import { DetachedPanelResizeHandle } from './DetachedPanelResizeHandle';
import {
    clampPanelPosition,
    getPanelHeightRange,
    getViewportBounds,
    MIN_DETACHED_PANEL_HEIGHT,
    resizePanelToHeight,
    type PanelLayout,
    type VerticalResizeEdge,
    type VerticalResizeSnapshot,
    type ViewportBounds,
} from './detachedPanelResize';

const DETACHED_PAGE_COMPONENTS_VIEW_NAME = 'DetachedPageComponentsView';
const DETACHED_PAGE_COMPONENTS_PANEL_ID = 'detached-page-components-panel';

const DEFAULT_TOP = 96;
const DEFAULT_LEFT = 24;
const KEYBOARD_RESIZE_STEP = 16;
const RESIZE_EDGES: VerticalResizeEdge[] = ['top', 'bottom'];

export const DetachedPageComponentsView = (): ReactElement | null => {
    const isExpanded = useStore($isContentFormExpanded);
    const hasPage = useStore($hasPage);
    const { pageComponentsViewCollapsed: collapsed } = useStore($app, { keys: ['pageComponentsViewCollapsed'] });
    const showLabel = useI18n('field.showComponent');
    const hideLabel = useI18n('field.hideComponent');
    const componentsLabel = useI18n('field.components');
    const resizeTopLabel = useI18n('wcag.pageComponents.resizeTop');
    const resizeBottomLabel = useI18n('wcag.pageComponents.resizeBottom');

    const panelRef = useRef<HTMLDivElement>(null);
    const panelHeaderRef = useRef<HTMLDivElement>(null);
    const panelFitContentRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);

    const [layout, setLayout] = useState<PanelLayout>({ top: DEFAULT_TOP, left: DEFAULT_LEFT });
    const [fitHeight, setFitHeight] = useState<number>();
    const [viewportBounds, setViewportBounds] = useState<ViewportBounds>(() => getViewportBounds());

    const isVisible = !isExpanded && hasPage;

    const measureFitHeight = useCallback((): number | undefined => {
        const panel = panelRef.current;
        const header = panelHeaderRef.current;
        const content = panelFitContentRef.current;
        if (panel == null || header == null || content == null) {
            return undefined;
        }

        const borderHeight = panel.offsetHeight - panel.clientHeight;
        return Math.ceil(header.offsetHeight + content.offsetHeight + borderHeight);
    }, []);

    useEffect(() => {
        if (!isVisible || collapsed) {
            return;
        }
        const panel = panelRef.current;
        const header = panelHeaderRef.current;
        const content = panelFitContentRef.current;
        if (panel == null || header == null || content == null) {
            return;
        }

        let resizeFrame = 0;
        const syncToViewport = (): void => {
            const nextViewport = getViewportBounds();
            setViewportBounds((current) =>
                current.top === nextViewport.top &&
                current.right === nextViewport.right &&
                current.bottom === nextViewport.bottom &&
                current.left === nextViewport.left
                    ? current
                    : nextViewport,
            );
            setLayout((current) => {
                const position = clampPanelPosition(current, panel.getBoundingClientRect(), nextViewport);
                return position.top === current.top && position.left === current.left
                    ? current
                    : { ...current, ...position };
            });
        };
        const scheduleSync = (): void => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(syncToViewport);
        };
        const syncFitHeight = (): void => {
            const nextFitHeight = measureFitHeight();
            if (nextFitHeight == null) {
                return;
            }
            setFitHeight(nextFitHeight);
        };

        const observer = new ResizeObserver(syncFitHeight);
        observer.observe(header);
        observer.observe(content);
        const visualViewport = window.visualViewport;
        window.addEventListener('resize', scheduleSync);
        visualViewport?.addEventListener('resize', scheduleSync);
        visualViewport?.addEventListener('scroll', scheduleSync);
        syncToViewport();
        syncFitHeight();

        return () => {
            observer.disconnect();
            cancelAnimationFrame(resizeFrame);
            window.removeEventListener('resize', scheduleSync);
            visualViewport?.removeEventListener('resize', scheduleSync);
            visualViewport?.removeEventListener('scroll', scheduleSync);
        };
    }, [isVisible, collapsed, measureFitHeight]);

    const toggleCollapsed = useCallback((): void => {
        setPageComponentsViewCollapsed(!$app.get().pageComponentsViewCollapsed);
    }, []);

    const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) {
            return;
        }
        // ? Skip drag start when the press lands on an interactive child (e.g. close button),
        // ? otherwise pointer capture on the header swallows the click.
        const target = event.target;
        const isInteractive = target instanceof Element && target.closest('button, [role="button"]') != null;
        if (isInteractive) {
            return;
        }
        const panel = panelRef.current;
        if (panel == null) {
            return;
        }
        const rect = panel.getBoundingClientRect();
        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    }, []);

    const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        const drag = dragStateRef.current;
        if (drag == null || drag.pointerId !== event.pointerId) {
            return;
        }
        const panel = panelRef.current;
        if (panel == null) {
            return;
        }
        const rect = panel.getBoundingClientRect();
        const position = clampPanelPosition(
            { top: event.clientY - drag.offsetY, left: event.clientX - drag.offsetX },
            rect,
            getViewportBounds(),
        );
        setLayout((current) => ({ ...current, ...position }));
    }, []);

    const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        const drag = dragStateRef.current;
        if (drag == null || drag.pointerId !== event.pointerId) {
            return;
        }
        dragStateRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

    const applyResize = useCallback(
        (
            snapshot: VerticalResizeSnapshot,
            desiredHeight: number,
            maximumHeight?: number,
            viewport: ViewportBounds = getViewportBounds(),
        ): void => {
            setLayout((current) => ({
                ...current,
                ...resizePanelToHeight(snapshot, desiredHeight, viewport, maximumHeight),
            }));
        },
        [],
    );

    const handleResizePointerDown = useCallback(
        (edge: VerticalResizeEdge, event: ReactPointerEvent<HTMLDivElement>): void => {
            if (event.button !== 0 || !event.isPrimary) {
                return;
            }
            const panel = panelRef.current;
            if (panel == null) {
                return;
            }

            const handle = event.currentTarget;
            const pointerId = event.pointerId;
            const startPointerY = event.clientY;
            const rect = panel.getBoundingClientRect();
            const snapshot: VerticalResizeSnapshot = { edge, startHeight: rect.height, startTop: rect.top };
            const maximumHeight = measureFitHeight();

            const move = (moveEvent: PointerEvent): void => {
                if (moveEvent.pointerId !== pointerId) {
                    return;
                }
                const delta = moveEvent.clientY - startPointerY;
                applyResize(snapshot, rect.height + (edge === 'top' ? -delta : delta), maximumHeight);
                moveEvent.preventDefault();
            };
            const stop = (stopEvent: PointerEvent): void => {
                if (stopEvent.pointerId !== pointerId) {
                    return;
                }
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', stop);
                handle.removeEventListener('pointercancel', stop);
                handle.removeEventListener('lostpointercapture', stop);
            };

            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', stop);
            handle.addEventListener('pointercancel', stop);
            handle.addEventListener('lostpointercapture', stop);
            handle.setPointerCapture(pointerId);
            event.preventDefault();
        },
        [applyResize, measureFitHeight],
    );

    const handleResizeKeyDown = useCallback(
        (edge: VerticalResizeEdge, event: ReactKeyboardEvent<HTMLDivElement>): void => {
            if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                return;
            }
            const panel = panelRef.current;
            if (panel == null) {
                return;
            }
            const rect = panel.getBoundingClientRect();
            const snapshot: VerticalResizeSnapshot = {
                edge,
                startHeight: rect.height,
                startTop: rect.top,
            };
            const maximumHeight = measureFitHeight();
            const viewport = getViewportBounds();
            const range = getPanelHeightRange(snapshot, viewport, maximumHeight);
            let desiredHeight: number;

            if (event.key === 'Home') {
                desiredHeight = range.min;
            } else if (event.key === 'End') {
                desiredHeight = range.max;
            } else {
                const movingOutward =
                    (edge === 'top' && event.key === 'ArrowUp') || (edge === 'bottom' && event.key === 'ArrowDown');
                desiredHeight = rect.height + (movingOutward ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP);
            }

            applyResize(snapshot, desiredHeight, maximumHeight, viewport);
            event.preventDefault();
            event.stopPropagation();
        },
        [applyResize, measureFitHeight],
    );

    if (!isVisible) {
        return null;
    }

    if (collapsed) {
        return createPortal(
            <div
                data-component={DETACHED_PAGE_COMPONENTS_VIEW_NAME}
                data-collapsed="true"
                className="fixed bottom-3 left-2 z-40"
            >
                <IconButton
                    icon={Network}
                    iconSize="md"
                    size="sm"
                    shape="round"
                    variant="filled"
                    aria-label={showLabel}
                    onClick={toggleCollapsed}
                />
            </div>,
            document.body,
        );
    }

    const viewportHeight = Math.max(0, viewportBounds.bottom - layout.top);
    const maxHeight = Math.min(viewportHeight, fitHeight ?? Number.POSITIVE_INFINITY);
    const autoHeight = Math.min(fitHeight ?? MIN_DETACHED_PANEL_HEIGHT, maxHeight);
    const currentHeight = Math.min(layout.height ?? autoHeight, maxHeight);
    const panelStyle: CSSProperties = {
        top: layout.top,
        left: layout.left,
        height: layout.height,
        maxHeight,
    };

    return createPortal(
        <div
            ref={panelRef}
            data-component={DETACHED_PAGE_COMPONENTS_VIEW_NAME}
            id={DETACHED_PAGE_COMPONENTS_PANEL_ID}
            className={cn(
                'fixed z-40 flex w-100 max-w-[calc(100vw-1rem)] flex-col rounded-sm border border-bdr-subtle bg-surface-neutral shadow-lg outline-none',
            )}
            style={panelStyle}
        >
            {RESIZE_EDGES.map((edge) => (
                <DetachedPanelResizeHandle
                    key={edge}
                    controls={DETACHED_PAGE_COMPONENTS_PANEL_ID}
                    edge={edge}
                    label={edge === 'top' ? resizeTopLabel : resizeBottomLabel}
                    maximumHeight={fitHeight}
                    onKeyDown={handleResizeKeyDown}
                    onPointerDown={handleResizePointerDown}
                    snapshot={{ edge, startHeight: currentHeight, startTop: layout.top }}
                    viewport={viewportBounds}
                />
            ))}
            <div
                ref={panelHeaderRef}
                data-resize-region="header"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="flex shrink-0 cursor-move items-center gap-2 px-3 py-2 select-none touch-none pointer-coarse:py-3"
            >
                <h3 className="flex-1 text-base font-semibold">{componentsLabel}</h3>
                <IconButton
                    icon={X}
                    iconSize="md"
                    size="sm"
                    shape="round"
                    variant="filled"
                    aria-label={hideLabel}
                    className="relative z-20"
                    onClick={toggleCollapsed}
                />
            </div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-y-contain">
                <div ref={panelFitContentRef} data-resize-region="content" className="px-3 pb-2 pointer-coarse:pb-4">
                    <PageComponentsView />
                </div>
            </div>
        </div>,
        document.body,
    );
};

DetachedPageComponentsView.displayName = DETACHED_PAGE_COMPONENTS_VIEW_NAME;
