import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$activeWidgetId, $isContextOpen} from '../../../../store/contextWidgets.store';
import {$dragState, $inspectedPath, $isInsertTabAvailable, $selectionEventNonce} from '../../../../store/page-editor';
import {PAGE_EDITOR_WIDGET_KEY} from '../../../../utils/widget/pageEditor';
import {usePageEditorTabs} from './hooks/usePageEditorTabs';
import {DragPreview} from './insert/DragPreview';
import {InsertPanel} from './insert';
import {InspectPanel} from './inspect';

const PAGE_EDITOR_EXTENSION_NAME = 'PageEditorExtension';

export const PageEditorExtension = (): ReactElement | null => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidgetId = useStore($activeWidgetId);
    const isInsertTabAvailable = useStore($isInsertTabAvailable);
    const inspectedPath = useStore($inspectedPath);
    const selectionEventNonce = useStore($selectionEventNonce);
    const dragState = useStore($dragState);

    const {activeTab, setActiveTab} = usePageEditorTabs(inspectedPath, isInsertTabAvailable, selectionEventNonce);

    const insertLabel = useI18n('action.insert');
    const inspectLabel = useI18n('action.inspect');

    if (!isContextOpen || activeWidgetId !== PAGE_EDITOR_WIDGET_KEY) {
        return dragState ? <DragPreview /> : null;
    }

    return (
        <>
            <Tab.Root data-component={PAGE_EDITOR_EXTENSION_NAME} value={activeTab} onValueChange={setActiveTab} className="flex flex-col -mt-4">
                <Tab.List>
                    <Tab.DefaultTrigger value="insert" disabled={!isInsertTabAvailable}>{insertLabel}</Tab.DefaultTrigger>
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
