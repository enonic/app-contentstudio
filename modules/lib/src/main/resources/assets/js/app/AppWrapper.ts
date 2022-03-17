import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {AppContext} from './AppContext';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {App} from './App';
import {GetAdminToolsRequest} from './resource/GetAdminToolsRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {AdminTool} from './AdminTool';
import {TooltipHelper} from './TooltipHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {Store} from 'lib-admin-ui/store/Store';
import {CONFIG} from 'lib-admin-ui/util/Config';
import {GetWidgetsByInterfaceRequest} from './resource/GetWidgetsByInterfaceRequest';
import {Widget} from 'lib-admin-ui/content/Widget';
import {UriHelper} from './rendering/UriHelper';
import {WidgetHelper} from './util/WidgetHelper';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private apps: App[];

    private widgets: Widget[];

    private widgetElements: Map<string, Element> = new Map<string, Element>();

    private toggleSidebarButton: Button;

    private touchListener: (event: TouchEvent) => void;

    private appAddedListeners: { (app: App | Widget): void }[] = [];

    constructor(apps: App[], className?: string) {
        super(`main-app-wrapper ${(className || '')}`.trim());

        this.apps = apps;
        this.widgets = [];
        this.initElements();
        this.initListeners();
        this.updateAdminTools();
        this.toggleSidebar();
        TooltipHelper.init();
    }

    private initElements() {
        this.sidebar = new Sidebar();
        this.toggleSidebarButton = new ToggleIcon();
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleTouchOutsideSidebar();

        this.sidebar.onItemSelected((appOrWidgetId: string) => {
            const app: App = this.getAppById(appOrWidgetId);

            if (app) {
                this.selectApp(app);
                return;
            }

            const widget: Widget = this.widgets.find((w: Widget) => w.getWidgetDescriptorKey().toString() === appOrWidgetId);

            if (widget) {
                this.selectWidget(widget);
            }
        });

        this.listenAppEvents();
    }

    selectWidget(widget: Widget) {
        this.apps.forEach((app: App) => app.hide());
        AppContext.get().setWidget(widget);
        const key: string = widget.getWidgetDescriptorKey().toString();

        if (this.widgetElements.has(key)) {
            this.widgetElements.get(key).show();
        } else {
            this.fetchAndAppendWidget(widget);
        }

        this.sidebar.toggleActiveButton();
    }

    private fetchAndAppendWidget(widget: Widget): void {
        fetch(UriHelper.getAdminUri(widget.getUrl(), '/'))
            .then(response => response.text())
            .then((html: string) => {
                const elem: Element = WidgetHelper.injectWidgetHtml(html, this).resultElement;
                this.widgetElements.set(widget.getWidgetDescriptorKey().toString(), elem);
            })
            .catch(err => {
                throw new Error('Failed to fetch widget: ' + err);
            });
    }

    private getAppById(appId: string): App {
        return this.apps.find((app: App) => app.getAppId().toString() === appId);
    }

    selectApp(app: App): void {
        if (!this.hasChild(app.getAppContainer())) {
            this.appendChild(app.getAppContainer());
        }

        AppContext.get().setCurrentApp(app.getAppId());
        this.apps.forEach((app: App) => app.hide());
        Array.from(this.widgetElements.values()).forEach((el: Element) => el.hide());
        app.show();
        this.sidebar.toggleActiveButton();
    }

    private collapseSidebarOnMouseEvent(event: TouchEvent) {
        this.toggleSidebar();

        event.stopPropagation();
        event.preventDefault();
    }

    private handleTouchOutsideSidebar() {
        this.touchListener = (event: TouchEvent) => {
            if (!this.hasClass('sidebar-expanded')) {
                return;
            }

            if (this.sidebar.getButtons().some(
                (button: Button) => button.getHTMLElement().contains(<HTMLElement>event.target))
            ) {
                this.collapseSidebarOnMouseEvent(event);
                return;
            }

            for (let element = event.target; element; element = (<any>element).parentNode) {
                if (element === this.sidebar.getHTMLElement() || element === this.toggleSidebarButton.getHTMLElement()) {
                    return;
                }
            }
            this.collapseSidebarOnMouseEvent(event);
        };
    }

    private toggleSidebar() {
        this.sidebar.show();
        const isSidebarVisible: boolean = this.hasClass('sidebar-expanded');
        this.toggleClass('sidebar-expanded', !isSidebarVisible);
        this.toggleSidebarButton.toggleClass('toggled', !isSidebarVisible);
        this.toggleSidebarButton.setTitle(
            this.toggleSidebarButton.hasClass('toggled') ? i18n('tooltip.sidebar.close') : i18n('tooltip.sidebar.open'), false
        );
        if (!isSidebarVisible) {
            Body.get().onTouchStart(this.touchListener, false);
        } else {
            Body.get().unTouchStart(this.touchListener);
        }
    }

    private updateAdminTools() {
        new GetAdminToolsRequest().sendAndParse().then((adminTools: AdminTool[]) => {
            this.sidebar.reset();
            this.removeStaleAdminTools(adminTools);
            this.sidebar.setAdminTools(this.apps);
            this.injectMissingAdminTools(adminTools);

            new GetWidgetsByInterfaceRequest(['contentstudio.sidebar']).sendAndParse().then((widgets: Widget[]) => {
                this.widgets = widgets;

                widgets.forEach((widget: Widget) => {
                    this.sidebar.addWidget(widget);
                    this.notifyItemAdded(widget);
                });
            }).catch(DefaultErrorHandler.handle);
        }).catch(DefaultErrorHandler.handle);
    }

    private removeStaleAdminTools(adminTools: AdminTool[]) {
        const apps: App[] = [];

        this.apps.forEach((app: App) => {
            if (adminTools.some((adminTool: AdminTool) => adminTool.getKey().equals(app.getAppId()))) {
                apps.push(app);
            } else {
                const toolId: string = app.getAppId().toString();
                const cssElem: HTMLElement = document.getElementById('externalCSS');
                const jsElem: HTMLElement = document.getElementById(`${toolId}JS`);

                cssElem?.setAttribute('href', '');
                // cssElem?.parentNode.removeChild(cssElem);
                jsElem?.parentNode.removeChild(jsElem);
            }
        });

        this.apps = apps;
    }

    private injectMissingAdminTools(adminTools: AdminTool[]) {
        const studioApp: string = CONFIG.getString('appId');
        adminTools
            .filter((adminTool: AdminTool) => !this.hasAdminTool(adminTool))
            .forEach((remoteAdminTool: AdminTool) => {
                const adminToolApp: string = remoteAdminTool.getKey().getApplicationKey().toString();
                const adminToolId: string = remoteAdminTool.getKey().toString();
                const assetUrl = CONFIG.getString('assetsUri').replace(new RegExp(studioApp, 'g'), adminToolApp);
                const mainJsUrl = `${assetUrl}/js/inject.js`;
                const mainCssUrl = `${assetUrl}/styles/main.css`;

                document.getElementById('externalCSS')?.setAttribute('href', mainCssUrl);

                // document.querySelector('head').innerHTML +=
                //     `<link id="${adminToolId}CSS" rel="stylesheet" href="${mainCssUrl}" type="text/css"/>`;

                const s = document.createElement('script');
                s.setAttribute('id', `${adminToolId}JS`);
                s.setAttribute('type', 'text/javascript');
                s.setAttribute('src', mainJsUrl);
                s.setAttribute('data-tool-uri', remoteAdminTool.getUri());
                s.setAttribute('data-tool-id', adminToolApp);
                document.head.appendChild(s);
            });
    }

    private hasAdminTool(adminTool: AdminTool): boolean {
        return this.apps.some((app: App) => app.getAppId().equals(adminTool.getKey()));
    }

    private listenAppEvents() {
        const debouncedAdminToolUpdate: Function = AppHelper.debounce(() => {
            this.updateAdminTools();
        }, 500);

        ApplicationEvent.on((event: ApplicationEvent) => {
            if (ApplicationEventType.STOPPED === event.getEventType() || ApplicationEventType.UNINSTALLED === event.getEventType()
                || ApplicationEventType.STARTED === event.getEventType() || ApplicationEventType.INSTALLED) {
                if (this.isAdminToolApp(event.getApplicationKey())) {
                    debouncedAdminToolUpdate();
                }
            }
        });
    }

    private isAdminToolApp(key: ApplicationKey): boolean {
        return key.toString().indexOf('com.enonic.app.contentstudio') >= 0;
    }

    addApp(app: App, index: number = -1) {
        if (index > -1) {
            this.apps.splice(index, 0, app);
        } else {
            this.apps.push(app);
        }

        this.sidebar.addAdminTool(app, index);
        this.notifyItemAdded(app);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.toggleSidebarButton, <Element>this.sidebar);

            return rendered;
        });
    }

    onItemAdded(handler: (item: App | Widget) => void) {
        this.appAddedListeners.push(handler);
    }

    unItemAdded(handler: (app: App | Widget) => void) {
        this.appAddedListeners = this.appAddedListeners.filter((curr: { (app: App | Widget): void }) => {
            return handler !== curr;
        });
    }

    private notifyItemAdded(addedApp: App | Widget) {
        this.appAddedListeners.forEach((handler: { (app: App | Widget): void }) => {
            handler(addedApp);
        });
    }
}

class ToggleIcon
    extends Button {

    constructor() {
        super();
        this.setTitle(i18n('tooltip.sidebar.open'));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('sidebar-toggler');
            const lines: SpanEl = new SpanEl('lines');
            this.appendChild(lines);

            return rendered;
        });
    }
}

class AppModeSwitcher
    extends DivEl {

    private buttons: SidebarButton[] = [];

    private itemSelectedListeners: { (appOrWidgetId: string): void } [] = [];

    constructor() {
        super('actions-block');
    }

    setAdminTools(apps: App[]) {
        this.initButtons(apps);
    }

    reset() {
        this.cleanButtons();
    }

    addAdminTool(app: App, index: number = -1) {
        this.createAppButton(app, index);
    }

    addWidget(widget: Widget): void {
        this.createWidgetButton(widget);
    }

    private createWidgetButton(widget: Widget, index: number = -1) {
        const contentButton: SidebarButton = new SidebarButton(widget.getWidgetDescriptorKey().toString());
        contentButton.setTitle(widget.getDisplayName());
        const imgEl: ImgEl = new ImgEl(widget.getIconUrl());
        contentButton.appendChild(imgEl);

        this.createButton(contentButton);
    }

    toggleActiveButton() {
        this.buttons.forEach((b: SidebarButton) => {
            b.toggleSelected(b.getAppOrWidgetId() === AppContext.get().getCurrentAppOrWidgetId());
        });
    }

    private cleanButtons() {
        this.removeChildren();
        this.buttons = [];
    }

    private initButtons(apps: App[]) {
        apps.forEach((app: App) => {
            this.createAppButton(app);
        });
    }

    private createAppButton(app: App, index: number = -1): void {
        const contentButton: SidebarButton = new SidebarButton(app.getAppId().toString());
        contentButton.setLabel(app.getDisplayName());
        contentButton.addClass(app.getIconClass());
        contentButton.setTitle(app.getDisplayName());

        this.createButton(contentButton, index);
    }

    private createButton(sidebarButton: SidebarButton, index: number = -1): void {
        this.listenButtonClicked(sidebarButton);
        this.buttons.push(sidebarButton);

        if (index > -1) {
            this.insertChild(sidebarButton, index);
        } else {
            this.appendChild(sidebarButton);
        }
    }

    private onButtonClicked(button: SidebarButton) {
        this.buttons.forEach((b: Button) => {
            b.toggleClass(SidebarButton.SELECTED_CLASS, b === button);
        });

        if (button.getAppOrWidgetId() !== AppContext.get().getCurrentAppOrWidgetId()) {
            this.notifyItemSelected(button.getAppOrWidgetId());
        }
    }

    private listenButtonClicked(button: SidebarButton) {
        const clickListener: () => void = () => this.onButtonClicked(button);
        button.onTouchStart(clickListener);
        button.onClicked(clickListener);

        button.onRemoved(() => {
            button.unTouchStart(clickListener);
            button.unClicked(clickListener);
        });
    }

    private notifyItemSelected(appOrWidgetId: string) {
        this.itemSelectedListeners.forEach((listener: (id: string) => void) => {
            listener(appOrWidgetId);
        });
    }

    onItemSelected(handler: (appOrWidgetId: string) => void) {
        this.itemSelectedListeners.push(handler);
    }

    getButtons(): Button[] {
        return this.buttons;
    }
}

class SidebarButton
    extends Button {

    private readonly appOrWidgetId: string;

    static SELECTED_CLASS: string = 'selected';

    constructor(appOrWidgetId: string) {
        super();

        this.appOrWidgetId = appOrWidgetId;
        this.toggleClass(SidebarButton.SELECTED_CLASS, appOrWidgetId === AppContext.get().getCurrentAppOrWidgetId());
    }

    getAppOrWidgetId(): string {
        return this.appOrWidgetId;
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(SidebarButton.SELECTED_CLASS, condition);
    }
}

class Sidebar
    extends DivEl {

    private readonly appModeSwitcher: AppModeSwitcher;

    constructor() {
        super('sidebar');

        this.appModeSwitcher = new AppModeSwitcher();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.createAppNameBlock());
            this.appendChildren(this.appModeSwitcher);
            this.appendChild(this.createAppVersionBlock());

            return rendered;
        });
    }

    onItemSelected(handler: (appOrWidgetId: string) => void) {
        this.appModeSwitcher.onItemSelected(handler);
    }

    getButtons(): Button[] {
        return this.appModeSwitcher.getButtons();
    }

    reset() {
        this.appModeSwitcher.reset();
    }

    setAdminTools(apps: App[]) {
        this.appModeSwitcher.setAdminTools(apps);
    }

    addAdminTool(app: App, index: number = -1) {
        this.appModeSwitcher.addAdminTool(app, index);
    }

    addWidget(widget: Widget): void {
        this.appModeSwitcher.addWidget(widget);
    }

    toggleActiveButton() {
        this.appModeSwitcher.toggleActiveButton();
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(Store.instance().get('application').getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }

    private createAppVersionBlock(): DivEl {
        const appVersion: string = CONFIG.getString('appVersion');
        const cleanVersion: string = StringHelper.cleanVersion(appVersion);
        const appVersionSpan: DivEl = new DivEl('app-version');
        appVersionSpan.setHtml(`v${cleanVersion}`);

        if (appVersion !== cleanVersion) {
            appVersionSpan.setTitle(`v${appVersion}`);
        }

        return appVersionSpan;
    }
}
