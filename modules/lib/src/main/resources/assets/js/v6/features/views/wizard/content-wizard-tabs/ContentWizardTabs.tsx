import {Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {
    $contentTypeDisplayName,
    $mixinsTabs,
    $persistedHasPage,
} from '../../../store/wizardContent.store';
import {ContentDataView} from './ContentDataView';
import {PageView} from './PageView';
import {XDataView} from './XDataView';

export const ContentWizardTabs = (): ReactElement => {
    const contentTypeDisplayName = useStore($contentTypeDisplayName);
    const hasPage = useStore($persistedHasPage);
    const xDataTabs = useStore($mixinsTabs);

    return (
        <Tab.Root defaultValue="content" className="flex flex-col gap-3 p-5">
            <Tab.List>
                <Tab.DefaultTrigger value="content">{contentTypeDisplayName}</Tab.DefaultTrigger>
                {hasPage && <Tab.DefaultTrigger value="page">Page</Tab.DefaultTrigger>}
                {xDataTabs.map((tab) => (
                    <Tab.DefaultTrigger key={tab.name} value={tab.name}>
                        {tab.displayName}
                    </Tab.DefaultTrigger>
                ))}
            </Tab.List>

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
                    <XDataView displayName={tab.displayName} />
                </Tab.Content>
            ))}
        </Tab.Root>
    );
};

ContentWizardTabs.displayName = 'ContentWizardTabs';
