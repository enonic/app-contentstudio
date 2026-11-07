import { Tab } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useLayoutEffect, useRef } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { $activeWidgetId, $isContextOpen } from '../../../context-panel/model/contextWidgets.store';
import {
    $dragState,
    $inspectedPath,
    $insertTabActivateNonce,
    $isInsertTabAvailable,
    $selectionEventNonce,
} from '../../model/page-editor';
import { getPageEditorWidgetKey } from '../../../../shared/lib/widget/pageEditor';
import { usePageEditorTabs } from './hooks/usePageEditorTabs';
import { DragPreview } from './insert/DragPreview';
import { InsertPanel } from './insert';
import { InspectPanel } from './inspect';

const PAGE_EDITOR_EXTENSION_NAME = 'PageEditorExtension';

export const PageEditorExtension = (): ReactElement | null => {
    const inspectPanelRef = useRef<HTMLDivElement>(null);
    const pendingInspectFocusRef = useRef<{ path: string; trigger: HTMLButtonElement } | null>(null);
    const isContextOpen = useStore($isContextOpen);
    const activeWidgetId = useStore($activeWidgetId);
    const isInsertTabAvailable = useStore($isInsertTabAvailable);
    const inspectedPath = useStore($inspectedPath);
    const selectionEventNonce = useStore($selectionEventNonce);
    const insertTabActivateNonce = useStore($insertTabActivateNonce);
    const dragState = useStore($dragState);

    const { activeTab, setActiveTab } = usePageEditorTabs(
        inspectedPath,
        isInsertTabAvailable,
        selectionEventNonce,
        insertTabActivateNonce,
    );

    const insertLabel = useI18n('action.insert');
    const inspectLabel = useI18n('action.inspect');
    const isVisible = isContextOpen && activeWidgetId === getPageEditorWidgetKey();

    useLayoutEffect(() => {
        const pending = pendingInspectFocusRef.current;
        if (!pending) {
            return;
        }
        if (!isVisible) {
            pendingInspectFocusRef.current = null;
            return;
        }
        if (activeTab !== 'inspect') {
            return;
        }

        pendingInspectFocusRef.current = null;
        const panel = inspectPanelRef.current;
        if (!panel || inspectedPath !== pending.path) {
            return;
        }
        const active = panel.ownerDocument.activeElement;
        // The Insert button has unmounted. Preserve focus if another control already took it.
        if (active === panel.ownerDocument.body || active === pending.trigger) {
            panel.focus({ preventScroll: true });
        }
    }, [activeTab, inspectedPath, isVisible]);

    if (!isVisible) {
        return dragState ? <DragPreview /> : null;
    }

    return (
        <>
            <Tab.Root
                data-component={PAGE_EDITOR_EXTENSION_NAME}
                value={activeTab}
                onValueChange={setActiveTab}
                // ? The tab value is driven by external selection, which must not pull focus
                //   out of the components list. Arrow navigation inside the list is unaffected.
                autoFocusTrigger={false}
                className="flex flex-col -mt-4"
            >
                <Tab.List>
                    <Tab.DefaultTrigger value="insert" disabled={!isInsertTabAvailable}>
                        {insertLabel}
                    </Tab.DefaultTrigger>
                    <Tab.DefaultTrigger value="inspect">{inspectLabel}</Tab.DefaultTrigger>
                </Tab.List>

                <Tab.Content value="insert">
                    <InsertPanel
                        onInserted={(path, trigger) => {
                            pendingInspectFocusRef.current = { path, trigger };
                        }}
                    />
                </Tab.Content>
                <Tab.Content
                    value="inspect"
                    ref={inspectPanelRef}
                    tabIndex={-1}
                    className="mt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <InspectPanel />
                </Tab.Content>
            </Tab.Root>
            <DragPreview />
        </>
    );
};

PageEditorExtension.displayName = PAGE_EDITOR_EXTENSION_NAME;
