import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {LucideIcon, Pen, Settings} from 'lucide-react';
import {ReactElement, useCallback} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {ProjectIcon} from '../../../shared/icons/ProjectIcon';
import {LegacyElement} from '../../../shared/LegacyElement';
import {WidgetButton} from '../../../shared/WidgetButton';
import {$activeProject} from '../../../store/projects.store';
import {$sidebarWidgets, getWidgetKey, isMainWidget, isSettingsWidget, setActiveWidget} from '../../../store/sidebarWidgets.store';

function getWidgetIcon(widget: Readonly<Widget>): LucideIcon | undefined {
    if (isMainWidget(widget)) return Pen;
    if (isSettingsWidget(widget)) return Settings;
    return undefined;
}

export const BrowseSidebar = (): ReactElement => {
    const activeProject = useStore($activeProject);
    const {widgets, activeWidgetId} = useStore($sidebarWidgets);
    const name = Store.instance().get('application').getName();
    // const version = 'v' + CONFIG.getString('appVersion');
    const version = 'v6.0.0'; // temporary hardcoded for demo purposes

    const mainWidgets = widgets.slice(0, -1);
    const lastWidget = widgets.at(-1);

    const isWidgetActive = useCallback(
        (widget: Readonly<Widget>) => {
            return getWidgetKey(widget) === activeWidgetId;
        },
        [activeWidgetId]
    );

    return (
        <nav
            class="bg-surface-neutral absolute h-screen w-15 flex flex-col gap-10 items-center py-2.5 px-1.75 border-r border-bdr-soft"
            aria-label={useI18n('wcag.sidebar.label')}
        >
            {/* Header */}
            <ProjectIcon
                projectName={activeProject?.getName()}
                language={activeProject?.getLanguage()}
                hasIcon={!!activeProject?.getIcon()}
                className="flex-shrink-0 my-1.75 ml-0"
            />
            <h1 title={name} class="[writing-mode:vertical-lr] text-nowrap text-base font-semibold">
                {name}
            </h1>
            <div class="flex flex-col justify-between h-full">
                {/* Widgets */}
                <div className="flex flex-col gap-2 items-center">
                    {mainWidgets.map((widget) => (
                        <WidgetButton
                            key={widget.getWidgetDescriptorKey()}
                            label={widget.getDisplayName()}
                            icon={getWidgetIcon(widget)}
                            active={isWidgetActive(widget)}
                            iconUrl={widget.getIconUrl() && widget.getFullIconUrl()}
                            onClick={() => {
                                setActiveWidget(widget);
                            }}
                        />
                    ))}
                </div>
                {/* Footer */}
                <div className='flex flex-col gap-1'>
                    {lastWidget && (
                        <WidgetButton
                            label={lastWidget.getDisplayName()}
                            active={isWidgetActive(lastWidget)}
                            icon={getWidgetIcon(lastWidget)}
                            iconUrl={lastWidget.getIconUrl() && lastWidget.getFullIconUrl()}
                            onClick={() => {
                                setActiveWidget(lastWidget);
                            }}
                        />
                    )}
                    <Tooltip delay={300} value={version} side="right">
                        <p class="text-xs text-subtle text-center overflow-hidden text-nowrap max-w-[40px] text-ellipsis">
                            {version}
                        </p>
                    </Tooltip>
                </div>
            </div>
        </nav>
    );
};

BrowseSidebar.displayName = 'BrowseSidebar';

export class BrowseSidebarElement extends LegacyElement<typeof BrowseSidebar> {
    constructor() {
        super({}, BrowseSidebar);
    }
}
