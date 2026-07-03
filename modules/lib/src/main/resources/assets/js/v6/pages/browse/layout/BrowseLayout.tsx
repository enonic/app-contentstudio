import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { $isContextOpen } from '../../../widgets/context-panel/model/contextWidgets.store';
import {
    $contextPanelMode,
    setContextLayoutMetrics,
} from '../../../widgets/context-panel/model/contextPanelMode.store';
import { LayoutTokens } from '../../../shared/ui/layout.tokens';
import { LegacyElement } from '../../../shared/ui/LegacyElement';
import { LegacyElementHost } from '../../../shared/ui/LegacyElementHost';
import { SplitView } from '../../../shared/ui/split-view';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $isContentFilterOpen } from '../../../features/search/model/contentFilter.store';
import {
    $floatingContextWidth,
    $isMobilePreviewOpen,
    setFloatingContextWidth,
} from '../model/browseLayout.store';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
const CONTEXT_DEFAULT_PERCENT = LayoutTokens.contextPanel.dockedWidthPercent.browse;
const RESIZE_NOTIFY_DELAY_MS = 200;
const FLOATING_MIN_LEFT_GAP = 60;
const FLOATING_KEYBOARD_STEP = 16;

function clampFloatingWidth(width: number, maxWidth: number): number {
    return Math.min(Math.max(width, CONTEXT_MIN_WIDTH), Math.max(maxWidth, CONTEXT_MIN_WIDTH));
}

type FloatingContextProps = {
    element: Element;
    onResized: () => void;
};

// Floating stays resizable, as the legacy splitter did.
const FloatingContext = ({ element, onResized }: FloatingContextProps): ReactElement => {
    const width = useStore($floatingContextWidth);
    const label = useI18n('field.splitView.resize');

    const getMaxWidth = (handle: HTMLElement): number => {
        const layoutWidth = handle.closest('[data-component="BrowseLayout"]')?.getBoundingClientRect().width;
        return (layoutWidth ?? window.innerWidth) - FLOATING_MIN_LEFT_GAP;
    };

    const handlePointerDown = (event: { pointerId: number; clientX: number; currentTarget: EventTarget | null }) => {
        const handle = event.currentTarget;
        if (!(handle instanceof HTMLElement)) return;

        handle.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startWidth = $floatingContextWidth.get();
        const maxWidth = getMaxWidth(handle);

        const handleMove = (moveEvent: PointerEvent): void => {
            setFloatingContextWidth(clampFloatingWidth(startWidth + (startX - moveEvent.clientX), maxWidth));
        };
        const stopDragging = (): void => {
            handle.removeEventListener('pointermove', handleMove);
            onResized();
        };

        handle.addEventListener('pointermove', handleMove);
        handle.addEventListener('pointerup', stopDragging, { once: true });
        handle.addEventListener('pointercancel', stopDragging, { once: true });
    };

    const handleKeyDown = (event: { key: string; currentTarget: EventTarget | null; preventDefault: () => void }) => {
        const handle = event.currentTarget;
        if (!(handle instanceof HTMLElement)) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

        event.preventDefault();
        const delta = event.key === 'ArrowLeft' ? FLOATING_KEYBOARD_STEP : -FLOATING_KEYBOARD_STEP;
        setFloatingContextWidth(clampFloatingWidth($floatingContextWidth.get() + delta, getMaxWidth(handle)));
        onResized();
    };

    return (
        <div
            data-component='BrowseLayout.FloatingContext'
            className='absolute inset-y-0 right-0 z-40 flex bg-surface-neutral shadow-xl'
            style={{ width }}
        >
            <div
                role='separator'
                aria-orientation='vertical'
                aria-label={label}
                aria-valuenow={width}
                aria-valuemin={CONTEXT_MIN_WIDTH}
                tabIndex={0}
                className={cn(
                    'relative w-px shrink-0 cursor-col-resize bg-bdr-soft transition-colors',
                    'hover:bg-bdr-select focus-visible:ring-3 focus-visible:ring-ring focus-visible:z-10',
                    String.raw`after:content-[''] after:absolute after:inset-y-0 after:-left-1 after:w-2.5`,
                )}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
            />
            <LegacyElementHost element={element} className='min-w-0 grow' />
        </div>
    );
};

FloatingContext.displayName = 'BrowseLayout.FloatingContext';

export type BrowseLayoutProps = {
    // Owned by ContentBrowsePanel; the layout only places them.
    gridPanel: Element;
    previewPanel: Element;
    contextPanel: Element;
    filterPanel?: Element;
};

const BROWSE_LAYOUT_NAME = 'BrowseLayout';

// Legacy panels must fill their hosts; `!` beats the unlayered legacy CSS.
const LEGACY_PANEL_OVERRIDES = cn(
    '[&_.context-panel]:!absolute [&_.context-panel]:!inset-0 [&_.context-panel]:!w-auto',
    '[&_.context-panel]:!h-auto [&_.context-panel]:!transition-none',
    '[&_.filter-panel]:!inset-0 [&_.filter-panel]:!w-auto',
);

export const BrowseLayout = ({ gridPanel, previewPanel, contextPanel, filterPanel }: BrowseLayoutProps): ReactElement => {
    const isContextOpen = useStore($isContextOpen);
    const mode = useStore($contextPanelMode);
    const isMobilePreviewOpen = useStore($isMobilePreviewOpen);
    const isFilterOpen = useStore($isContentFilterOpen);

    const rootRef = useRef<HTMLDivElement>(null);
    const totalWidthRef = useRef(0);
    const contextWidthRef = useRef(0);

    const publishMetrics = useCallback(() => {
        const totalWidth = totalWidthRef.current;
        const measured = contextWidthRef.current;
        const contextWidth = measured > 0
            ? measured
            : Math.max(CONTEXT_MIN_WIDTH, (totalWidth * CONTEXT_DEFAULT_PERCENT) / 100);

        setContextLayoutMetrics({ totalWidth, contextWidth });
    }, []);

    useEffect(() => {
        const root = rootRef.current;
        if (root == null) return;

        const observer = new ResizeObserver(() => {
            totalWidthRef.current = root.getBoundingClientRect().width;
            publishMetrics();
        });
        observer.observe(root);

        return () => observer.disconnect();
    }, [publishMetrics]);

    // Hosted legacy content re-measures only on ResponsiveManager events.
    const notifyLegacyResize = useMemo(
        () => AppHelper.debounce(() => ResponsiveManager.fireResizeEvent(), RESIZE_NOTIFY_DELAY_MS),
        [],
    );

    const handlePanelResize = useCallback(() => notifyLegacyResize(), [notifyLegacyResize]);

    const handleContextResize = useCallback(
        (panelSize: { inPixels: number }) => {
            contextWidthRef.current = panelSize.inPixels;
            publishMetrics();
            notifyLegacyResize();
        },
        [publishMetrics, notifyLegacyResize],
    );

    // top-15 clears the 60px legacy toolbar.
    if (mode === 'mobile') {
        return (
            <div
                ref={rootRef}
                data-component={BROWSE_LAYOUT_NAME}
                className={cn('absolute inset-x-0 bottom-0 top-15 overflow-hidden', LEGACY_PANEL_OVERRIDES)}
            >
                <LegacyElementHost element={gridPanel} className='size-full' />
                {filterPanel != null && isFilterOpen && (
                    <div data-component='BrowseLayout.MobileFilter' className='absolute inset-0 z-20 bg-surface-neutral'>
                        <LegacyElementHost element={filterPanel} className='size-full' />
                    </div>
                )}
                <div
                    data-component='BrowseLayout.MobilePreview'
                    className={cn(
                        'absolute inset-0 z-10 bg-surface-neutral transition-transform duration-500',
                        isMobilePreviewOpen ? 'translate-x-0' : 'translate-x-full',
                    )}
                >
                    <LegacyElementHost element={previewPanel} className='size-full' />
                    <div
                        className={cn(
                            'absolute inset-0 z-10 transition-transform duration-500',
                            isContextOpen ? 'translate-y-0' : 'translate-y-full',
                        )}
                    >
                        <LegacyElementHost element={contextPanel} className='size-full' />
                    </div>
                </div>
            </div>
        );
    }

    const showDockedContext = isContextOpen && mode === 'docked';
    const showFloatingContext = isContextOpen && mode === 'floating';

    return (
        <div
            ref={rootRef}
            data-component={BROWSE_LAYOUT_NAME}
            className={cn('absolute inset-x-0 bottom-0 top-15', LEGACY_PANEL_OVERRIDES)}
        >
            <SplitView orientation='horizontal' storageId='browse-layout' className='size-full'>
                {filterPanel != null && isFilterOpen && (
                    <>
                        <SplitView.Panel
                            id='filter'
                            defaultSize='300px'
                            minSize='300px'
                            groupResizeBehavior='preserve-pixel-size'
                        >
                            <LegacyElementHost element={filterPanel} className='size-full bg-surface-neutral' />
                        </SplitView.Panel>
                        <SplitView.Handle id='filter-handle' variant='thin' />
                    </>
                )}
                <SplitView.Panel id='grid' defaultSize='50%' minSize='300px' onResize={handlePanelResize}>
                    <LegacyElementHost element={gridPanel} className='size-full' />
                </SplitView.Panel>
                <SplitView.Handle id='grid-preview-handle' variant='thin' />
                <SplitView.Panel id='preview' minSize='300px' onResize={handlePanelResize}>
                    <LegacyElementHost element={previewPanel} className='size-full' />
                </SplitView.Panel>
                {showDockedContext && (
                    <>
                        <SplitView.Handle id='context-handle' variant='thin' />
                        <SplitView.Panel
                            id='context'
                            defaultSize={`${CONTEXT_DEFAULT_PERCENT}%`}
                            minSize={`${CONTEXT_MIN_WIDTH}px`}
                            onResize={handleContextResize}
                        >
                            <LegacyElementHost element={contextPanel} className='size-full' />
                        </SplitView.Panel>
                    </>
                )}
            </SplitView>
            {showFloatingContext && <FloatingContext element={contextPanel} onResized={notifyLegacyResize} />}
        </div>
    );
};

BrowseLayout.displayName = BROWSE_LAYOUT_NAME;

export class BrowseLayoutElement extends LegacyElement<typeof BrowseLayout, BrowseLayoutProps> {
    constructor(props: BrowseLayoutProps) {
        super(props, BrowseLayout);
    }
}
