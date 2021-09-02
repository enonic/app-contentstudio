import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Application} from 'lib-admin-ui/app/Application';
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

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private apps: App[];

    private adminTools: AdminTool[];

    private currentApp: App;

    private toggleSidebarButton: Button;

    private touchListener: (event: MouseEvent) => void;

    constructor(application: Application, currentApp: App, apps: App[], className?: string) {
        super(`main-app-wrapper ${(className || '')}`.trim());

        this.apps = apps;
        AppContext.get().setCurrentApp(currentApp.getAppId());
        AppContext.get().setApplication(application);
        this.initElements();
        this.initListeners();
        this.selectApp(currentApp);
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

        this.sidebar.onAdminToolSelected((adminTool: AdminTool) => {
            this.handleAppSelected(adminTool);
        });

        this.listenAppEvents();
    }

    private handleAppSelected(adminTool: AdminTool) {
        if (!this.containsApp(adminTool.getKey())) {
            window.location.href = adminTool.getUri();
        } else {
            this.selectApp(this.getAppById(adminTool.getKey()));
        }
    }

    private containsApp(id: DescriptorKey): boolean {
        return !!this.getAppById(id);
    }

    private getAppById(appId: DescriptorKey): App {
        return this.apps.find((app: App) => app.getAppId().equals(appId));
    }

    private selectApp(app: App) {
        if (!this.hasChild(app.getAppContainer())) {
            this.appendChild(app.getAppContainer());
        }

        history.pushState(null, null, app.generateAppUrl());
        AppContext.get().setCurrentApp(app.getAppId());
        this.currentApp?.hide();
        app.show();
        this.currentApp = app;
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
            this.sidebar.setAdminTools(adminTools);
        }).catch(DefaultErrorHandler.handle);
    }

    private listenAppEvents() {
        const debouncedAdminToolUpdate = AppHelper.debounce(() => {
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.toggleSidebarButton, <Element>this.sidebar);

            return rendered;
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

    private appModeSelectedListeners: { (adminTool: AdminTool): void } [] = [];

    constructor() {
        super('actions-block');
    }

    setAdminTools(adminTools: AdminTool[]) {
        this.cleanButtons();
        this.initButtons(adminTools);
        this.initListeners();
        this.appendChildren(...this.buttons);
    }

    private cleanButtons() {
        this.removeChildren();
        this.buttons = [];
    }

    private initButtons(adminTools: AdminTool[]) {
        adminTools.forEach((tool: AdminTool) => {
            this.createButton(tool);
        });
    }

    private initListeners() {
        this.buttons.forEach(this.listenButtonClicked.bind(this));
    }

    private createButton(adminTool: AdminTool) {
        const contentButton: AppModeButton = new AppModeButton(adminTool);
        this.buttons.push(contentButton);
    }

    private onButtonClicked(button: AppModeButton) {
        this.buttons.forEach((b: AppModeButton) => {
            b.toggleSelected(b === button);
        });

        if (!button.getAppId().equals(AppContext.get().getCurrentApp())) {
            this.notifyAppModeSelected(button.getAdminTool());
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

    private notifyAppModeSelected(adminTool: AdminTool) {
        this.appModeSelectedListeners.forEach((listener: (tool: AdminTool) => void) => {
            listener(adminTool);
        });
    }

    onAppModeSelected(handler: (adminTool: AdminTool) => void) {
        this.appModeSelectedListeners.push(handler);
    }

    getButtons(): AppModeButton[] {
        return this.buttons;
    }

    getAdminTools(): AdminTool[] {
        return this.buttons.map((b: AppModeButton) => b.getAdminTool());
    }
}

class AppModeButton
    extends Button {

    private readonly adminTool: AdminTool;

    private static SELECTED_CLASS: string = 'selected';

    constructor(adminTool: AdminTool) {
        super();

        this.adminTool = adminTool;
        this.setTitle(adminTool.getDisplayName());
        this.toggleClass(AppModeButton.SELECTED_CLASS, adminTool.getKey().equals(AppContext.get().getCurrentApp()));
        this.prependChild(Element.fromString(`<div class="icon">${adminTool.getIcon()}</div>`));
        this.setLabel(adminTool.getDisplayName());
    }

    getAppId(): DescriptorKey {
        return this.adminTool.getKey();
    }

    getAdminTool(): AdminTool {
        return this.adminTool;
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

    onAdminToolSelected(handler: (adminTool: AdminTool) => void) {
        this.appModeSwitcher.onAppModeSelected(handler);
    }

    getButtons(): AppModeButton[] {
        return this.appModeSwitcher.getButtons();
    }

    setAdminTools(adminTools: AdminTool[]) {
        this.appModeSwitcher.setAdminTools(adminTools);
    }

    getAdminTools(): AdminTool[] {
        return this.appModeSwitcher.getAdminTools();
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(AppContext.get().getApplication().getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }

    private createAppVersionBlock(): DivEl {
        const cleanVersion: string = StringHelper.cleanVersion(CONFIG.appVersion);
        const appVersionSpan: DivEl = new DivEl('app-version');
        appVersionSpan.setHtml(`v${cleanVersion}`);

        if (CONFIG.appVersion !== cleanVersion) {
            appVersionSpan.setTitle(`v${CONFIG.appVersion}`);
        }

        return appVersionSpan;
    }
}
