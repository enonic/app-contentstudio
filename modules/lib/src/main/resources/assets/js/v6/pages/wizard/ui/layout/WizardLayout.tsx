import { type Element } from '@enonic/lib-admin-ui/dom/Element';
import { ResponsiveManager } from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import { AppHelper } from '@enonic/lib-admin-ui/util/AppHelper';
import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import type { Layout } from 'react-resizable-panels';
import { LayoutTokens } from '../../../../shared/ui/layout.tokens';
import { LegacyElement } from '../../../../shared/ui/LegacyElement';
import { LegacyElementHost } from '../../../../shared/ui/LegacyElementHost';
import { SplitView } from '../../../../shared/ui/split-view';
import { PAGE_EDITOR_WIDGET_NAME } from '../../../../shared/lib/widget/pageEditor';
import { $isContextOpen } from '../../../../widgets/context-panel/model/contextWidgets.store';
import { ContextPanelView, type ContextWidgetComponents } from '../../../../widgets/context-panel/ui/ContextPanelView';
import { FloatingContextPanel } from '../../../../widgets/context-panel/ui/FloatingContextPanel';
import { PageEditorExtension } from '../../../../widgets/inspectors/ui/page-editor';
import { $isContentFormExpanded, setContentFormExpanded } from '../../model/wizardContent.store';
import { $wizardContextPanelMode, $wizardViewMode, setWizardLayoutMetrics } from '../../model/wizardLayout.store';
import { resolveWizardPanelLayout } from './resolveWizardPanelLayout';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
// Below this the form is unusable; dragging past it collapses to the 60px rail instead.
const FORM_MIN_WIDTH = 360;
const LIVE_MIN_WIDTH = 360;
const MINIMIZED_RAIL_WIDTH = '60px';
const FORM_DEFAULT_PERCENT = 38;
const FORM_DEFAULT_SIZE = `${FORM_DEFAULT_PERCENT}%`;
const LIVE_DEFAULT_PERCENT = 100 - FORM_DEFAULT_PERCENT;
const DOCKED_PERCENT = LayoutTokens.contextPanel.dockedWidthPercent;
const FLOATING_EDITOR_PERCENT = LayoutTokens.contextPanel.floatingWidthPercent.wizardWithEditor;
const RESIZE_NOTIFY_DELAY_MS = 200;

const WIZARD_CONTEXT_WIDGETS: ContextWidgetComponents = { [PAGE_EDITOR_WIDGET_NAME]: PageEditorExtension };

// The live panel stays mounted when hidden, so the set is built from visibility.
const PANEL_IDS_FORM = ['form'];
const PANEL_IDS_FORM_CONTEXT = ['form', 'context'];
const PANEL_IDS_FORM_LIVE = ['form', 'live'];
const PANEL_IDS_FORM_LIVE_CONTEXT = ['form', 'live', 'context'];

const getPanelIds = (withLive: boolean, withContext: boolean): string[] => {
    if (withLive) return withContext ? PANEL_IDS_FORM_LIVE_CONTEXT : PANEL_IDS_FORM_LIVE;
    return withContext ? PANEL_IDS_FORM_CONTEXT : PANEL_IDS_FORM;
};

export type WizardLayoutProps = {
    // Owned by ContentWizardPanel; the layout only places them.
    formPanel: Element;
    livePanel: Element;
    onResized?: () => void;
};

const WIZARD_LAYOUT_NAME = 'WizardLayout';

export const WizardLayout = ({ formPanel, livePanel, onResized }: WizardLayoutProps): ReactElement => {
    const viewMode = useStore($wizardViewMode);
    const formExpanded = useStore($isContentFormExpanded);
    const isContextOpen = useStore($isContextOpen);
    const mode = useStore($wizardContextPanelMode);

    const rootRef = useRef<HTMLDivElement>(null);
    const totalWidthRef = useRef(0);

    const isMobile = mode === 'mobile';
    const editorShown = viewMode !== 'form';
    const dockedPercent = editorShown ? DOCKED_PERCENT.wizardWithEditor : DOCKED_PERCENT.wizardNoEditor;

    const publishMetrics = useCallback(() => {
        setWizardLayoutMetrics({ totalWidth: totalWidthRef.current });
    }, []);

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

    // Drag-collapse must reach the store, or the minimize toggle desyncs.
    const handleFormCollapsedChange = useCallback(
        (collapsed: boolean) => {
            if (!isMobile) setContentFormExpanded(!collapsed);
        },
        [isMobile],
    );

    const floatingDefaultWidth =
        editorShown && formExpanded ? (totalWidthRef.current * FLOATING_EDITOR_PERCENT) / 100 : CONTEXT_MIN_WIDTH;

    // ! Form and live stay mounted through mode changes: re-parenting would reload
    // the live-edit iframe. Mobile and view-mode visibility is collapse, not unmount.
    const formCollapsed = !formExpanded || (isMobile && viewMode === 'live');
    // A minimized form in mobile keeps the 60px rail and shows the live edit next
    // to it (legacy behavior); only an expanded form claims the mobile screen.
    const liveCollapsed = viewMode === 'form' || (isMobile && viewMode !== 'live' && formExpanded);
    const showFormLiveHandle = !isMobile && viewMode !== 'form' && formExpanded;

    const handleResolveLayout = useCallback(
        (previous: Layout, next: Layout): Layout | undefined =>
            resolveWizardPanelLayout(previous, next, {
                totalWidth: totalWidthRef.current,
                formMinWidth: FORM_MIN_WIDTH,
                liveMinWidth: LIVE_MIN_WIDTH,
                contextMinWidth: CONTEXT_MIN_WIDTH,
                liveDefaultPercent: LIVE_DEFAULT_PERCENT,
                contextDefaultPercent: dockedPercent,
                liveShown: !liveCollapsed,
                formCollapsed,
            }),
        [dockedPercent, formCollapsed, liveCollapsed],
    );

    const showDockedContext = isContextOpen && mode === 'docked';
    const showFloatingContext = isContextOpen && mode === 'floating';
    const showMobileContext = isContextOpen && isMobile;

    const panelIds = getPanelIds(!liveCollapsed, showDockedContext);

    // The host wrapper panel is offset below the toolbar; the layout fills it.
    return (
        <div
            ref={rootRef}
            data-component={WIZARD_LAYOUT_NAME}
            className={cn('absolute inset-0', isMobile && 'overflow-hidden')}
        >
            <SplitView
                orientation="horizontal"
                storageId="wizard-layout"
                panelIds={panelIds}
                resolveLayoutOnPanelsChange={handleResolveLayout}
                className="size-full"
            >
                <SplitView.Panel
                    id="form"
                    defaultSize={FORM_DEFAULT_SIZE}
                    minSize={isMobile ? undefined : `${FORM_MIN_WIDTH}px`}
                    collapsible
                    collapsedSize={isMobile && viewMode === 'live' ? '0px' : MINIMIZED_RAIL_WIDTH}
                    collapsed={formCollapsed}
                    onCollapsedChange={handleFormCollapsedChange}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={formPanel} className="size-full" />
                </SplitView.Panel>
                {showFormLiveHandle && <SplitView.Handle id="form-live-handle" variant="thin" />}
                <SplitView.Panel
                    id="live"
                    minSize={isMobile ? undefined : `${LIVE_MIN_WIDTH}px`}
                    collapsible
                    collapsed={liveCollapsed}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={livePanel} className="size-full" />
                </SplitView.Panel>
                {showDockedContext && (
                    <>
                        <SplitView.Handle id="context-handle" variant="thin" />
                        <SplitView.Panel
                            id="context"
                            defaultSize={`${dockedPercent}%`}
                            minSize={`${CONTEXT_MIN_WIDTH}px`}
                            onResize={handlePanelResize}
                        >
                            <ContextPanelView widgets={WIZARD_CONTEXT_WIDGETS} />
                        </SplitView.Panel>
                    </>
                )}
            </SplitView>
            {showFloatingContext && (
                <FloatingContextPanel
                    boundsSelector='[data-component="WizardLayout"]'
                    defaultWidth={floatingDefaultWidth}
                    onResized={handlePanelResize}
                >
                    <ContextPanelView widgets={WIZARD_CONTEXT_WIDGETS} className="min-w-0 grow" />
                </FloatingContextPanel>
            )}
            {showMobileContext && (
                <div data-component="WizardLayout.MobileContext" className="absolute inset-0 bg-surface-neutral">
                    <ContextPanelView widgets={WIZARD_CONTEXT_WIDGETS} />
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
