import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button, Toolbar} from '@enonic/ui';
import {ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ToolbarActionButton} from './ToolbarActionButton';
import {ActionGroup} from './ActionGroup';
import {ContextToggle} from './ContextToggle';
import {SearchToggle} from './SearchToggle';

type Props = {
    toggleFilterPanelAction: Action;
    showNewDialogAction: Action;
    editAction: Action;
    archiveAction: Action;
    duplicateAction: Action;
    moveAction: Action;
    sortAction: Action;
    publishAction: Action;
    unpublishAction: Action;
    publishTreeAction: Action;
    markAsReadyAction: Action;
    requestPublishAction: Action;
    createIssueAction: Action;
};

export const BrowseToolbar = ({
    toggleFilterPanelAction,
    showNewDialogAction,
    editAction,
    archiveAction,
    duplicateAction,
    moveAction,
    sortAction,
}: Props): ReactElement => {
    return (
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2 border-b border-bdr-soft"
            >
                <SearchToggle action={toggleFilterPanelAction} />
                <ActionGroup>
                    <ToolbarActionButton action={showNewDialogAction} />
                    <ToolbarActionButton action={editAction} />
                    <ToolbarActionButton action={archiveAction} />
                    <ToolbarActionButton action={duplicateAction} />
                    <ToolbarActionButton action={moveAction} />
                    <ToolbarActionButton action={sortAction} />
                </ActionGroup>
                <div className="flex-1" />
                <ContextToggle />
            </Toolbar.Container>
        </Toolbar>
    );
};

BrowseToolbar.displayName = 'BrowseToolbar';

export class BrowseToolbarElement extends LegacyElement<typeof BrowseToolbar, Props> {
    constructor(props: Props) {
        super(props, BrowseToolbar);
    }
}
