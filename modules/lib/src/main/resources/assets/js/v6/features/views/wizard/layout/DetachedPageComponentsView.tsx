import {cn, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {createPortal, type CSSProperties, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$app, setPageComponentsViewCollapsed} from '../../../store/app.store';
import {$hasPage, $isContentFormExpanded} from '../../../store/wizardContent.store';
import {PageComponentsView} from '../content-wizard-tabs/page-components/PageComponentsView';

const DETACHED_PAGE_COMPONENTS_VIEW_NAME = 'DetachedPageComponentsView';

const DEFAULT_TOP = 96;
const DEFAULT_LEFT = 24;

type Position = {top: number; left: number};

const clampPosition = (next: Position, panel: HTMLElement | null): Position => {
    if (typeof window === 'undefined' || panel == null) return next;
    const {innerWidth, innerHeight} = window;
    const rect = panel.getBoundingClientRect();
    const top = Math.max(0, Math.min(next.top, innerHeight - rect.height));
    const left = Math.max(0, Math.min(next.left, innerWidth - rect.width));
    return {top, left};
};

export const DetachedPageComponentsView = (): ReactElement | null => {
    const isExpanded = useStore($isContentFormExpanded);
    const hasPage = useStore($hasPage);
    const {pageComponentsViewCollapsed: collapsed} = useStore($app, {keys: ['pageComponentsViewCollapsed']});
    const showLabel = useI18n('field.showComponent');
    const hideLabel = useI18n('field.hideComponent');
    const componentsLabel = useI18n('field.components');

    const panelRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<{pointerId: number; offsetX: number; offsetY: number} | null>(null);

    const [position, setPosition] = useState<Position>({top: DEFAULT_TOP, left: DEFAULT_LEFT});

    const isVisible = !isExpanded && hasPage;

    useEffect(() => {
        if (!isVisible || collapsed) return;
        setPosition((prev) => clampPosition(prev, panelRef.current));
    }, [isVisible, collapsed]);

    useEffect(() => {
        if (!isVisible || collapsed) return;
        const handleResize = (): void => {
            setPosition((prev) => clampPosition(prev, panelRef.current));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isVisible, collapsed]);

    const toggleCollapsed = useCallback((): void => {
        setPageComponentsViewCollapsed(!$app.get().pageComponentsViewCollapsed);
    }, []);

    const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return;
        // ? Skip drag start when the press lands on an interactive child (e.g. close button),
        // ? otherwise pointer capture on the header swallows the click.
        const target = event.target;
        const isInteractive = target instanceof Element && target.closest('button, [role="button"]') != null;
        if (isInteractive) return;
        const panel = panelRef.current;
        if (panel == null) return;
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
        if (drag == null || drag.pointerId !== event.pointerId) return;
        setPosition(clampPosition(
            {top: event.clientY - drag.offsetY, left: event.clientX - drag.offsetX},
            panelRef.current,
        ));
    }, []);

    const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
        const drag = dragStateRef.current;
        if (drag == null || drag.pointerId !== event.pointerId) return;
        dragStateRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }, []);

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
                    icon={ChevronRight}
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

    const panelStyle: CSSProperties = {
        top: position.top,
        left: position.left,
        maxHeight: `calc(100vh - ${position.top}px)`,
    };

    return createPortal(
        <div
            ref={panelRef}
            data-component={DETACHED_PAGE_COMPONENTS_VIEW_NAME}
            className={cn(
                'fixed z-40 flex w-100 max-w-[calc(100vw-1rem)] flex-col rounded-sm border border-bdr-subtle bg-surface-neutral shadow-lg outline-none',
                'overflow-hidden',
            )}
            style={panelStyle}
        >
            <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="flex cursor-move items-center gap-2 px-3 py-2 select-none touch-none"
            >
                <h3 className="flex-1 text-base font-semibold">{componentsLabel}</h3>
                <IconButton
                    icon={ChevronLeft}
                    iconSize="md"
                    size="sm"
                    shape="round"
                    variant="text"
                    aria-label={hideLabel}
                    onClick={toggleCollapsed}
                />
            </div>
            <div className="overflow-auto px-3 pb-2">
                <PageComponentsView />
            </div>
        </div>,
        document.body,
    );
};

DetachedPageComponentsView.displayName = DETACHED_PAGE_COMPONENTS_VIEW_NAME;
