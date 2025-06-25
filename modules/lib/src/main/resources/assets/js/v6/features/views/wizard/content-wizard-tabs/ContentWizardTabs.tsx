import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $contentTypeDisplayName,
    $displayName,
    $hasPage,
    $isContentFormExpanded,
    $mixinsTabs,
} from '../../../store/wizardContent.store';
import {CollapsedFormPanel} from './CollapsedFormPanel';
import {ContentDataView} from './ContentDataView';
import {MixinView} from './MixinView';
import {PageView} from './PageView';
import {ToggleFormButton} from './ToggleFormButton';

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
    const pageTabLabel = useI18n('field.page');

    if (!isExpanded) {
        return <CollapsedFormPanel data-component={CONTENT_WIZARD_TABS_NAME} displayName={displayName || contentTypeDisplayName} />;
    }

    return (
        <Tab.Root data-component={CONTENT_WIZARD_TABS_NAME} defaultValue="content" className="flex flex-col gap-7.5">
            <div className="flex items-center gap-1.5">
                <Tab.ListOverflow className="min-w-0 flex-1">
                    <Tab.List>
                        <Tab.DefaultTrigger value="content">{contentTypeDisplayName}</Tab.DefaultTrigger>
                        {hasPage && <Tab.DefaultTrigger value="page">{pageTabLabel}</Tab.DefaultTrigger>}
                        {xDataTabs.map((tab) => (
                            <Tab.DefaultTrigger key={tab.name} value={tab.name}>
                                {tab.displayName}
                            </Tab.DefaultTrigger>
                        ))}
                    </Tab.List>
                </Tab.ListOverflow>
                {tabListAction}
                <ToggleFormButton/>
            </div>

            <Tab.Content value="content">
                <ContentDataView />
            </Tab.Content>

            {hasPage && (
                <Tab.Content value="page">
                    <PageView />
                </Tab.Content>
            )}

            {xDataTabs.map((tab) => (
                <Tab.Content key={tab.name} value={tab.name}>
                    <MixinView mixinName={tab.name} displayName={tab.displayName} />
                </Tab.Content>
            ))}
        </Tab.Root>
    );
};

ContentWizardTabs.displayName = CONTENT_WIZARD_TABS_NAME;
