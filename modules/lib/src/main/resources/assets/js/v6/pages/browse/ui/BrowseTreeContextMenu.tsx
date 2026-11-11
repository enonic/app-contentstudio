import { ContextMenu } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, type ReactNode } from 'react';
import { $currentItems } from '../../../entities/content';
import { type BrowseActionId } from '../model/browseActions.store';
import { useBrowseToolbarActions } from './useBrowseToolbarActions';

export type BrowseTreeContextMenuProps = {
    children: ReactNode;
};

const BROWSE_TREE_CONTEXT_MENU_NAME = 'ContentTreeContextMenu';

const MENU_ACTION_IDS: readonly BrowseActionId[] = [
    'new',
    'edit',
    'archive',
    'duplicate',
    'move',
    'sort',
    'preview',
    'publish',
    'unpublish',
];

export const BrowseTreeContextMenu = ({ children }: BrowseTreeContextMenuProps): ReactElement => {
    const items = useStore($currentItems);
    const actions = useBrowseToolbarActions(MENU_ACTION_IDS);
    const hasPublishedItems = items.some((item) => !!item.getPublishFromTime());
    const hasUnpublishedItems = items.some((item) => !item.getPublishFromTime());
    const shownActions = actions.filter(({ id, visible }) => {
        if (!visible) return false;
        if (id === 'publish') return hasUnpublishedItems;
        if (id === 'unpublish') return hasPublishedItems;
        return true;
    });

    return (
        <ContextMenu data-component={BROWSE_TREE_CONTEXT_MENU_NAME}>
            <ContextMenu.Trigger className="h-full">{children}</ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-36">
                    {shownActions.map(({ id, label, enabled, execute }) => (
                        <ContextMenu.Item key={id} disabled={!enabled} onSelect={execute}>
                            {label}
                        </ContextMenu.Item>
                    ))}
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu>
    );
};

BrowseTreeContextMenu.displayName = BROWSE_TREE_CONTEXT_MENU_NAME;
