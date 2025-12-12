import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContextMenu} from '@enonic/ui';
import {ReactElement, ReactNode} from 'react';
import {useAction} from '../../../hooks/useAction';

export type ContentTreeContextMenuProps = {
    actions: Action[];
    children: ReactNode;
};

const CONTENT_TREE_CONTEXT_MENU_NAME = 'ContentTreeContextMenu';

export const ContentTreeContextMenu = ({children, actions = []}: ContentTreeContextMenuProps): ReactElement => {
    if (actions.length === 0) {
        return <>{children}</>;
    }

    return (
        <ContextMenu data-component={CONTENT_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className='min-w-36'>
                    {actions.map((action) => (
                        <ContentTreeContextMenuAction key={action.getLabel()} action={action} />
                    ))}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

ContentTreeContextMenu.displayName = CONTENT_TREE_CONTEXT_MENU_NAME;

const ContentTreeContextMenuAction = ({action}: {action: Action}): ReactElement => {
    const {label, enabled, execute} = useAction(action);

    return (
        <ContextMenu.Item disabled={!enabled} onSelect={execute}>
            {label}
        </ContextMenu.Item>
    );
};
