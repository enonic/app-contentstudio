import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import Q from 'q';
import {Element, NewElementBuilder} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppContext} from './AppContext';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {GetWidgetsByInterfaceRequest} from './resource/GetWidgetsByInterfaceRequest';
import {Widget, WidgetConfig} from '@enonic/lib-admin-ui/content/Widget';
import {WidgetElement, WidgetHelper} from '@enonic/lib-admin-ui/widget/WidgetHelper';
import {ContentAppContainer} from './ContentAppContainer';
import {Router} from './Router';
import {UrlAction} from './UrlAction';
import {ContentAppBar} from './bar/ContentAppBar';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {cn} from '@enonic/ui';
import {SidebarElement} from '../v6/features/layout/AppShell/Sidebar';

export class AppWrapper
    extends DivEl {

    private sidebar: SidebarElement;//WidgetsSidebar;

    private widgets: Widget[] = [];

    private widgetElements: Map<string, WidgetElement> = new Map<string, WidgetElement>();

    private activeWidgets: string[] = [];

    private appBar: ContentAppBar;

    private widgetsBlock: DivEl;

    private touchListener: (event: TouchEvent) => void;

    private widgetAddedListeners: ((Widget) => void)[] = [];

    constructor(className?: string) {
        super(cn('main-app-wrapper bg-surface-primary text-main', className));

        this.initElements();
        this.initListeners();
        this.addStudioWidget();
        this.updateSidebarWidgets();
    }

    private initElements() {
        this.sidebar = new SidebarElement({widgets: this.widgets});
        this.appBar = ContentAppBar.getInstance();
        this.widgetsBlock = new DivEl('widgets-block');
    }

    private initListeners() {
        this.sidebar.onItemSelected((widgetId: string) => {
            const widget: Widget = this.widgets.find((w: Widget) => w.getWidgetDescriptorKey().toString() === widgetId);

            if (widget) {
                this.selectWidget(widget);
            }
        });

        this.listenAppEvents();
    }

    private addStudioWidget(): void {
        const studioWidget: Widget = this.createStudioWidget();
        this.widgets.push(studioWidget);
        this.sidebar.addWidget(studioWidget);
    }

    private createStudioWidget(): Widget {
        return Widget.create()
            .setWidgetDescriptorKey(`${CONFIG.getString('appId')}:main`)
            .setDisplayName(i18n('app.admin.widget.main'))
            .setUrl(UrlAction.BROWSE)
            .setConfig(new WidgetConfig().setProperty('context', 'project'))
            .build();
    }

    private createStudioWidgetEl(): Element {
        const widgetEl: Element = new Element(new NewElementBuilder().setTagName('widget')).setId('widget-studio');
        const appContainer: ContentAppContainer = new ContentAppContainer();

        appContainer.onShown(() => {
            this.appBar.showIssuesButton();
        });

        appContainer.onHidden(() => {
            this.appBar.hideIssuesButton();
        });

        widgetEl.appendChild(appContainer);

        return widgetEl;
    }

    selectDefaultWidget(): void {
        this.selectWidget(this.widgets[0]);
    }

    selectWidget(widget: Widget) {
        const widgetToSelectKey: string = widget.getWidgetDescriptorKey().toString();
        this.widgetElements.forEach((widgetEl: WidgetElement, key: string) => {
            if (key !== widgetToSelectKey) {
                this.setWidgetActive(key, widgetEl, false);
            }
        });
        AppContext.get().setWidget(widget);
        this.updateUrl(widget);
        this.updateTabName(widget);

        if (this.widgetElements.has(widgetToSelectKey)) {
            this.setWidgetActive(widgetToSelectKey, this.widgetElements.get(widgetToSelectKey), true);
        } else {
            this.fetchAndAppendWidget(widget);
        }

        const isProjectSelectorShown: boolean = widget.getConfig().getProperty('context') === 'project';

        if (isProjectSelectorShown) {
            this.appBar.showProjectSelector();
        } else {
            this.appBar.hideProjectSelector();
        }

        this.appBar.setAppName(widget.getDisplayName());

        this.sidebar.toggleActiveButton();
    }

    private updateUrl(widget: Widget): void {
        if (this.isDefaultWidget(widget)) {
            Router.get().setHash(UrlAction.BROWSE);
            return;
        }

        const appKeyLastPart: string = widget.getWidgetDescriptorKey().getApplicationKey().getName().split('.').pop();
        const widgetName: string = widget.getWidgetDescriptorKey().getName();
        Router.get().setHash(`widget/${appKeyLastPart}/${widgetName}`);
    }

    private updateTabName(widget: Widget): void {
        const prefix: string = i18n('admin.tool.displayName');
        const postfix: string =
            (this.isDefaultWidget(widget) || !widget.getDisplayName()) ? i18n('app.admin.tool.title') : widget.getDisplayName();
        document.title = `${prefix} - ${postfix}`;
    }

    private isDefaultWidget(widget: Widget): boolean {
        return widget === this.widgets[0];
    }


    private fetchAndAppendWidget(widget: Widget): void {
        if (this.isDefaultWidget(widget)) { // default studio app
            const widgetEl: Element = this.createStudioWidgetEl();
            this.widgetElements.set(widget.getWidgetDescriptorKey().toString(), {el: widgetEl});
            this.widgetsBlock.appendChild(widgetEl);
            return;
        }

        fetch(widget.getFullUrl())
            .then(response => response.text())
            .then((html: string) => {
                WidgetHelper.createFromHtmlAndAppend(html, this.widgetsBlock)
                    .then((widgetEl: WidgetElement) => {
                        const widgetKey = widget.getWidgetDescriptorKey().toString();
                        this.widgetElements.set(widgetKey, widgetEl);
                        this.activeWidgets.push(widgetKey);
                    });
            })
            .catch(err => {
                throw new Error('Failed to fetch widget: ' + err);
            });
    }

    private updateSidebarWidgets() {
        new GetWidgetsByInterfaceRequest('contentstudio.menuitem').sendAndParse().then((widgets: Widget[]) => {
            widgets.push(this.widgets[0]); // default studio widget
            this.removeStaleWidgets(widgets);
            this.addMissingWidgets(widgets);
        }).catch(DefaultErrorHandler.handle);
    }

    private removeStaleWidgets(widgets: Widget[]): void {
        this.widgets = this.widgets.filter((currentWidget: Widget) => {
            if (widgets.some((w: Widget) => w.getWidgetDescriptorKey().equals(currentWidget.getWidgetDescriptorKey()))) {
                return true;
            }

            this.sidebar.removeWidget(currentWidget);

            return false;
        });
    }

    private hasWidget(widget: Widget): boolean {
        return this.widgets.some((w: Widget) => w.getWidgetDescriptorKey().equals(widget.getWidgetDescriptorKey()));
    }

    private addMissingWidgets(widgets: Widget[]): void {
        widgets.filter((widget: Widget) => !this.hasWidget(widget)).forEach((widget: Widget) => {
            this.widgets.push(widget);
            this.sidebar.addWidget(widget);
            this.notifyItemAdded(widget);
        });
    }

    private listenAppEvents() {
        const debouncedAdminToolUpdate: () => void = AppHelper.debounce(() => {
            this.updateSidebarWidgets();
        }, 1000);

        ApplicationEvent.on((event: ApplicationEvent) => {
            if (this.isAppStopStartEvent(event)) {
                debouncedAdminToolUpdate();
            }
        });
    }

    private isAppStopStartEvent(event: ApplicationEvent): boolean {
        return ApplicationEventType.STOPPED === event.getEventType() || ApplicationEventType.UNINSTALLED === event.getEventType()
               || ApplicationEventType.STARTED === event.getEventType() || ApplicationEventType.INSTALLED === event.getEventType();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const headerAndWidgetsBlock: DivEl = new DivEl('header-widgets-block');
            headerAndWidgetsBlock.appendChildren(this.appBar, this.widgetsBlock);
            this.appendChildren(this.sidebar, headerAndWidgetsBlock);

            ResponsiveManager.onAvailableSizeChanged(this.appBar);

            return rendered;
        });
    }

    onItemAdded(handler: (item: Widget) => void) {
        this.widgetAddedListeners.push(handler);
    }

    unItemAdded(handler: (item: Widget) => void) {
        this.widgetAddedListeners = this.widgetAddedListeners.filter((curr: (widget: Widget) => void) => {
            return handler !== curr;
        });
    }

    private notifyItemAdded(item: Widget) {
        this.widgetAddedListeners.forEach((handler: (widget: Widget) => void) => {
            handler(item);
        });
    }

    private setWidgetActive(key: string, widgetEl: WidgetElement, active: boolean): void {
        widgetEl.el.setVisible(active);
        if (this.isInternalWidget(key)) {
            return;
        }

        const isWidgetActive = this.activeWidgets.findIndex((activeWidgetKey: string) => activeWidgetKey === key) > -1;
        if (isWidgetActive !== active) {
            if (isWidgetActive) {
                widgetEl.assets?.forEach((asset: HTMLElement) => asset.remove());
                this.activeWidgets = this.activeWidgets.filter((activeWidgetKey: string) => activeWidgetKey !== key);
            } else {
                widgetEl.assets?.forEach((asset: HTMLElement) => document.head.appendChild(asset));
                this.activeWidgets.push(key);
            }
        }
    }

    private isInternalWidget(key: string): boolean {
        return key === CONFIG.get('appId');
    }
}
