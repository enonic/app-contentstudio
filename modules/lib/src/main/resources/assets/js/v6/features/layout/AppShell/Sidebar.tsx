import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {Tooltip} from '@enonic/ui';
import {ProjectIcon} from '../../../../app/ui2/list/ProjectIcon';
import {WidgetButton} from './WidgetButton';
import {Pen} from 'lucide-react';
import {useStore} from '@nanostores/preact';
import {$sidebarWidgets, getWidgetKey, isMainWidget, setActiveWidget} from '../../store/sidebarWidgets.store';
import {ReactElement, useCallback} from 'react';
import {useI18n} from '../../../../app/ui2/hooks/useI18n';
import {$activeProject} from '../../store/projects.store';

export const Sidebar = (): ReactElement => {
    const activeProject = useStore($activeProject);
    const {widgets, activeWidgetId} = useStore($sidebarWidgets);
    const name = Store.instance().get('application').getName();
    const version = 'v' + CONFIG.getString('appVersion');

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
                            icon={isMainWidget(widget) && Pen}
                            active={isWidgetActive(widget)}
                            iconUrl={widget.getIconUrl() && widget.getFullIconUrl()}
                            onClick={() => {
                                setActiveWidget(widget);
                            }}
                        />
                    ))}
                </div>
                {/* Footer */}
                <div>
                    {lastWidget && (
                        <WidgetButton
                            label={lastWidget.getDisplayName()}
                            active={isWidgetActive(lastWidget)}
                            icon={isMainWidget(lastWidget) && Pen}
                            iconUrl={lastWidget.getIconUrl() && lastWidget.getFullIconUrl()}
                            onClick={() => {
                                setActiveWidget(lastWidget);
                            }}
                        />
                    )}
                    <Tooltip value={version} side="right">
                        <p class="text-xs text-surface-primary-selected text-center overflow-hidden text-nowrap max-w-[40px] text-ellipsis">
                            {version}
                        </p>
                    </Tooltip>
                </div>
            </div>
        </nav>
    );
};

export class SidebarElement extends LegacyElement<typeof Sidebar> {
    constructor() {
        super({}, Sidebar);
    }
}
