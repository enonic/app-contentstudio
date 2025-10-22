import {Widget} from "@enonic/lib-admin-ui/content/Widget";
import {Store} from "@enonic/lib-admin-ui/store/Store";
import {LegacyElement} from "@enonic/lib-admin-ui/ui2/LegacyElement";
import {CONFIG} from "@enonic/lib-admin-ui/util/Config";
import {IconButton, Tooltip, Button, cn} from "@enonic/ui";
import {CircleQuestionMark, Pen} from "lucide-react";
import {AppContext} from "../../../../app/AppContext";
import {ProjectIcon} from "../../../../app/ui2/list/ProjectIcon";
import {ProjectContext} from "../../../../app/project/ProjectContext";

type WidgetHandler = (widgetId: string) => void;

type Props = {
  name?: string;
  widgets?: Widget[];
  activeWidgetId?: string;
  handler?: WidgetHandler;
};

const WidgetButton = ({
  widget,
  activeWidgetId,
  handler,
}: Pick<Props, "activeWidgetId" | "handler"> & { widget: Widget }): React.ReactElement => {
  const [widgetKey, widgetDisplayName, widgetIconUrl, widgetFullIconUrl] = [
    widget.getWidgetDescriptorKey().toString(),
    widget.getDisplayName(),
    widget.getIconUrl(),
    widget.getFullIconUrl(),
  ];
  const baseIcon = CircleQuestionMark;
  const isWidgetActive = widgetKey === activeWidgetId;
  const icon = SidebarElement.isMainWidget(widget) ? Pen : baseIcon;

  if (widgetIconUrl) {
    return (
      <Tooltip value={widgetDisplayName} side="right">
        <Button
          className={cn(
            "px-[13px]",
            isWidgetActive
              ? "bg-surface-primary-selected hover:bg-surface-primary-selected-hover"
              : ""
          )}
          size="lg"
          aria-label={widget.getDisplayName()}
          onClick={() => handler(widgetKey)}
        >
          <img
            class={cn(
              "w-[20px] invert-100 dark:invert-0",
              isWidgetActive ? "invert-0" : ""
            )}
            src={widgetFullIconUrl}
            alt={widgetDisplayName}
          />
        </Button>
      </Tooltip>
    );
  }


  return (
    <Tooltip value={widgetDisplayName} side="right">
      <IconButton
        className={
          isWidgetActive
            ? "bg-surface-primary-selected hover:bg-surface-primary-selected-hover text-white"
            : "text-black dark:text-white"
        }
        size="lg"
        icon={icon}
        aria-label={widget.getDisplayName()}
        onClick={() => handler(widgetKey)}
      />
    </Tooltip>
  );
};

const SidebarComponent = ({
  name = Store.instance().get("application").getName(),
  widgets = [],
  activeWidgetId = "",
  handler = () => {},
}: Props): React.ReactElement => {
  const project = ProjectContext.get().getProject();
  const version = "v." + CONFIG.getString("appVersion");
  const mainWidgets = widgets.slice(0, -1);
  const lastWidget = widgets.at(-1);

  const SidebarHeader = () => (
    <>
      <div class="w-[32px] h-[32px]">
        <ProjectIcon
          projectName={project.getName()}
          language={project.getLanguage()}
          hasIcon={!!project.getIcon()}
        />
      </div>
      <p
        title={name}
        class="[writing-mode:vertical-lr] text-nowrap text-base font-semibold"
      >
        {name}
      </p>
    </>
  );

  const SidebarWidgets = () => (
    <div className="flex flex-col gap-2 items-center">
      {mainWidgets.map((widget) => (
        <WidgetButton
          widget={widget}
          activeWidgetId={activeWidgetId}
          handler={handler}
        />
      ))}
    </div>
  );

  const SidebarFooter = () => (
    <div>
      {lastWidget && (
        <WidgetButton
          widget={lastWidget}
          activeWidgetId={activeWidgetId}
          handler={handler}
        />
      )}
      <p class="text-cs text-surface-primary-selected text-center overflow-hidden no-wrap text-nowrap max-w-[40px]">
        {version}
      </p>
    </div>
  );

  return (
    <nav
      tabIndex={0}
      class="dark:bg-surface-neutral absolute h-screen w-[60px] flex flex-col gap-10 items-center p-2 border-r border-bdr-soft"
      aria-label="Sidebar"
    >
      <SidebarHeader />
      <div class="flex flex-col justify-between h-full">
        <SidebarWidgets />
        <SidebarFooter />
      </div>
    </nav>
  );
};

export class SidebarElement extends LegacyElement<typeof SidebarComponent,Props> {
  private static MAIN_APP_ENDING: string = "studio:main";
  private static ARCHIVE_APP_ENDING: string = "plus:archive";
  private static SETTINGS_APP_ENDING: string = "studio:settings";

  constructor(props: Props) {
    super({...props}, SidebarComponent);
  }

  private sortWidgets(widgets: Widget[]): Widget[] {
    const mainWidget = widgets.find(SidebarElement.isMainWidget);
    const archiveWidget = widgets.find(this.isArchiveWidget);
    const settingsWidget = widgets.find(this.isSettingsWidget);
    const defaultWidgets = widgets.filter(this.isDefaultWidget);
    const sortedDefaultWidgets = defaultWidgets.sort((wa, wb) => {
      return wa
        .getWidgetDescriptorKey()
        .toString()
        .localeCompare(wb.getWidgetDescriptorKey().toString());
    });

    return [
      mainWidget,
      archiveWidget,
      ...sortedDefaultWidgets,
      settingsWidget,
    ].filter(Boolean);
  }

  static isMainWidget(widget: Widget): boolean {
    return widget
      .getWidgetDescriptorKey()
      .toString()
      .endsWith(SidebarElement.MAIN_APP_ENDING);
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

  onItemSelected(handler: WidgetHandler): void {
    this.props.setKey("handler", handler);

    return;
  }

  addWidget(widget: Widget): void {
    const updatedWidgets = [...this.props.get().widgets, widget];
    this.props.setKey("widgets", this.sortWidgets(updatedWidgets));

    return;
  }

  toggleActiveButton(): void {
    this.props.setKey(
      "activeWidgetId",
      AppContext.get().getCurrentAppOrWidgetId()
    );
    
    return;
  }

  removeWidget(widget: Widget): void {
    const updatedWidgets = this.props
      .get()
      .widgets.filter(
        (w) => w.getWidgetDescriptorKey() !== widget.getWidgetDescriptorKey()
      );
    this.props.setKey("widgets", updatedWidgets);

    return;
  }
}
