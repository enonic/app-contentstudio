import type { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { Store } from '@enonic/lib-admin-ui/store/Store';
import { cn, Tooltip } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type LucideIcon, Pen, Settings } from 'lucide-react';
import { type ReactElement, useCallback, useEffect } from 'react';
import { useBreakpoints } from '../../shared/lib/hooks/useBreakpoints';
import { useI18n } from '../../shared/lib/hooks/useI18n';
import { DefaultProjectIcon } from '../../shared/ui/icons/DefaultProjectIcon';
import { ProjectIcon } from '../../shared/ui/icons/ProjectIcon';
import { LegacyElement } from '../../shared/ui/LegacyElement';
import { WidgetButton } from '../../shared/ui/WidgetButton';
import { $activeProject, $noProjectMode } from '../../entities/project';
import { $config } from '../../shared/config';
import { BROWSE_SIDEBAR_ID, BROWSE_SIDEBAR_TOGGLE_ID } from './browseSidebar.constants';
import { $isBrowseSidebarOpen, setBrowseSidebarOpen } from './model/browseSidebar.store';
import {
    $sidebarWidgets,
    getSettingsWidget,
    getWidgetKey,
    isMainWidget,
    isSettingsWidget,
    setActiveWidget,
} from '../../widgets/context-panel/model/sidebarWidgets.store';

function getWidgetIcon(widget: Readonly<Extension>): LucideIcon | undefined {
    if (isMainWidget(widget)) {
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
    const { sm } = useBreakpoints();
    const activeProject = useStore($activeProject);
    const noProjectMode = useStore($noProjectMode);
    const { widgets, activeWidgetId } = useStore($sidebarWidgets);
    const config = useStore($config, { keys: ['appVersion'] });
    const applicationName = Store.instance().get('application').getName();
    const version = `v${stripVersionSuffix(config.appVersion)}`;
    const settingsWidget = getSettingsWidget(widgets);
    const mainWidgets = noProjectMode ? [] : widgets.slice(0, -1);
    const footerWidget = noProjectMode ? settingsWidget : widgets.at(-1);
    const footerWidgetButtonId = footerWidget ? `browse-sidebar-widget-${getWidgetKey(footerWidget)}` : undefined;
    const sidebarLabel = useI18n('wcag.sidebar.label');
    const isMobileSidebarClosed = !sm && !isOpen;

    const closeSidebar = useCallback((): void => {
        setBrowseSidebarOpen(false);
        document.getElementById(BROWSE_SIDEBAR_TOGGLE_ID)?.focus();
    }, []);

    const isWidgetActive = useCallback(
        (widget: Readonly<Extension> | undefined) => {
            return getWidgetKey(widget) === activeWidgetId;
        },
        [activeWidgetId],
    );

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
                    'bg-surface-neutral absolute z-20 flex h-dvh w-64 flex-col items-start gap-5 border-r border-t-0 border-bdr-soft px-3.5 py-1.75',
                    'sm:z-auto sm:w-15 sm:translate-x-0 sm:items-center sm:gap-10 sm:px-1.75 sm:py-2.5 sm:pointer-events-auto',
                    isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
                )}
                aria-label={sidebarLabel}
                aria-hidden={isMobileSidebarClosed || undefined}
                inert={isMobileSidebarClosed}
            >
                <div className="flex h-11 w-full shrink-0 items-center justify-end sm:contents">
                    {noProjectMode ? (
                        <DefaultProjectIcon className="size-7.5 sm:size-8 flex-shrink-0 sm:my-1.75 sm:ml-0" />
                    ) : (
                        <ProjectIcon
                            projectName={activeProject?.getName()}
                            language={activeProject?.getLanguage()}
                            hasIcon={!!activeProject?.getIcon()}
                            iconHash={activeProject?.getIcon()?.getSha512()}
                            className="max-sm:size-7.5 flex-shrink-0 sm:my-1.75 sm:ml-0"
                        />
                    )}
                </div>
                <h1
                    title={applicationName}
                    className="my-1.5 max-w-full overflow-hidden text-ellipsis text-right text-nowrap text-base font-semibold sm:my-0 sm:ml-0 sm:max-w-none sm:overflow-visible sm:text-left sm:text-clip sm:[writing-mode:vertical-lr]"
                >
                    {applicationName}
                </h1>
                <div className="flex h-full w-full max-w-full flex-col justify-between sm:w-auto">
                    {/* Widgets */}
                    <div className="flex flex-col items-start gap-5 sm:items-center sm:gap-2">
                        {mainWidgets.map((widget) => {
                            const widgetKey = getWidgetKey(widget);
                            const widgetButtonId = `browse-sidebar-widget-${widgetKey}`;

                            return (
                                <div key={widgetKey} className="flex w-full items-center gap-1.5 sm:block sm:w-auto">
                                    <WidgetButton
                                        id={widgetButtonId}
                                        label={widget.getDisplayName()}
                                        icon={getWidgetIcon(widget)}
                                        active={isWidgetActive(widget)}
                                        iconUrl={widget.getIconUrl() && widget.getFullIconUrl()}
                                        tooltipClassName="max-sm:hidden"
                                        onClick={() => {
                                            setActiveWidget(widget);
                                            closeSidebar();
                                        }}
                                    />
                                    <label
                                        htmlFor={widgetButtonId}
                                        className="block min-w-0 flex-1 truncate cursor-pointer sm:hidden"
                                    >
                                        {widget.getDisplayName()}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                    {/* Footer */}
                    <div className="flex gap-1 max-sm:items-end max-sm:justify-between sm:flex-col">
                        {footerWidget && (
                            <div className="flex min-w-0 items-center gap-1.5 sm:block sm:w-auto">
                                <WidgetButton
                                    id={footerWidgetButtonId}
                                    label={footerWidget.getDisplayName()}
                                    active={isWidgetActive(footerWidget)}
                                    icon={getWidgetIcon(footerWidget)}
                                    iconUrl={footerWidget.getIconUrl() && footerWidget.getFullIconUrl()}
                                    onClick={() => {
                                        setActiveWidget(footerWidget);
                                        closeSidebar();
                                    }}
                                    tooltipClassName="max-sm:hidden"
                                />
                                <label
                                    htmlFor={footerWidgetButtonId}
                                    className="block min-w-0 flex-1 truncate cursor-pointer sm:hidden"
                                >
                                    {footerWidget.getDisplayName()}
                                </label>
                            </div>
                        )}
                        <Tooltip delay={300} value={version} side="right" className="max-sm:hidden">
                            <p
                                aria-label={version}
                                className="max-w-[40px] overflow-hidden text-center text-xs text-nowrap text-ellipsis text-subtle max-sm:ml-auto"
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
