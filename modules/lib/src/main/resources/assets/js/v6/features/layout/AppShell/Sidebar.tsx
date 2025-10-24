import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {Tooltip} from '@enonic/ui';
import {AppContext} from '../../../../app/AppContext';
import {ProjectIcon} from '../../../../app/ui2/list/ProjectIcon';
import {ProjectContext} from '../../../../app/project/ProjectContext';
import {WidgetButton} from './WidgetButton';
import {Pen} from 'lucide-react';

type Props = {
    name?: string;
    widgets?: Widget[];
    activeWidgetId?: string;
    onClick?: (widgetId: string) => void;
};

function isMainWidget(widget: Widget): boolean {
    return widget.getWidgetDescriptorKey().toString().endsWith('studio:main');
}

const SidebarComponent = ({
    name = Store.instance().get('application').getName(),
    widgets = [],
    activeWidgetId = '',
    onClick = () => {},
}: Props): React.ReactElement => {
    const project = ProjectContext.get().getProject();
    const version = 'v' + CONFIG.getString('appVersion');
    const mainWidgets = widgets.slice(0, -1);
    const lastWidget = widgets.at(-1);

    const isWidgetActive = (widget: Widget) =>
        widget.getWidgetDescriptorKey().toString() === activeWidgetId;

    return (
        <nav
            tabIndex={0}
            class="dark:bg-surface-neutral absolute h-screen w-[60px] flex flex-col gap-10 items-center py-2.5 px-1.75 border-r border-bdr-soft"
            aria-label="Sidebar"
        >
            {/* Header */}
            <div className="size-8">
                <ProjectIcon
                    projectName={project.getName()}
                    language={project.getLanguage()}
                    hasIcon={!!project.getIcon()}
                />
            </div>
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
                            onClick={() => onClick?.(widget.getWidgetDescriptorKey().toString())}
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
                            onClick={() =>
                                onClick?.(lastWidget.getWidgetDescriptorKey().toString())
                            }
                        />
                    )}
                    <Tooltip value={version} side="right">
                        <p class="text-cs text-surface-primary-selected text-center overflow-hidden text-nowrap max-w-[40px]">
                            {version}
                        </p>
                    </Tooltip>
                </div>
            </div>
        </nav>
    );
};

export class SidebarElement extends LegacyElement<typeof SidebarComponent, Props> {
    private static MAIN_APP_ENDING: string = 'studio:main';
    private static ARCHIVE_APP_ENDING: string = 'plus:archive';
    private static SETTINGS_APP_ENDING: string = 'studio:settings';

    constructor(props: Props) {
        super({...props}, SidebarComponent);
    }

    private sortWidgets(widgets: Widget[]): Widget[] {
        const mainWidget = widgets.find(this.isMainWidget);
        const archiveWidget = widgets.find(this.isArchiveWidget);
        const settingsWidget = widgets.find(this.isSettingsWidget);
        const defaultWidgets = widgets.filter(this.isDefaultWidget);
        const sortedDefaultWidgets = defaultWidgets.sort((wa, wb) => {
            return wa
                .getWidgetDescriptorKey()
                .toString()
                .localeCompare(wb.getWidgetDescriptorKey().toString());
        });

        return [mainWidget, archiveWidget, ...sortedDefaultWidgets, settingsWidget].filter(Boolean);
    }

    private isMainWidget(widget: Widget): boolean {
        return widget.getWidgetDescriptorKey().toString().endsWith(SidebarElement.MAIN_APP_ENDING);
    }

    private isArchiveWidget(widget: Widget): boolean {
        return widget
            .getWidgetDescriptorKey()
            .toString()
            .endsWith(SidebarElement.ARCHIVE_APP_ENDING);
    }

    private isSettingsWidget(widget: Widget): boolean {
        return widget
            .getWidgetDescriptorKey()
            .toString()
            .endsWith(SidebarElement.SETTINGS_APP_ENDING);
    }

    private isDefaultWidget(widget: Widget): boolean {
        const widgetKey = widget.getWidgetDescriptorKey().toString();
        return [
            widgetKey.endsWith(SidebarElement.MAIN_APP_ENDING),
            widgetKey.endsWith(SidebarElement.ARCHIVE_APP_ENDING),
            widgetKey.endsWith(SidebarElement.SETTINGS_APP_ENDING),
        ].every((widgetStatus) => widgetStatus === false);
    }

    onItemSelected(handler: (widgetId: string) => void): void {
        this.props.setKey('onClick', handler);
    }

    addWidget(widget: Widget): void {
        const updatedWidgets = [...this.props.get().widgets, widget];
        this.props.setKey('widgets', this.sortWidgets(updatedWidgets));
    }

    toggleActiveButton(): void {
        this.props.setKey('activeWidgetId', AppContext.get().getCurrentAppOrWidgetId());
    }

    removeWidget(widget: Widget): void {
        const updatedWidgets = this.props
            .get()
            .widgets.filter((w) => w.getWidgetDescriptorKey() !== widget.getWidgetDescriptorKey());
        this.props.setKey('widgets', updatedWidgets);
    }
}
