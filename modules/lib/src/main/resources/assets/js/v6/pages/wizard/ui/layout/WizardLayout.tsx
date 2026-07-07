import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { LayoutTokens } from '../../../../shared/ui/layout.tokens';
import { LegacyElement } from '../../../../shared/ui/LegacyElement';
import { LegacyElementHost } from '../../../../shared/ui/LegacyElementHost';
import { SplitView } from '../../../../shared/ui/split-view';
import { $isContextOpen } from '../../../../widgets/context-panel/model/contextWidgets.store';
import { FloatingContextPanel } from '../../../../widgets/context-panel/ui/FloatingContextPanel';
import { $isContentFormExpanded, setContentFormExpanded } from '../../model/wizardContent.store';
import { $wizardContextPanelMode, $wizardViewMode, setWizardLayoutMetrics } from '../../model/wizardLayout.store';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
// Below this the form is unusable; dragging past it collapses to the 60px rail instead.
const FORM_MIN_WIDTH = 360;
const DOCKED_PERCENT = LayoutTokens.contextPanel.dockedWidthPercent;
const FLOATING_EDITOR_PERCENT = LayoutTokens.contextPanel.floatingWidthPercent.wizardWithEditor;
const RESIZE_NOTIFY_DELAY_MS = 200;

export type WizardLayoutProps = {
    // Owned by ContentWizardPanel; the layout only places them.
    formPanel: Element;
    livePanel: Element;
    contextPanel: Element;
    onResized?: () => void;
};

const WIZARD_LAYOUT_NAME = 'WizardLayout';

// `!` beats the unlayered legacy CSS.
const LEGACY_PANEL_OVERRIDES = cn(
    '[&_.context-panel]:!absolute [&_.context-panel]:!inset-0 [&_.context-panel]:!w-auto',
    '[&_.context-panel]:!h-auto [&_.context-panel]:!transition-none',
);

export const WizardLayout = ({ formPanel, livePanel, contextPanel, onResized }: WizardLayoutProps): ReactElement => {
    const viewMode = useStore($wizardViewMode);
    const formExpanded = useStore($isContentFormExpanded);
    const isContextOpen = useStore($isContextOpen);
    const mode = useStore($wizardContextPanelMode);

    const rootRef = useRef<HTMLDivElement>(null);
    const totalWidthRef = useRef(0);
    const contextWidthRef = useRef(0);

    const isMobile = mode === 'mobile';
    const editorShown = viewMode !== 'form';
    const dockedPercent = editorShown ? DOCKED_PERCENT.wizardWithEditor : DOCKED_PERCENT.wizardNoEditor;

    const publishMetrics = useCallback(() => {
        const totalWidth = totalWidthRef.current;
        const measured = contextWidthRef.current;
        const contextWidth = measured > 0
            ? measured
            : Math.max(CONTEXT_MIN_WIDTH, (totalWidth * dockedPercent) / 100);

        setWizardLayoutMetrics({ totalWidth, contextWidth });
    }, [dockedPercent]);

    useEffect(() => {
        const root = rootRef.current;
        if (root == null) return;

        const observer = new ResizeObserver(() => {
            const width = root.getBoundingClientRect().width;
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

    // Coalesced per frame: onResized (sticky toolbar) forces a reflow per call.
    const resizedFrameRef = useRef(0);
    useEffect(() => () => cancelAnimationFrame(resizedFrameRef.current), []);
    const scheduleResized = useCallback(() => {
        if (onResized == null) return;
        cancelAnimationFrame(resizedFrameRef.current);
        resizedFrameRef.current = requestAnimationFrame(() => onResized());
    }, [onResized]);

    const handlePanelResize = useCallback(() => {
        notifyLegacyResize();
        scheduleResized();
    }, [notifyLegacyResize, scheduleResized]);

    const handleContextResize = useCallback(
        (panelSize: { inPixels: number }) => {
            contextWidthRef.current = panelSize.inPixels;
            publishMetrics();
            handlePanelResize();
        },
        [publishMetrics, handlePanelResize],
    );

    // Drag-collapse must reach the store, or the minimize toggle desyncs.
    const handleFormCollapsedChange = useCallback(
        (collapsed: boolean) => {
            if (!isMobile) setContentFormExpanded(!collapsed);
        },
        [isMobile],
    );

    const floatingDefaultWidth = editorShown && formExpanded
        ? (totalWidthRef.current * FLOATING_EDITOR_PERCENT) / 100
        : CONTEXT_MIN_WIDTH;

    // ! Form and live stay mounted through mode changes: re-parenting would reload
    // the live-edit iframe. Mobile and view-mode visibility is collapse, not unmount.
    const formCollapsed = !formExpanded || (isMobile && viewMode === 'live');
    // A minimized form in mobile keeps the 60px rail and shows the live edit next
    // to it (legacy behavior); only an expanded form claims the mobile screen.
    const liveCollapsed = viewMode === 'form' || (isMobile && viewMode !== 'live' && formExpanded);
    const showFormLiveHandle = !isMobile && viewMode !== 'form' && formExpanded;

    const showDockedContext = isContextOpen && mode === 'docked';
    const showFloatingContext = isContextOpen && mode === 'floating';
    const showMobileContext = isContextOpen && isMobile;

    // The host wrapper panel is offset below the toolbar; the layout fills it.
    return (
        <div
            ref={rootRef}
            data-component={WIZARD_LAYOUT_NAME}
            className={cn('absolute inset-0', isMobile && 'overflow-hidden', LEGACY_PANEL_OVERRIDES)}
        >
            <SplitView orientation='horizontal' storageId='wizard-layout' className='size-full'>
                <SplitView.Panel
                    id='form'
                    defaultSize='38%'
                    minSize={isMobile ? undefined : `${FORM_MIN_WIDTH}px`}
                    collapsible
                    collapsedSize={isMobile && viewMode === 'live' ? '0px' : '60px'}
                    collapsed={formCollapsed}
                    onCollapsedChange={handleFormCollapsedChange}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={formPanel} className='size-full' />
                </SplitView.Panel>
                {showFormLiveHandle && <SplitView.Handle id='form-live-handle' variant='thin' />}
                <SplitView.Panel
                    id='live'
                    collapsible
                    collapsed={liveCollapsed}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={livePanel} className='size-full' />
                </SplitView.Panel>
                {showDockedContext && (
                    <>
                        <SplitView.Handle id='context-handle' variant='thin' />
                        <SplitView.Panel
                            id='context'
                            defaultSize={`${dockedPercent}%`}
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
                    boundsSelector='[data-component="WizardLayout"]'
                    defaultWidth={floatingDefaultWidth}
                    onResized={handlePanelResize}
                />
            )}
            {showMobileContext && (
                <div data-component='WizardLayout.MobileContext' className='absolute inset-0 z-[1] bg-surface-neutral'>
                    <LegacyElementHost element={contextPanel} className='size-full' />
                </div>
            )}
        </div>
    );
};

WizardLayout.displayName = WIZARD_LAYOUT_NAME;

export class WizardLayoutElement extends LegacyElement<typeof WizardLayout, WizardLayoutProps> {
    constructor(props: WizardLayoutProps) {
        super(props, WizardLayout);
    }
}
