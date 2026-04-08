import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import Q from 'q';
import {type ReactElement, useEffect, useState} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import type {ExtensionItemViewType} from '../../../../../../app/view/context/ExtensionItemView';
import {useI18n} from '../../../../hooks/useI18n';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {$activeWidgetId, $isContextOpen} from '../../../../store/contextWidgets.store';
import {$isInsertTabAvailable} from '../../../../store/pageEditor.store';
import {$isInspecting} from '../../../../store/pageEditorInspect.store';
import {PAGE_EDITOR_WIDGET_KEY} from '../../../../utils/widget/pageEditor';
import {InsertPanel} from './insert';
import {InspectPanel} from './inspect';

const PAGE_EDITOR_EXTENSION_NAME = 'PageEditorExtension';

export const PageEditorExtension = (): ReactElement => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidgetId = useStore($activeWidgetId);
    const isInsertTabAvailable = useStore($isInsertTabAvailable);
    const isInspecting = useStore($isInspecting);

    const [activeTab, setActiveTab] = useState<string>('inspect');

    const insertLabel = useI18n('action.insert');
    const inspectLabel = useI18n('action.inspect');

    // Auto-select Insert tab when not inspecting and insert is available
    useEffect(() => {
        if (!isInspecting && isInsertTabAvailable) {
            setActiveTab('insert');
        }
    }, [isInspecting, isInsertTabAvailable]);

    // Fall back to Inspect tab when Insert becomes unavailable
    useEffect(() => {
        if (activeTab === 'insert' && !isInsertTabAvailable) {
            setActiveTab('inspect');
        }
    }, [activeTab, isInsertTabAvailable]);

    if (!isContextOpen || activeWidgetId !== PAGE_EDITOR_WIDGET_KEY) return null;

    return (
        <Tab.Root data-component={PAGE_EDITOR_EXTENSION_NAME} value={activeTab} onValueChange={setActiveTab} className="flex flex-col -mt-4">
            <Tab.List>
                <Tab.DefaultTrigger value="insert" disabled={!isInsertTabAvailable}>{insertLabel}</Tab.DefaultTrigger>
                <Tab.DefaultTrigger value="inspect">{inspectLabel}</Tab.DefaultTrigger>
            </Tab.List>

            <Tab.Content value="insert" className="mt-5">
                <InsertPanel />
            </Tab.Content>
            <Tab.Content value="inspect" className="mt-0">
                <InspectPanel />
            </Tab.Content>
        </Tab.Root>
    );
};

PageEditorExtension.displayName = PAGE_EDITOR_EXTENSION_NAME;

// Backward compatibility: ContextWindow -> PageEditorExtension
export class PageEditorExtensionElement extends LegacyElement<typeof PageEditorExtension> implements ExtensionItemViewType {
    constructor() {
        super({}, PageEditorExtension);
    }

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(_item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    public fetchExtensionContents(_url: string, _contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
