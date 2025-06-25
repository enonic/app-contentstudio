import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContextMenu} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, ReactNode} from 'react';
import {useAction} from '../../../hooks/useAction';
import {$currentItems} from '../../../store/contentTreeSelection.store';

export type ContentTreeContextMenuProps = {
    actions: Record<string, Action>;
    children: ReactNode;
};

const CONTENT_TREE_CONTEXT_MENU_NAME = 'ContentTreeContextMenu';

export const ContentTreeContextMenu = ({children, actions = {}}: ContentTreeContextMenuProps): ReactElement => {
    const item = useStore($currentItems)[0];

    const hasActions = Object.keys(actions).length > 0;
    const publishAction = actions.publishAction;
    const unpublishAction = actions.unpublishAction;
    const otherActions = Object.entries(actions)
        .filter(([actionName]) => actionName !== 'publishAction' && actionName !== 'unpublishAction');

    if (!hasActions) {
        return <>{children}</>;
    }

    return (
        <ContextMenu data-component={CONTENT_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger className="h-full">{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-36">
                    {otherActions.map(([actionName, action]) => (
                        <ContentTreeContextMenuAction key={actionName} action={action} />
                    ))}

                    {item?.isPublished() && unpublishAction && (
                        <ContentTreeContextMenuAction key="unpublishAction" action={unpublishAction} />
                    )}

                    {!item?.isPublished() && publishAction && (
                        <ContentTreeContextMenuAction key="publishAction" action={publishAction} />
                    )}
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

ContentTreeContextMenuAction.displayName = 'ContentTreeContextMenuAction';
