import {type ReactElement} from 'react';
import {ContentWizardTabs} from './ContentWizardTabs';
import {MixinMenu} from './MixinMenu';

export const ContentWizardTabsToolbar = (): ReactElement => {
    return (
        <ContentWizardTabs tabListAction={<MixinMenu />} />
    );
};

ContentWizardTabsToolbar.displayName = 'ContentWizardTabsToolbar';
