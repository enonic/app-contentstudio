import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import {
    $contextPanelMode,
    $isContentFilterOpen,
    $isContextOpen,
    $isMobilePreviewOpen,
} from '../../shared/app-state/browsePanels.store';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { LegacyElement } from '../../shared/ui/LegacyElement';
import { ContextToggle } from './ContextToggle';
import { OverflowActionRow, type OverflowActionRowItem } from './OverflowActionRow';
import { PreviewToggle } from './PreviewToggle';
import { SearchToggle } from './SearchToggle';
import { SplitActionButton } from './SplitActionButton';

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
    mobileContextWidgetSelectorTargetRef: (target: HTMLDivElement | null) => void;
    mobilePreviewVersionHistoryButton: ReactElement;
    mobilePreviewWidgetSelector: ReactElement;
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
    mobileContextWidgetSelectorTargetRef,
    mobilePreviewVersionHistoryButton,
    mobilePreviewWidgetSelector,
}: Props): ReactElement => {
    const mode = useStore($contextPanelMode);
    const isPreviewOpen = useStore($isMobilePreviewOpen);
    const isContextOpen = useStore($isContextOpen);
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const isMobileMode = mode === 'mobile';
    const showMobilePreview = isMobileMode && isPreviewOpen;
    const showMobileContext = isMobileMode && isContextOpen;
    const actionsLabel = useI18n('action.actions');
    const toolbarActions: OverflowActionRowItem[] = useMemo(
        () => [
            { id: 'new', action: showNewDialogAction },
            { id: 'edit', action: editAction },
            { id: 'archive', action: archiveAction },
            { id: 'duplicate', action: duplicateAction },
            { id: 'move', action: moveAction },
            { id: 'sort', action: sortAction },
            { id: 'preview', action: previewAction },
        ],
        [archiveAction, duplicateAction, editAction, moveAction, previewAction, showNewDialogAction, sortAction],
    );
    const publishSplitActions: Action[] = [
        markAsReadyAction,
        publishAction,
        publishTreeAction,
        unpublishAction,
        requestPublishAction,
        createIssueAction,
    ];
    const mobileSplitActions: Action[][] = [toolbarActions.map(({ action }) => action), publishSplitActions];

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-2.25 max-sm:pr-4 sm:px-5 py-2 flex items-center gap-2.5 sm:gap-2 border-b border-bdr-soft"
            >
                <div
                    ref={mobileContextWidgetSelectorTargetRef}
                    className={showMobileContext ? 'min-w-0 flex-1 self-stretch' : 'hidden'}
                />
                {showMobilePreview ? (
                    <>
                        {mobilePreviewVersionHistoryButton}
                        <div className="ml-3.5 min-w-0 flex-1" />
                        {mobilePreviewWidgetSelector}
                    </>
                ) : showMobileContext ? null : (
                    <>
                        <div
                            className={
                                isMobileMode
                                    ? 'flex min-w-fit items-center gap-2'
                                    : 'flex min-w-0 flex-1 items-center gap-2'
                            }
                        >
                            <SearchToggle action={toggleFilterPanelAction} />
                            {isMobileMode ? (
                                <div className="shrink-0 min-w-fit">
                                    {!isContentFilterOpen && (
                                        <SplitActionButton actions={mobileSplitActions} menuOnlyLabel={actionsLabel} />
                                    )}
                                </div>
                            ) : (
                                <OverflowActionRow actions={toolbarActions} className="flex min-w-0 flex-1" />
                            )}
                        </div>
                        {isMobileMode ? (
                            <div className="flex-1" />
                        ) : (
                            <div className="flex shrink-0 min-w-fit">
                                <SplitActionButton actions={[publishSplitActions]} />
                            </div>
                        )}
                    </>
                )}
                <PreviewToggle className="shrink-0 size-7.5 sm:size-9" />
                <ContextToggle className="shrink-0 size-7.5 sm:size-9" tooltipClassName="max-md:hidden" />
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
