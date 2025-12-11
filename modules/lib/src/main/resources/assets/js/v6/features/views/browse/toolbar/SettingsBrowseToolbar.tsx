import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Toolbar} from '@enonic/ui';
import {ReactElement} from 'react';
import {SettingsTreeActions} from 'src/main/resources/assets/js/app/settings/tree/SettingsTreeActions';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ActionGroup} from './ActionGroup';
import {ToolbarActionButton} from './ToolbarActionButton';

type SettingsBrowseToolbarProps = {
    actions: Action[];
};

const SETTINGS_BROWSE_TOOLBAR_NAME = 'SettingsBrowseToolbar';

export const SettingsBrowseToolbar = ({actions}: SettingsBrowseToolbarProps): ReactElement => {
    const ariaLabel = useI18n('wcag.toolbar.settings.label');

    return (
        <Toolbar data-component={SETTINGS_BROWSE_TOOLBAR_NAME}>
            <Toolbar.Container
                aria-label={ariaLabel}
                className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2 border-b border-bdr-soft"
            >
                <ActionGroup>
                    {actions.map((action) => (
                        <ToolbarActionButton key={action.getLabel()} action={action} />
                    ))}
                </ActionGroup>
            </Toolbar.Container>
        </Toolbar>
    );
};

SettingsBrowseToolbar.displayName = SETTINGS_BROWSE_TOOLBAR_NAME;

//
// * Legacy
//

export class SettingsBrowseToolbarElement extends LegacyElement<typeof SettingsBrowseToolbar, SettingsBrowseToolbarProps> {
    constructor(settingsTreeActions: SettingsTreeActions) {
        super({actions: settingsTreeActions.getAllActions()}, SettingsBrowseToolbar);
    }
}
