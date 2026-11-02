import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { PreviewLabel } from '../../../../shared/ui/PreviewLabel';
import { $currentItems } from '../../model/settingsTreeSelection.store';
import { SettingsItemStatistics } from './SettingsItemStatistics';

const SETTINGS_ITEM_PANEL_NAME = 'SettingsItemPanel';

const NoSelectionMessage = (): ReactElement => {
    const message = useI18n('panel.noselection');

    return <PreviewLabel messages={[message]} className="h-full" />;
};

NoSelectionMessage.displayName = 'NoSelectionMessage';

export const SettingsItemPanel = (): ReactElement => {
    const currentItems = useStore($currentItems);
    const item = currentItems[0];

    return (
        <div data-component={SETTINGS_ITEM_PANEL_NAME} className="size-full overflow-y-auto p-10">
            {item ? <SettingsItemStatistics item={item} /> : <NoSelectionMessage />}
        </div>
    );
};

SettingsItemPanel.displayName = SETTINGS_ITEM_PANEL_NAME;
