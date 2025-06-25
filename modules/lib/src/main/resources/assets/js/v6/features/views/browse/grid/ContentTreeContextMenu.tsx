import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContextMenu} from '@enonic/ui';
import {ReactElement, ReactNode} from 'react';
import {useAction} from '../../../hooks/useAction';
import {getSelectedItems} from '../../../store/contentTreeSelectionStore';

export type ContentTreeContextMenuProps = {
    actions: Record<string, Action>;
    children: ReactNode;
};

const CONTENT_TREE_CONTEXT_MENU_NAME = 'ContentTreeContextMenu';

export const ContentTreeContextMenu = ({children, actions = {}}: ContentTreeContextMenuProps): ReactElement => {
    const selectedItem = getSelectedItems()?.[0];

    if (!selectedItem || Object.keys(actions).length === 0) {
        return <>{children}</>;
    }

    const publishAction = actions?.publishAction;

    const unpublishAction = actions?.unpublishAction;

    const otherActions = Object.entries(actions)
        .filter(([actionName, _]) => actionName !== 'publishAction' && actionName !== 'unpublishAction')
        .map(([_, action]) => action);

    return (
        <ContextMenu data-component={CONTENT_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-36">
                    {otherActions.map((action) => (
                        <ContentTreeContextMenuAction key={action.getLabel()} action={action} />
                    ))}

                    {selectedItem.isPublished() && unpublishAction && (
                        <ContentTreeContextMenuAction key={unpublishAction.getLabel()} action={unpublishAction} />
                    )}

                    {!selectedItem.isPublished() && publishAction && (
                        <ContentTreeContextMenuAction key={publishAction.getLabel()} action={publishAction} />
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
