import { ContextMenu } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, type ReactNode } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import {
    $settingsActions,
    executeSettingsAction,
    SETTINGS_ACTIONS,
    type SettingsAction,
    type SettingsActionState,
} from '../model/settingsActions.store';

const SETTINGS_TREE_CONTEXT_MENU_NAME = 'SettingsTreeContextMenu';

type SettingsTreeContextMenuItemProps = {
    action: SettingsAction;
    state: SettingsActionState;
};

const SettingsTreeContextMenuItem = ({ action, state }: SettingsTreeContextMenuItemProps): ReactElement | null => {
    const label = useI18n(action.labelKey);

    if (!state.visible) return null;

    return (
        <ContextMenu.Item disabled={!state.enabled} onSelect={() => executeSettingsAction(action.id)}>
            {label}
        </ContextMenu.Item>
    );
};

SettingsTreeContextMenuItem.displayName = 'SettingsTreeContextMenuItem';

export type SettingsTreeContextMenuProps = {
    children: ReactNode;
};

export const SettingsTreeContextMenu = ({ children }: SettingsTreeContextMenuProps): ReactElement => {
    const actions = useStore($settingsActions);

    return (
        <ContextMenu data-component={SETTINGS_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger className="h-full">{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-36">
                    {SETTINGS_ACTIONS.map((action) => (
                        <SettingsTreeContextMenuItem key={action.id} action={action} state={actions[action.id]} />
                    ))}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

SettingsTreeContextMenu.displayName = SETTINGS_TREE_CONTEXT_MENU_NAME;
