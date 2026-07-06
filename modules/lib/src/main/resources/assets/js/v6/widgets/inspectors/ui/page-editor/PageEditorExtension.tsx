import { Tab } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
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

    if (!isContextOpen || activeWidgetId !== getPageEditorWidgetKey()) {
        return dragState ? <DragPreview /> : null;
    }

    return (
        <>
            <Tab.Root
                data-component={PAGE_EDITOR_EXTENSION_NAME}
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col -mt-4"
            >
                <Tab.List>
                    <Tab.DefaultTrigger value="insert" disabled={!isInsertTabAvailable}>
                        {insertLabel}
                    </Tab.DefaultTrigger>
                    <Tab.DefaultTrigger value="inspect">{inspectLabel}</Tab.DefaultTrigger>
                </Tab.List>

                <Tab.Content value="insert">
                    <InsertPanel />
                </Tab.Content>
                <Tab.Content value="inspect" className="mt-0">
                    <InspectPanel />
                </Tab.Content>
            </Tab.Root>
            <DragPreview />
        </>
    );
};

PageEditorExtension.displayName = PAGE_EDITOR_EXTENSION_NAME;
