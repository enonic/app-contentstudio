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
import {DescriptorKey} from './page/DescriptorKey';
import {TooltipHelper} from './TooltipHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {Store} from 'lib-admin-ui/store/Store';
import {CONFIG} from 'lib-admin-ui/util/Config';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private apps: App[];

    private currentApp: App;

    private toggleSidebarButton: Button;

    private touchListener: (event: MouseEvent) => void;

    private appAddedListeners: { (app: App): void }[] = [];

    constructor(apps: App[], className?: string) {
        super(`main-app-wrapper ${(className || '')}`.trim());

        this.apps = apps;
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

        this.sidebar.onAdminToolSelected((app: App) => {
            this.handleAppSelected(app);
        });

        this.listenAppEvents();
    }

    private handleAppSelected(app: App) {
        this.selectApp(this.getAppById(app.getAppId()));
    }

    private getAppById(appId: DescriptorKey): App {
        return this.apps.find((app: App) => app.getAppId().equals(appId));
    }

    selectApp(app: App) {
        if (!this.hasChild(app.getAppContainer())) {
            this.appendChild(app.getAppContainer());
        }

        AppContext.get().setCurrentApp(app.getAppId());
        this.currentApp?.hide();
        app.show();
        this.currentApp = app;
        this.sidebar.toggleButtonByApp(app);
    }

    private collapseSidebarOnMouseEvent(event: MouseEvent) {
        this.toggleSidebar();

        event.stopPropagation();
        event.preventDefault();
    }

    private handleTouchOutsideSidebar() {
        this.touchListener = (event: MouseEvent) => {
            if (!this.hasClass('sidebar-expanded')) {
                return;
            }

            if (this.sidebar.getButtons().some(
                (button: AppModeButton) => button.getHTMLElement().contains(<HTMLElement>event.target))
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
                s.id = `${adminToolId}JS`;
                s.type = 'text/javascript';
                s.src = mainJsUrl;
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
        this.notifyAppAdded(app);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.toggleSidebarButton, <Element>this.sidebar);

            return rendered;
        });
    }

    hasAppSelected(): boolean {
        return !!this.currentApp;
    }

    onAppAdded(handler: (app: App) => void) {
        this.appAddedListeners.push(handler);
    }

    unAppAdded(handler: (app: App) => void) {
        this.appAddedListeners = this.appAddedListeners.filter((curr: { (app: App): void }) => {
            return handler !== curr;
        });
    }

    private notifyAppAdded(addedApp: App) {
        this.appAddedListeners.forEach((handler: { (app: App): void }) => {
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

    private buttons: AppModeButton[] = [];

    private appModeSelectedListeners: { (app: App): void } [] = [];

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
        this.createButton(app, index);
    }

    toggleButtonByApp(app: App) {
        this.buttons.forEach((b: AppModeButton) => {
            b.toggleSelected(b.getApp().getAppId().equals(app.getAppId()));
        });
    }

    private cleanButtons() {
        this.removeChildren();
        this.buttons = [];
    }

    private initButtons(apps: App[]) {
        apps.forEach((app: App) => {
            this.createButton(app);
        });
    }

    private createButton(app: App, index: number = -1) {
        const contentButton: AppModeButton = new AppModeButton(app);
        this.listenButtonClicked(contentButton);
        this.buttons.push(contentButton);

        if (index > -1) {
            this.insertChild(contentButton, index);
        } else {
            this.appendChild(contentButton);
        }
    }

    private onButtonClicked(button: AppModeButton) {
        this.buttons.forEach((b: AppModeButton) => {
            b.toggleSelected(b === button);
        });

        if (!button.getAppId().equals(AppContext.get().getCurrentApp())) {
            this.notifyAppModeSelected(button.getApp());
        }
    }

    private listenButtonClicked(button: AppModeButton) {
        const clickListener: () => void = () => this.onButtonClicked(button);
        button.onTouchStart(clickListener);
        button.onClicked(clickListener);

        button.onRemoved(() => {
            button.unTouchStart(clickListener);
            button.unClicked(clickListener);
        });
    }

    private notifyAppModeSelected(app: App) {
        this.appModeSelectedListeners.forEach((listener: (tool: App) => void) => {
            listener(app);
        });
    }

    onAppModeSelected(handler: (app: App) => void) {
        this.appModeSelectedListeners.push(handler);
    }

    getButtons(): AppModeButton[] {
        return this.buttons;
    }
}

class AppModeButton
    extends Button {

    private readonly app: App;

    private static SELECTED_CLASS: string = 'selected';

    constructor(app: App) {
        super();

        this.app = app;
        this.setTitle(app.getDisplayName());
        this.toggleClass(AppModeButton.SELECTED_CLASS, app.getAppId().equals(AppContext.get().getCurrentApp()));
        this.addClass(app.getIconClass());
        this.setLabel(app.getDisplayName());
    }

    getAppId(): DescriptorKey {
        return this.app.getAppId();
    }

    getApp(): App {
        return this.app;
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(AppModeButton.SELECTED_CLASS, condition);
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

    onAdminToolSelected(handler: (app: App) => void) {
        this.appModeSwitcher.onAppModeSelected(handler);
    }

    getButtons(): AppModeButton[] {
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

    toggleButtonByApp(app: App) {
        this.appModeSwitcher.toggleButtonByApp(app);
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
