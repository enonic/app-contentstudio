import { Button, type ButtonProps, cn, I18nProvider, Toggle, Tooltip } from '@enonic/ui';
import { ThemeSwitcher } from '@enonic/ui-kit';
import { useStore } from '@nanostores/preact';
import { ArrowLeftRight, BellDotIcon, BellIcon, Menu, X } from 'lucide-react';
import { computed } from 'nanostores';
import { forwardRef, type ReactElement } from 'react';
import { ShowIssuesDialogEvent } from '../../../app/browse/ShowIssuesDialogEvent';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { translate } from '../../shared/i18n';
import { $activeProject, $activeProjectName, $hasMultipleProjects, $noProjectMode } from '../../entities/project';
import { setProjectSelectionDialogOpen } from '../../shared/dialogs/dialogs.store';
import { ProjectIcon } from '../../shared/ui/icons/ProjectIcon';
import { $issuesStats } from '../../entities/issue';
import {
    $activeWidget,
    isContentBrowseWidget,
    isSettingsWidget,
} from '../../widgets/context-panel/model/sidebarWidgets.store';
import type { IssueStatsJson } from '../../entities/issue/api/IssueStatsJson';
import { BROWSE_SIDEBAR_ID, BROWSE_SIDEBAR_TOGGLE_ID } from './browseSidebar.constants';
import { $isBrowseSidebarOpen, setBrowseSidebarOpen } from './model/browseSidebar.store';

const $widgetState = computed($activeWidget, (activeWidget) => ({
    appName: activeWidget?.getDisplayName() ?? '',
    isContentBrowseActive: activeWidget == null || isContentBrowseWidget(activeWidget),
    isSettingsActive: isSettingsWidget(activeWidget),
    hasProjectContext: activeWidget == null || activeWidget.getConfig().getProperty('context') === 'project',
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

const BROWSE_APP_BAR_NAME = 'BrowseAppBar';

// The tooltip repeats this button's accessible name rather than providing a separate description.
const IssuesButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <Button {...props} ref={ref} aria-describedby={undefined} />
));

IssuesButton.displayName = 'IssuesButton';

export const BrowseAppBar = (): ReactElement => {
    const isSidebarOpen = useStore($isBrowseSidebarOpen);
    const { sm } = useBreakpoints();
    const activeProject = useStore($activeProject);
    const activeProjectName = useStore($activeProjectName);
    const activeProjectIcon = activeProject?.getIcon();
    const noProjectMode = useStore($noProjectMode);
    const hasMultipleProjects = useStore($hasMultipleProjects);
    const { appName, isContentBrowseActive, isSettingsActive, hasProjectContext } = useStore($widgetState);
    const { stats } = useStore($issuesStats);
    const applicationName = useI18n('admin.tool.displayName');
    const issuesStatsLabel = useI18n(...createIssuesLabelKeys(stats));
    const projectAriaLabel = useI18n('wcag.appbar.project.label');
    const issuesAriaLabel = useI18n('wcag.appbar.issues.label');
    const sidebarLabel = useI18n(isSidebarOpen ? 'tooltip.sidebar.close' : 'tooltip.sidebar.open');
    const isMobileSidebarOpen = !sm && isSidebarOpen;
    const showProjectTitle = !noProjectMode && isContentBrowseActive;
    const mobileTitle = showProjectTitle ? activeProjectName : appName || applicationName;

    return (
        <header
            data-component={BROWSE_APP_BAR_NAME}
            className="bg-surface-neutral h-15 px-3.5 sm:pl-5 py-2 pr-24 flex items-center gap-2 sm:gap-2.5 border-b border-bdr-soft"
        >
            <Toggle
                id={BROWSE_SIDEBAR_TOGGLE_ID}
                className={cn(
                    'data-[active=true]:text-main active:text-main relative z-20 size-9 shrink-0 p-0 active:bg-transparent data-[active=true]:bg-transparent sm:hidden',
                    !hasMultipleProjects && 'max-sm:mr-auto',
                )}
                size="md"
                aria-label={sidebarLabel}
                aria-controls={BROWSE_SIDEBAR_ID}
                aria-expanded={isSidebarOpen}
                pressed={isSidebarOpen}
                onPressedChange={setBrowseSidebarOpen}
            >
                <span className="relative size-5" aria-hidden="true">
                    <X
                        className={cn(
                            'absolute inset-0 size-5 transition-[opacity,transform] duration-750 ease-out motion-reduce:transition-none',
                            isSidebarOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-75 opacity-0',
                        )}
                        strokeWidth={1.5}
                    />
                    <Menu
                        className={cn(
                            'absolute inset-0 size-5 transition-[opacity,transform] duration-750 ease-out motion-reduce:transition-none',
                            isSidebarOpen ? '-rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100',
                        )}
                        strokeWidth={1.5}
                    />
                </span>
            </Toggle>

            <div className="contents" inert={isMobileSidebarOpen} aria-hidden={isMobileSidebarOpen || undefined}>
                <Tooltip
                    delay={300}
                    value={mobileTitle}
                    disabled={sm}
                    className="max-w-28 whitespace-normal break-words"
                >
                    <h1
                        tabIndex={0}
                        className="mr-auto min-w-0 truncate rounded-sm font-semibold sm:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                        {showProjectTitle && (
                            <span className="hidden max-[400px]:block" aria-hidden="true">
                                <ProjectIcon
                                    projectName={activeProject?.getName()}
                                    language={activeProject?.getLanguage()}
                                    hasIcon={!!activeProjectIcon}
                                    iconHash={activeProjectIcon?.getSha512()}
                                    isLayer={activeProject?.hasParents()}
                                    className="size-7.5"
                                />
                            </span>
                        )}
                        <span className={cn(showProjectTitle && 'max-[400px]:sr-only')}>{mobileTitle}</span>
                    </h1>
                </Tooltip>

                {!noProjectMode && hasProjectContext ? (
                    <Tooltip
                        delay={300}
                        value={activeProjectName}
                        disabled={!sm}
                        className="max-w-xs whitespace-normal break-words"
                    >
                        {hasMultipleProjects ? (
                            <Button
                                data-project-display-name={activeProject?.getDisplayName()}
                                className="mr-auto min-w-0 max-sm:hidden"
                                size="sm"
                                endIcon={ArrowLeftRight}
                                endIconClassName="shrink-0 size-3.5"
                                onClick={() => setProjectSelectionDialogOpen(true)}
                                aria-label={`${activeProjectName}, ${projectAriaLabel}`}
                            >
                                <span className="block min-w-0 truncate">{activeProjectName}</span>
                            </Button>
                        ) : (
                            <span
                                data-project-display-name={activeProject?.getDisplayName()}
                                tabIndex={0}
                                className="mr-auto min-w-0 truncate rounded-sm px-3.5 text-sm font-semibold max-sm:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            >
                                {activeProjectName}
                            </span>
                        )}
                    </Tooltip>
                ) : (
                    <h1
                        title={appName || applicationName}
                        className="mr-auto hidden min-w-0 truncate text-2xl font-semibold sm:block"
                    >
                        {appName || applicationName}
                    </h1>
                )}

                {showProjectTitle && (
                    <Tooltip delay={300} value={issuesStatsLabel} className="max-w-48 whitespace-normal break-words">
                        <IssuesButton
                            className="shrink-0 max-sm:size-9 max-sm:p-0"
                            size="sm"
                            startIcon={stats?.open > 0 ? BellDotIcon : BellIcon}
                            startIconClassName="shrink-0 max-sm:size-5"
                            onClick={() => {
                                new ShowIssuesDialogEvent().fire();
                            }}
                            aria-label={`${issuesStatsLabel}, ${issuesAriaLabel}`}
                        >
                            <span className="max-sm:hidden">{issuesStatsLabel}</span>
                        </IssuesButton>
                    </Tooltip>
                )}

                {isSettingsActive && (
                    <I18nProvider translate={translate}>
                        <ThemeSwitcher className="shrink-0" />
                    </I18nProvider>
                )}
            </div>
        </header>
    );
};

BrowseAppBar.displayName = BROWSE_APP_BAR_NAME;
