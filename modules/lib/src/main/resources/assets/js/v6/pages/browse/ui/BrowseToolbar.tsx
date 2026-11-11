import { Toolbar } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import {
    $contextPanelMode,
    $isContentFilterOpen,
    $isContextOpen,
    $isMobilePreviewOpen,
} from '../../../shared/app-state/browsePanels.store';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { LegacyElement } from '../../../shared/ui/LegacyElement';
import { ContextToggle } from '../../../widgets/browse-toolbar/ContextToggle';
import { OverflowActionRow, type OverflowActionRowItem } from '../../../widgets/browse-toolbar/OverflowActionRow';
import { PreviewToggle } from '../../../widgets/browse-toolbar/PreviewToggle';
import { SearchToggle } from '../../../widgets/browse-toolbar/SearchToggle';
import { SplitActionButton } from '../../../widgets/browse-toolbar/SplitActionButton';
import { WidgetsSelectorMenu } from '../../../widgets/context-panel/widget/WidgetsSelector';
import { CurrentPreviewToolbarVersionHistoryItem } from '../../../widgets/preview-panel/ui/PreviewToolbarVersionHistoryItem';
import { PreviewToolbarWidgetSelector } from '../../../widgets/preview-panel/ui/PreviewToolbarWidgetSelector';
import { executeBrowseAction } from '../model/browseActions.commands';
import { $browseActions, type BrowseActionId } from '../model/browseActions.store';
import { useBrowseToolbarActions } from './useBrowseToolbarActions';

const ROW_ACTION_IDS: readonly BrowseActionId[] = ['new', 'edit', 'archive', 'duplicate', 'move', 'sort', 'preview'];

const PUBLISH_ACTION_IDS: readonly BrowseActionId[] = [
    'markAsReady',
    'publish',
    'publishTree',
    'unpublish',
    'requestPublish',
    'createIssue',
];

const PRIMARY_RANKS: Partial<Record<BrowseActionId, number>> = { new: 2, preview: 1 };

const toggleSearch = (): void => executeBrowseAction('search');

export const BrowseToolbar = (): ReactElement => {
    const mode = useStore($contextPanelMode);
    const isPreviewOpen = useStore($isMobilePreviewOpen);
    const isContextOpen = useStore($isContextOpen);
    const isContentFilterOpen = useStore($isContentFilterOpen);
    const isMobileMode = mode === 'mobile';
    const showMobilePreview = isMobileMode && isPreviewOpen;
    const showMobileContext = isMobileMode && isContextOpen;
    const actionsLabel = useI18n('action.actions');
    const isSearchEnabled = useStore($browseActions).search.enabled;
    const rowActions = useBrowseToolbarActions(ROW_ACTION_IDS);
    const publishSplitActions = useBrowseToolbarActions(PUBLISH_ACTION_IDS);
    const toolbarActions: OverflowActionRowItem[] = useMemo(
        () => rowActions.map((action) => ({ ...action, primaryRank: PRIMARY_RANKS[action.id] })),
        [rowActions],
    );
    const mobileSplitActions = useMemo(
        () => [toolbarActions, publishSplitActions],
        [publishSplitActions, toolbarActions],
    );
    const desktopSplitActions = useMemo(() => [publishSplitActions], [publishSplitActions]);

    return (
        <Toolbar>
            <Toolbar.Container
                aria-label={useI18n('aria.browser.toolbar.label')}
                className="bg-surface-neutral h-15 px-3.5 max-sm:pr-4 sm:px-5 py-2 flex items-center gap-2.5 sm:gap-2 border-b border-bdr-soft"
            >
                {showMobileContext && <WidgetsSelectorMenu className="min-w-0 flex-1 self-stretch" />}
                {showMobilePreview ? (
                    <>
                        <CurrentPreviewToolbarVersionHistoryItem />
                        <div className="ml-3.5 min-w-0 flex-1" />
                        <PreviewToolbarWidgetSelector compact />
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
                            <SearchToggle onToggle={toggleSearch} disabled={!isSearchEnabled} />
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
                                <SplitActionButton actions={desktopSplitActions} />
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

export class BrowseToolbarElement extends LegacyElement<typeof BrowseToolbar> {
    constructor() {
        super({}, BrowseToolbar);
    }
}
