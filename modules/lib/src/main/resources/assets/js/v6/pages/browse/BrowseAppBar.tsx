import { Store } from '@enonic/lib-admin-ui/store/Store';
import { Button, cn, Toggle } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ArrowLeftRight, BellDotIcon, BellIcon, Menu, X } from 'lucide-react';
import { computed } from 'nanostores';
import type { ReactElement } from 'react';
import { ShowIssuesDialogEvent } from '../../../app/browse/ShowIssuesDialogEvent';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { $activeProjectName, $hasMultipleProjects, $noProjectMode } from '../../entities/project';
import { setProjectSelectionDialogOpen } from '../../shared/dialogs/dialogs.store';
import { $issuesStats } from '../../entities/issue';
import { $activeWidget, isMainWidget } from '../../widgets/context-panel/model/sidebarWidgets.store';
import type { IssueStatsJson } from '../../../app/issue/json/IssueStatsJson';
import { LegacyElement } from '../../shared/ui/LegacyElement';
import { BROWSE_SIDEBAR_ID, BROWSE_SIDEBAR_TOGGLE_ID } from './browseSidebar.constants';
import { $isBrowseSidebarOpen, setBrowseSidebarOpen } from './model/browseSidebar.store';

const $widgetState = computed($activeWidget, (activeWidget) => ({
    appName: activeWidget?.getDisplayName() ?? '',
    isIssuesButtonVisible: isMainWidget(activeWidget),
    isProjectSelectorVisible: activeWidget == null || activeWidget.getConfig().getProperty('context') === 'project',
}));

function createIssuesLabelKeys(stats: Readonly<IssueStatsJson> | undefined): [`field.${string}`, ...string[]] {
    if (stats?.openAssignedToMe > 0) {
        return ['field.assignedToMeCount', String(stats.openAssignedToMe)];
    }

    if (stats?.open > 0) {
        return ['field.openIssuesCount', String(stats.open)];
    }

    return ['field.noOpenIssues'];
}

export const BrowseAppBar = (): ReactElement => {
    const isSidebarOpen = useStore($isBrowseSidebarOpen);
    const { sm } = useBreakpoints();
    const activeProjectName = useStore($activeProjectName);
    const noProjectMode = useStore($noProjectMode);
    const hasMultipleProjects = useStore($hasMultipleProjects);
    const { appName, isIssuesButtonVisible, isProjectSelectorVisible } = useStore($widgetState);
    const { stats } = useStore($issuesStats);
    const applicationName = Store.instance().get('application').getName();
    const issuesStatsLabel = useI18n(...createIssuesLabelKeys(stats));
    const projectAriaLabel = useI18n('wcag.appbar.project.label');
    const issuesAriaLabel = useI18n('wcag.appbar.issues.label');
    const sidebarLabel = useI18n(isSidebarOpen ? 'tooltip.sidebar.close' : 'tooltip.sidebar.open');
    const isMobileSidebarOpen = !sm && isSidebarOpen;

    return (
        <header className="bg-surface-neutral h-15 px-3.5 sm:pl-5 py-2 pr-24 flex items-center gap-2.5 border-b border-bdr-soft">
            <Toggle
                id={BROWSE_SIDEBAR_TOGGLE_ID}
                className={cn('relative z-20 size-9 shrink-0 p-0 sm:hidden', !hasMultipleProjects && 'max-sm:mr-auto')}
                size="md"
                aria-label={sidebarLabel}
                aria-controls={BROWSE_SIDEBAR_ID}
                aria-expanded={isSidebarOpen}
                pressed={isSidebarOpen}
                onPressedChange={setBrowseSidebarOpen}
            >
                <span className="relative size-5" aria-hidden="true">
                    {isSidebarOpen ? (
                        <X className="absolute inset-0 size-5" />
                    ) : (
                        <Menu className="absolute inset-0 size-5" />
                    )}
                </span>
            </Toggle>

            <div className="contents" inert={isMobileSidebarOpen} aria-hidden={isMobileSidebarOpen || undefined}>
                {!noProjectMode && isProjectSelectorVisible ? (
                    <Button
                        className={cn('mr-auto min-w-0 disabled:opacity-100', !hasMultipleProjects && 'max-sm:hidden')}
                        size="sm"
                        endIcon={hasMultipleProjects ? ArrowLeftRight : undefined}
                        endIconClassName="shrink-0 size-3.5"
                        onClick={() => setProjectSelectionDialogOpen(true)}
                        aria-label={hasMultipleProjects ? projectAriaLabel : undefined}
                        disabled={!hasMultipleProjects}
                    >
                        <span title={activeProjectName} className="block min-w-0 truncate">
                            {activeProjectName}
                        </span>
                    </Button>
                ) : (
                    <h1 title={appName || applicationName} className="mr-auto min-w-0 truncate text-2xl font-semibold">
                        {appName || applicationName}
                    </h1>
                )}

                {!noProjectMode && isIssuesButtonVisible && (
                    <Button
                        className="max-sm:hidden"
                        size="sm"
                        startIcon={stats?.open > 0 ? BellDotIcon : BellIcon}
                        onClick={() => {
                            new ShowIssuesDialogEvent().fire();
                        }}
                        aria-label={issuesAriaLabel}
                        label={issuesStatsLabel}
                    />
                )}
            </div>
        </header>
    );
};

BrowseAppBar.displayName = 'BrowseAppBar';

export class BrowseAppBarElement extends LegacyElement<typeof BrowseAppBar> {
    constructor() {
        super({}, BrowseAppBar);
    }

    static getInstance(): BrowseAppBarElement {
        let instance: BrowseAppBarElement = Store.instance().get(BrowseAppBarElement.name);

        if (instance == null) {
            instance = new BrowseAppBarElement();
            Store.instance().set(BrowseAppBarElement.name, instance);
        }

        return instance;
    }

    disable() {}
}
