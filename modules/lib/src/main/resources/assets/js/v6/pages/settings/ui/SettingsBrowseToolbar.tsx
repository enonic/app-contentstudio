import { Button, Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { ActionGroup } from '../../../widgets/browse-toolbar/ActionGroup';
import {
    $settingsActions,
    executeSettingsAction,
    SETTINGS_ACTIONS,
    type SettingsAction,
    type SettingsActionState,
} from '../model/settingsActions.store';

const SETTINGS_BROWSE_TOOLBAR_NAME = 'SettingsBrowseToolbar';

type SettingsActionButtonProps = {
    action: SettingsAction;
    state: SettingsActionState;
};

const SettingsActionButton = ({ action, state }: SettingsActionButtonProps): ReactElement | null => {
    const label = useI18n(action.labelKey);

    if (!state.visible) return null;

    return (
        <Toolbar.Item asChild disabled={!state.enabled}>
            <Button size="sm" label={label} onClick={() => executeSettingsAction(action.id)} />
        </Toolbar.Item>
    );
};

SettingsActionButton.displayName = 'SettingsActionButton';

export const SettingsBrowseToolbar = (): ReactElement => {
    const actions = useStore($settingsActions);
    const ariaLabel = useI18n('wcag.toolbar.settings.label');

    return (
        <Toolbar data-component={SETTINGS_BROWSE_TOOLBAR_NAME}>
            <Toolbar.Container
                aria-label={ariaLabel}
                className="bg-surface-neutral h-15 px-3.5 py-2 flex items-center gap-2 border-b border-bdr-soft"
            >
                <ActionGroup>
                    {SETTINGS_ACTIONS.map((action) => (
                        <SettingsActionButton key={action.id} action={action} state={actions[action.id]} />
                    ))}
                </ActionGroup>
            </Toolbar.Container>
        </Toolbar>
    );
};

SettingsBrowseToolbar.displayName = SETTINGS_BROWSE_TOOLBAR_NAME;
