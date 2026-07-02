import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { ContextMenu } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, type ReactNode } from 'react';
import { useAction } from '../../shared/lib/hooks/useAction';
import { $currentItems } from '../../entities/content';

export type ContentTreeContextMenuProps = {
    actions: Record<string, Action>;
    children: ReactNode;
};

const CONTENT_TREE_CONTEXT_MENU_NAME = 'ContentTreeContextMenu';

export const ContentTreeContextMenu = ({ children, actions = {} }: ContentTreeContextMenuProps): ReactElement => {
    const items = useStore($currentItems);
    const hasPublishedItems = items.some((item) => !!item.getPublishFromTime());
    const hasUnpublishedItems = items.some((item) => !item.getPublishFromTime());
    const hasActions = Object.keys(actions).length > 0;
    const publishAction = actions.publishAction;
    const unpublishAction = actions.unpublishAction;
    const otherActions = Object.entries(actions).filter(
        ([actionName]) => actionName !== 'publishAction' && actionName !== 'unpublishAction',
    );

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

                    {hasUnpublishedItems && publishAction && (
                        <ContentTreeContextMenuAction key="publishAction" action={publishAction} />
                    )}

                    {hasPublishedItems && unpublishAction && (
                        <ContentTreeContextMenuAction key="unpublishAction" action={unpublishAction} />
                    )}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

ContentTreeContextMenu.displayName = CONTENT_TREE_CONTEXT_MENU_NAME;

const ContentTreeContextMenuAction = ({ action }: { action: Action }): ReactElement => {
    const { label, enabled, visible, execute } = useAction(action);

    if (!visible) {
        return null;
    }

    return (
        <ContextMenu.Item disabled={!enabled} onSelect={execute}>
            {label}
        </ContextMenu.Item>
    );
};

ContentTreeContextMenuAction.displayName = 'ContentTreeContextMenuAction';
