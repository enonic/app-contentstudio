import {Tab} from '@enonic/ui';
import {type ReactElement, useCallback, useEffect} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {type MacroTab, useHtmlAreaMacroDialogContext} from './HtmlAreaMacroDialogContext';
import {MacroSelector} from './MacroSelector';
import {MacroConfigPanel} from './MacroConfigPanel';
import {MacroPreviewPanel} from './MacroPreviewPanel';

const COMPONENT_NAME = 'HtmlAreaMacroDialogContent';

export const HtmlAreaMacroDialogContent = (): ReactElement => {
    const {
        state: {selectedDescriptor, activeTab},
        setActiveTab,
        loadPreview,
    } = useHtmlAreaMacroDialogContext();

    const configTabLabel = useI18n('dialog.macro.tab.configuration');
    const previewTabLabel = useI18n('dialog.macro.tab.preview');

    const hasDescriptor = selectedDescriptor != null;

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as MacroTab);
    }, [setActiveTab]);

    // Load preview when switching to preview tab
    useEffect(() => {
        if (activeTab === 'preview' && hasDescriptor) {
            loadPreview();
        }
    }, [activeTab, hasDescriptor, loadPreview]);

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-5'>
            <MacroSelector />

            {hasDescriptor && (
                <Tab.Root
                    value={activeTab}
                    onValueChange={handleTabChange}
                >
                    <Tab.List>
                        <Tab.DefaultTrigger value='configuration'>{configTabLabel}</Tab.DefaultTrigger>
                        <Tab.DefaultTrigger value='preview'>{previewTabLabel}</Tab.DefaultTrigger>
                    </Tab.List>
                    <Tab.Content value='configuration'>
                        <MacroConfigPanel />
                    </Tab.Content>
                    <Tab.Content value='preview'>
                        <MacroPreviewPanel />
                    </Tab.Content>
                </Tab.Root>
            )}
        </div>
    );
};

HtmlAreaMacroDialogContent.displayName = COMPONENT_NAME;
