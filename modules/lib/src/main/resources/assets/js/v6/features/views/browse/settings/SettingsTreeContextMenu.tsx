import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContextMenu} from '@enonic/ui';
import {ReactElement, ReactNode} from 'react';
import {useAction} from '../../../hooks/useAction';

export type SettingsTreeContextMenuProps = {
    actions: Action[];
    children: ReactNode;
};

const SETTINGS_TREE_CONTEXT_MENU_NAME = 'SettingsTreeContextMenu';

export const SettingsTreeContextMenu = ({children, actions = []}: SettingsTreeContextMenuProps): ReactElement => {
    const hasActions = actions.length > 0;

    if (!hasActions) {
        return <>{children}</>;
    }

    return (
        <ContextMenu data-component={SETTINGS_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger className="h-full">{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-36">
                    {actions.map((action) => (
                        <SettingsTreeContextMenuAction key={action.getLabel()} action={action} />
                    ))}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

SettingsTreeContextMenu.displayName = SETTINGS_TREE_CONTEXT_MENU_NAME;

const SettingsTreeContextMenuAction = ({action}: {action: Action}): ReactElement | null => {
    const {label, enabled, visible, execute} = useAction(action);

    if (!visible) {
        return null;
    }

    return (
        <ContextMenu.Item disabled={!enabled} onSelect={execute}>
            {label}
        </ContextMenu.Item>
    );
};

SettingsTreeContextMenuAction.displayName = 'SettingsTreeContextMenuAction';
