import { type ReactElement, useRef } from 'react';
import { SettingsLayout } from './layout/SettingsLayout';
import { SettingsBrowseToolbar } from './SettingsBrowseToolbar';
import { useSettingsShortcuts } from './useSettingsShortcuts';

const SETTINGS_BROWSE_PANEL_NAME = 'SettingsBrowsePanel';

// Fills the widget slot below the 60px app bar and right of the 60px sidebar,
// which collapses on narrow screens.
export const SettingsBrowsePanel = (): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);

    useSettingsShortcuts(rootRef);

    return (
        <div
            ref={rootRef}
            data-component={SETTINGS_BROWSE_PANEL_NAME}
            className="absolute inset-y-0 right-0 left-0 top-15 flex flex-col sm:left-15"
        >
            <SettingsBrowseToolbar />
            <SettingsLayout />
        </div>
    );
};

SettingsBrowsePanel.displayName = SETTINGS_BROWSE_PANEL_NAME;
