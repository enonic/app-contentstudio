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
import { $isContentFormExpanded } from '../../model/wizardContent.store';
import { $wizardContextPanelMode, $wizardViewMode, setWizardLayoutMetrics } from '../../model/wizardLayout.store';

const CONTEXT_MIN_WIDTH = LayoutTokens.contextPanel.minWidth;
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

    const handlePanelResize = useCallback(() => {
        notifyLegacyResize();
        onResized?.();
    }, [notifyLegacyResize, onResized]);

    const handleContextResize = useCallback(
        (panelSize: { inPixels: number }) => {
            contextWidthRef.current = panelSize.inPixels;
            publishMetrics();
            handlePanelResize();
        },
        [publishMetrics, handlePanelResize],
    );

    const floatingDefaultWidth = editorShown && formExpanded
        ? (totalWidthRef.current * FLOATING_EDITOR_PERCENT) / 100
        : CONTEXT_MIN_WIDTH;

    // The host wrapper panel is offset below the toolbar; the layout fills it.
    if (mode === 'mobile') {
        return (
            <div
                ref={rootRef}
                data-component={WIZARD_LAYOUT_NAME}
                className={cn('absolute inset-0 overflow-hidden', LEGACY_PANEL_OVERRIDES)}
            >
                <LegacyElementHost element={formPanel} className={cn('size-full', viewMode === 'live' && 'hidden')} />
                <LegacyElementHost element={livePanel} className={cn('size-full', viewMode !== 'live' && 'hidden')} />
                {isContextOpen && (
                    <div className='absolute inset-0 z-[1] bg-surface-neutral'>
                        <LegacyElementHost element={contextPanel} className='size-full' />
                    </div>
                )}
            </div>
        );
    }

    const showDockedContext = isContextOpen && mode === 'docked';
    const showFloatingContext = isContextOpen && mode === 'floating';
    // Conditionally mounted (not `hidden`): RRP maps separators to panels on mount.
    const showFormLiveHandle = viewMode !== 'form' && formExpanded;

    return (
        <div
            ref={rootRef}
            data-component={WIZARD_LAYOUT_NAME}
            className={cn('absolute inset-0', LEGACY_PANEL_OVERRIDES)}
        >
            <SplitView orientation='horizontal' storageId='wizard-layout' className='size-full'>
                <SplitView.Panel
                    id='form'
                    defaultSize='38%'
                    minSize='280px'
                    collapsible
                    collapsedSize='60px'
                    collapsed={!formExpanded}
                    onResize={handlePanelResize}
                >
                    <LegacyElementHost element={formPanel} className='size-full' />
                </SplitView.Panel>
                {showFormLiveHandle && <SplitView.Handle id='form-live-handle' variant='thin' />}
                <SplitView.Panel
                    id='live'
                    collapsible
                    collapsed={viewMode === 'form'}
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
        </div>
    );
};

WizardLayout.displayName = WIZARD_LAYOUT_NAME;

export class WizardLayoutElement extends LegacyElement<typeof WizardLayout, WizardLayoutProps> {
    constructor(props: WizardLayoutProps) {
        super(props, WizardLayout);
    }
}
