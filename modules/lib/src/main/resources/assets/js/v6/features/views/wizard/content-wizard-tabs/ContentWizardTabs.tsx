import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $contentTypeDisplayName,
    $displayName,
    $hasPage,
    $isContentFormExpanded,
    $mixinsTabs,
} from '../../../store/wizardContent.store';
import {$invalidTabs, $validationVisibility} from '../../../store/wizardValidation.store';
import {CollapsedFormPanel} from './CollapsedFormPanel';
import {ContentForm} from './ContentForm';
import {MixinView} from './MixinView';
import {ToggleFormButton} from './ToggleFormButton';
import {PageComponentsView} from './page-components/PageComponentsView';

type ContentWizardTabsProps = {
    tabListAction?: ReactElement;
};

const CONTENT_WIZARD_TABS_NAME = 'ContentWizardTabs';

export const ContentWizardTabs = ({tabListAction}: ContentWizardTabsProps): ReactElement => {
    const isExpanded = useStore($isContentFormExpanded);
    const contentTypeDisplayName = useStore($contentTypeDisplayName);
    const displayName = useStore($displayName);
    const hasPage = useStore($hasPage);
    const xDataTabs = useStore($mixinsTabs);
    const invalidTabs = useStore($invalidTabs);
    const validationVisibility = useStore($validationVisibility);
    const pageTabLabel = useI18n('field.page');
    const [activeTab, setActiveTab] = useState('content');
    const showErrors = validationVisibility === 'all';

    useEffect(() => {
        const validTabs = ['content', ...(hasPage ? ['page'] : []), ...xDataTabs.map((tab) => tab.name)];
        if (!validTabs.includes(activeTab)) {
            setActiveTab('content');
        }
    }, [hasPage, xDataTabs, activeTab]);

    if (!isExpanded) {
        return <CollapsedFormPanel data-component={CONTENT_WIZARD_TABS_NAME} displayName={displayName || contentTypeDisplayName} />;
    }

    return (
        <Tab.Root data-component={CONTENT_WIZARD_TABS_NAME} value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-7.5">
            <div className="flex items-center gap-1.5">
                <Tab.ListOverflow className="min-w-0 flex-1">
                    <Tab.List>
                        <Tab.DefaultTrigger value="content" error={showErrors && invalidTabs.has('content')}>{contentTypeDisplayName}</Tab.DefaultTrigger>
                        {hasPage && <Tab.DefaultTrigger value="page" error={showErrors && invalidTabs.has('page')}>{pageTabLabel}</Tab.DefaultTrigger>}
                        {xDataTabs.map((tab) => (
                            <Tab.DefaultTrigger key={tab.name} value={tab.name} error={showErrors && invalidTabs.has(tab.name)}>
                                {tab.title}
                            </Tab.DefaultTrigger>
                        ))}
                    </Tab.List>
                </Tab.ListOverflow>
                {tabListAction}
                <ToggleFormButton/>
            </div>

            <Tab.Content value="content">
                <ContentForm />
            </Tab.Content>

            {hasPage && (
                <Tab.Content value="page">
                    <PageComponentsView showTitle />
                </Tab.Content>
            )}

            {xDataTabs.map((tab) => (
                <Tab.Content key={tab.name} value={tab.name}>
                    <MixinView mixinName={tab.name} title={tab.title} />
                </Tab.Content>
            ))}
        </Tab.Root>
    );
};

ContentWizardTabs.displayName = CONTENT_WIZARD_TABS_NAME;
