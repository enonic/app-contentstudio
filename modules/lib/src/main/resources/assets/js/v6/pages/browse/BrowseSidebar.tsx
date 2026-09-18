import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { Store } from '@enonic/lib-admin-ui/store/Store';
import { cn, IconButton, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { ArrowLeftRight, type LucideIcon, Pen, Settings } from 'lucide-react';
import { type ReactElement, useCallback, useEffect } from 'react';
import { setProjectSelectionDialogOpen } from '../../shared/dialogs/dialogs.store';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { DefaultProjectIcon } from '../../shared/ui/icons/DefaultProjectIcon';
import { ProjectIcon } from '../../shared/ui/icons/ProjectIcon';
import { LegacyElement } from '../../shared/ui/LegacyElement';
import { WidgetButton } from '../../shared/ui/WidgetButton';
import { $activeProject, $activeProjectName, $hasMultipleProjects, $noProjectMode } from '../../entities/project';
import { $config } from '../../shared/config';
import { BROWSE_SIDEBAR_ID, BROWSE_SIDEBAR_TOGGLE_ID } from './browseSidebar.constants';
import { $isBrowseSidebarOpen, setBrowseSidebarOpen } from './model/browseSidebar.store';
import {
    $sidebarWidgets,
    getSettingsWidget,
    getWidgetKey,
    isContentBrowseWidget,
    isSettingsWidget,
    setActiveWidget,
} from '../../widgets/context-panel/model/sidebarWidgets.store';

function getWidgetIcon(widget: Readonly<Extension>): LucideIcon | undefined {
    if (isContentBrowseWidget(widget)) {
        return Pen;
    }
    if (isSettingsWidget(widget)) {
        return Settings;
    }
    return undefined;
}

function stripVersionSuffix(version: string): string {
    return version.match(/^\d+\.\d+\.\d+/)?.[0] ?? version;
}

export const BrowseSidebar = (): ReactElement => {
    const isOpen = useStore($isBrowseSidebarOpen);
    const activeProjectName = useStore($activeProjectName);
    const hasMultipleProjects = useStore($hasMultipleProjects);
    const projectAriaLabel = useI18n('wcag.appbar.project.label');
    const { sm } = useBreakpoints();
    const activeProject = useStore($activeProject);
    const noProjectMode = useStore($noProjectMode);
    const { widgets, activeWidgetId } = useStore($sidebarWidgets);
    const applicationName = Store.instance().get('application').getName();
    const { appVersion } = useStore($config, { keys: ['appVersion'] });
    const version = `v${stripVersionSuffix(appVersion)}`;
    const mainWidgets = noProjectMode ? [] : widgets.slice(0, -1);
    const footerWidget = noProjectMode ? getSettingsWidget(widgets) : widgets.at(-1);
    const isFooterWidgetActive = !!footerWidget && getWidgetKey(footerWidget) === activeWidgetId;
    const sidebarLabel = useI18n('wcag.sidebar.label');
    const isMobileSidebarClosed = !sm && !isOpen;
    const activeProjectIcon = activeProject?.getIcon();

    const closeSidebar = useCallback((): void => {
        setBrowseSidebarOpen(false);
        document.getElementById(BROWSE_SIDEBAR_TOGGLE_ID)?.focus();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                closeSidebar();
            }
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [closeSidebar, isOpen]);

    useEffect(() => {
        if (sm && isOpen) {
            setBrowseSidebarOpen(false);
        }
    }, [isOpen, sm]);

    return (
        <>
            {isOpen && !sm && (
                <div
                    className="fixed inset-0 z-10 bg-overlay backdrop-blur-xs"
                    aria-hidden="true"
                    onPointerDown={closeSidebar}
                />
            )}
            <nav
                id={BROWSE_SIDEBAR_ID}
                className={cn(
                    'bg-surface-neutral absolute z-20 flex h-dvh w-[clamp(220px,100%_-_100px,340px)] flex-col items-start gap-3 border-r border-t-0 border-bdr-soft px-3.5 pt-3 max-sm:transition-transform max-sm:duration-250 max-sm:ease-out motion-reduce:transition-none',
                    'sm:z-auto sm:w-15 sm:translate-x-0 sm:items-center sm:gap-10 sm:px-1.75 sm:py-2.5 sm:pointer-events-auto',
                    isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
                )}
                aria-label={sidebarLabel}
                aria-hidden={isMobileSidebarClosed || undefined}
                inert={isMobileSidebarClosed}
            >
                <div className="flex ml-11 self-stretch items-center sm:hidden">
                    <h1 title={activeProjectName} className="block font-semibold min-w-0 truncate">
                        {activeProjectName}
                    </h1>
                    {hasMultipleProjects && (
                        <IconButton
                            className="ml-auto shrink-0"
                            size="sm"
                            icon={ArrowLeftRight}
                            iconSize={20}
                            onClick={() => setProjectSelectionDialogOpen(true)}
                            aria-label={projectAriaLabel}
                        />
                    )}
                </div>
                <div className="hidden sm:contents">
                    {noProjectMode ? (
                        <DefaultProjectIcon className="size-7.5 sm:size-8 flex-shrink-0 sm:my-1.75 sm:ml-0" />
                    ) : (
                        <ProjectIcon
                            projectName={activeProject?.getName()}
                            language={activeProject?.getLanguage()}
                            hasIcon={!!activeProjectIcon}
                            iconHash={activeProjectIcon?.getSha512()}
                            className="max-sm:size-7.5 flex-shrink-0 sm:my-1.75 sm:ml-0"
                        />
                    )}
                </div>
                <h1
                    title={applicationName}
                    className="my-1.5 max-w-full overflow-hidden text-ellipsis text-right text-nowrap text-base font-semibold sm:my-0 sm:ml-0 sm:max-w-none sm:overflow-visible sm:text-left sm:text-clip sm:[writing-mode:vertical-lr] max-sm:hidden"
                >
                    {applicationName}
                </h1>
                <div className="flex h-full w-full max-w-full flex-col justify-between sm:w-auto">
                    {/* Widgets */}
                    <div className="flex flex-col items-start sm:items-center sm:gap-2">
                        {mainWidgets.map((widget) => {
                            const widgetKey = getWidgetKey(widget);

                            return (
                                <WidgetButton
                                    key={widgetKey}
                                    label={widget.getDisplayName()}
                                    icon={getWidgetIcon(widget)}
                                    active={widgetKey === activeWidgetId}
                                    iconUrl={widget.getIconUrl() && widget.getFullIconUrl()}
                                    tooltipClassName="max-sm:hidden"
                                    onClick={() => {
                                        setActiveWidget(widget);
                                        closeSidebar();
                                    }}
                                />
                            );
                        })}
                    </div>
                    {/* Footer */}
                    <div className="flex gap-1 sm:flex-col">
                        {footerWidget && (
                            <WidgetButton
                                label={footerWidget.getDisplayName()}
                                active={isFooterWidgetActive}
                                icon={getWidgetIcon(footerWidget)}
                                iconUrl={footerWidget.getIconUrl() && footerWidget.getFullIconUrl()}
                                mobileTrailing={
                                    <span
                                        className={cn(
                                            'block max-w-[40px] overflow-hidden text-right text-xs font-normal text-nowrap text-ellipsis',
                                            !isFooterWidgetActive && 'text-subtle',
                                        )}
                                        aria-hidden="true"
                                    >
                                        {version}
                                    </span>
                                }
                                onClick={() => {
                                    setActiveWidget(footerWidget);
                                    closeSidebar();
                                }}
                                tooltipClassName="max-sm:hidden"
                            />
                        )}
                        <Tooltip delay={300} value={version} side="right" className="max-sm:hidden">
                            <p
                                aria-label={version}
                                className="max-w-[40px] overflow-hidden text-center text-xs text-nowrap text-ellipsis text-subtle max-sm:hidden"
                            >
                                {version}
                            </p>
                        </Tooltip>
                    </div>
                </div>
            </nav>
        </>
    );
};

BrowseSidebar.displayName = 'BrowseSidebar';

export class BrowseSidebarElement extends LegacyElement<typeof BrowseSidebar> {
    constructor() {
        super({}, BrowseSidebar);
    }
}
