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
import { $isContentFilterOpen } from '../../../features/search/model/contentFilter.store';
import { FloatingContextPanel } from '../../../widgets/context-panel/ui/FloatingContextPanel';
import { $isMobilePreviewOpen } from '../model/browseLayout.store';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
const CONTEXT_DEFAULT_PERCENT = LayoutTokens.contextPanel.dockedWidthPercent.browse;
const RESIZE_NOTIFY_DELAY_MS = 200;

export type BrowseLayoutProps = {
    // Owned by ContentBrowsePanel; the layout only places them.
    gridPanel: Element;
    previewPanel: Element;
    contextPanel: Element;
    filterPanel?: Element;
    storageId?: string;
};

const BROWSE_LAYOUT_NAME = 'BrowseLayout';

// Legacy panels must fill their hosts; `!` beats the unlayered legacy CSS.
const LEGACY_PANEL_OVERRIDES = cn(
    '[&_.context-panel]:!absolute [&_.context-panel]:!inset-0 [&_.context-panel]:!w-auto',
    '[&_.context-panel]:!h-auto [&_.context-panel]:!transition-none',
    '[&_.filter-panel]:!inset-0 [&_.filter-panel]:!w-auto',
);

export const BrowseLayout = ({
    gridPanel,
    previewPanel,
    contextPanel,
    filterPanel,
    storageId = 'browse-layout',
}: BrowseLayoutProps): ReactElement => {
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
            const width = root.getBoundingClientRect().width;
            // A hidden app (e.g. Archive in CS+) reports 0 and must not clobber the shared metrics.
            if (width <= 0) return;

            totalWidthRef.current = width;
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

    const isMobile = mode === 'mobile';
    // ! Grid and preview stay mounted through mode changes: re-parenting would
    // reload the preview iframe. Mobile visibility is collapse, not unmount.
    const gridCollapsed = isMobile && isMobilePreviewOpen;
    const previewCollapsed = isMobile && !isMobilePreviewOpen;

    const showFilterSplitPanel = filterPanel != null && isFilterOpen && !isMobile;
    const showMobileFilter = filterPanel != null && isFilterOpen && isMobile;
    const showDockedContext = isContextOpen && mode === 'docked';
    const showFloatingContext = isContextOpen && mode === 'floating';
    const showMobileContext = isContextOpen && isMobile;

    // top-15 clears the 60px legacy toolbar.
    return (
        <div
            ref={rootRef}
            data-component={BROWSE_LAYOUT_NAME}
            className={cn('absolute inset-x-0 bottom-0 top-15', isMobile && 'overflow-hidden', LEGACY_PANEL_OVERRIDES)}
        >
            <SplitView orientation='horizontal' storageId={storageId} className='size-full'>
                {showFilterSplitPanel && (
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
                <SplitView.Panel
                    id='grid'
                    defaultSize='50%'
                    minSize={isMobile ? undefined : '300px'}
                    collapsible={isMobile}
                    collapsed={gridCollapsed}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={gridPanel} className='size-full' />
                </SplitView.Panel>
                {!isMobile && <SplitView.Handle id='grid-preview-handle' variant='thin' />}
                <SplitView.Panel
                    id='preview'
                    minSize={isMobile ? undefined : '300px'}
                    collapsible={isMobile}
                    collapsed={previewCollapsed}
                    onResize={handlePanelResize}
                >
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
            {showFloatingContext && (
                <FloatingContextPanel
                    element={contextPanel}
                    boundsSelector='[data-component="BrowseLayout"]'
                    onResized={notifyLegacyResize}
                />
            )}
            {showMobileContext && (
                <div data-component='BrowseLayout.MobileContext' className='absolute inset-0 z-[1] bg-surface-neutral'>
                    <LegacyElementHost element={contextPanel} className='size-full' />
                </div>
            )}
            {showMobileFilter && (
                <div data-component='BrowseLayout.MobileFilter' className='absolute inset-0 z-[2] bg-surface-neutral'>
                    <LegacyElementHost element={filterPanel} className='size-full' />
                </div>
            )}
        </div>
    );
};

BrowseLayout.displayName = BROWSE_LAYOUT_NAME;

export class BrowseLayoutElement extends LegacyElement<typeof BrowseLayout, BrowseLayoutProps> {
    constructor(props: BrowseLayoutProps) {
        super(props, BrowseLayout);
    }
}
