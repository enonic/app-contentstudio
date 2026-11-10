import { type ReactElement, useRef } from 'react';
import { SettingsLayout } from './layout/SettingsLayout';
import { SettingsBrowseToolbar } from './SettingsBrowseToolbar';
import { useSettingsShortcuts } from './useSettingsShortcuts';

const SETTINGS_BROWSE_PANEL_NAME = 'SettingsBrowsePanel';

// Fills the widget slot the browse shell positions below the app bar and right of the sidebar.
export const SettingsBrowsePanel = (): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);

    useSettingsShortcuts(rootRef);

    return (
        <div ref={rootRef} data-component={SETTINGS_BROWSE_PANEL_NAME} className="absolute inset-0 flex flex-col">
            <SettingsBrowseToolbar />
            <SettingsLayout />
        </div>
    );
};

SettingsBrowsePanel.displayName = SETTINGS_BROWSE_PANEL_NAME;
