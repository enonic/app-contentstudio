import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $hasPage,
    $contentTypeDisplayName,
    $mixinsTabs,
} from '../../../store/wizardContent.store';
import {ContentDataView} from './ContentDataView';
import {PageView} from './PageView';
import {MixinView} from './MixinView';

type ContentWizardTabsProps = {
    tabListAction?: ReactElement;
};

export const ContentWizardTabs = ({tabListAction}: ContentWizardTabsProps): ReactElement => {
    const contentTypeDisplayName = useStore($contentTypeDisplayName);
    const hasPage = useStore($hasPage);
    const xDataTabs = useStore($mixinsTabs);
    const pageTabLabel = useI18n('field.page');

    return (
        <Tab.Root defaultValue="content" className="flex flex-col gap-7.5">
            <div className="flex items-center gap-2">
            <Tab.List>
                <Tab.DefaultTrigger value="content">{contentTypeDisplayName}</Tab.DefaultTrigger>
                {hasPage && <Tab.DefaultTrigger value="page">{pageTabLabel}</Tab.DefaultTrigger>}
                {xDataTabs.map((tab) => (
                    <Tab.DefaultTrigger key={tab.name} value={tab.name}>
                        {tab.displayName}
                    </Tab.DefaultTrigger>
                ))}
            </Tab.List>
            {tabListAction}
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

ContentWizardTabs.displayName = 'ContentWizardTabs';
