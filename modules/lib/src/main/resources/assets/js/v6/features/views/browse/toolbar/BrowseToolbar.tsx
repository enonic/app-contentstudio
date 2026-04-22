import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {Toolbar} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {LegacyElement} from '../../../shared/LegacyElement';
import {ContextToggle} from './ContextToggle';
import {OverflowActionRow, type OverflowActionRowItem} from './OverflowActionRow';
import {SearchToggle} from './SearchToggle';
import {SplitActionButton, type SplitActionButtonAction} from './SplitActionButton';

type Props = {
    toggleFilterPanelAction: Action;
    showNewDialogAction: Action;
    editAction: Action;
    archiveAction: Action;
    duplicateAction: Action;
    moveAction: Action;
    sortAction: Action;
    previewAction: Action;
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
    previewAction,
    publishAction,
    unpublishAction,
    publishTreeAction,
    markAsReadyAction,
    requestPublishAction,
    createIssueAction,
}: Props): ReactElement => {
    const toolbarActions: OverflowActionRowItem[] = useMemo(() => [
        {id: 'new', action: showNewDialogAction},
        {id: 'edit', action: editAction},
        {id: 'archive', action: archiveAction},
        {id: 'duplicate', action: duplicateAction},
        {id: 'move', action: moveAction},
        {id: 'sort', action: sortAction},
        {id: 'preview', action: previewAction},
    ], [archiveAction, duplicateAction, editAction, moveAction, previewAction, showNewDialogAction, sortAction]);
    const publishSplitActions: SplitActionButtonAction[] = [
        {action: markAsReadyAction},
        {action: publishAction},
        {action: publishTreeAction},
        {action: unpublishAction},
        {action: requestPublishAction},
        {action: createIssueAction},
    ];
    const mobileSplitActions: SplitActionButtonAction[] = [
        ...toolbarActions.map(({action}) => ({action})),
        ...publishSplitActions,
    ];

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-5 py-2 flex items-center gap-2 border-b border-bdr-soft"
            >
                <div className="flex min-w-fit items-center gap-2 sm:min-w-0 sm:flex-1">
                    <SearchToggle action={toggleFilterPanelAction} />
                    <div className="sm:hidden shrink-0 min-w-fit">
                        <SplitActionButton
                            actions={mobileSplitActions}
                            triggerClassName='mr-1.5 sm:mr-0 w-6 sm:size-9'
                        />
                    </div>
                    <OverflowActionRow actions={toolbarActions} className="hidden sm:flex min-w-0 flex-1" />
                </div>
                <div className="flex-1 sm:hidden" />
                <div className="hidden sm:flex shrink-0 min-w-fit">
                    <SplitActionButton actions={publishSplitActions} />
                </div>
                <ContextToggle className="shrink-0" />
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
