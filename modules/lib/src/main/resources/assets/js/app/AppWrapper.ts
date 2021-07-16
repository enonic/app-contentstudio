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
import {AppId} from './AppId';
import {App} from './App';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private apps: App[];

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
        this.handleAppSelected(currentApp.getAppId());
    }

    private initElements() {
        this.sidebar = new Sidebar(this.apps);
        this.toggleSidebarButton = new ToggleIcon();
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleTouchOutsideSidebar();

        this.sidebar.onAppModeSelected((appId: AppId) => {
            this.handleAppSelected(appId);
        });
    }

    private handleAppSelected(appId: AppId) {
        const appToShow: App = this.getAppById(appId);

        if (!this.hasChild(appToShow.getAppContainer())) {
            this.appendChild(appToShow.getAppContainer());
        }

        history.pushState(null, null, appToShow.generateAppUrl());
        AppContext.get().setCurrentApp(appId);
        this.currentApp?.hide();
        appToShow.show();
        this.currentApp = appToShow;
    }

    private getAppById(appId: AppId): App {
        return this.apps.find((app: App) => app.getAppId().equals(appId));
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

    private appModeSelectedListeners: { (mode: AppId): void } [] = [];

    constructor(apps: App[]) {
        super('actions-block');

        this.initButtons(apps);
        this.initListeners();
    }

    private initButtons(apps: App[]) {
        apps.forEach((app: App) => {
            this.createButton(app);
        });
    }

    private initListeners() {
        this.buttons.forEach(this.listenButtonClicked.bind(this));
    }

    private createButton(app: App) {
        const contentButton: AppModeButton = new AppModeButton(app.getIconName(), app.getIconClass(), app.getAppId());
        this.buttons.push(contentButton);
    }

    private onButtonClicked(button: AppModeButton) {
        this.buttons.forEach((b: AppModeButton) => {
            b.toggleSelected(b === button);
        });

        if (button.getAppId() !== AppContext.get().getCurrentApp()) {
            this.notifyAppModeSelected(button.getAppId());
        }
    }

    private listenButtonClicked(button: AppModeButton) {
        button.onTouchStart(() => this.onButtonClicked(button));
        button.onClicked(() => this.onButtonClicked(button));
    }

    private notifyAppModeSelected(appId: AppId) {
        this.appModeSelectedListeners.forEach((listener: (id: AppId) => void) => {
            listener(appId);
        });
    }

    onAppModeSelected(handler: (mode: AppId) => void) {
        this.appModeSelectedListeners.push(handler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(...this.buttons);

            return rendered;
        });
    }

    getButtons(): AppModeButton[] {
        return this.buttons;
    }
}

class AppModeButton
    extends Button {

    private readonly appId: AppId;

    private static SELECTED_CLASS: string = 'selected';

    constructor(name: string, iconClass: string, appId: AppId) {
        super(name);

        this.appId = appId;
        this.setTitle(name);
        this.addClass(iconClass);
        this.toggleClass(AppModeButton.SELECTED_CLASS, appId === AppContext.get().getCurrentApp());
    }

    getAppId(): AppId {
        return this.appId;
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(AppModeButton.SELECTED_CLASS, condition);
    }
}

class Sidebar
    extends DivEl {

    private appModeSwitcher: AppModeSwitcher;

    constructor(apps: App[]) {
        super('sidebar');

        this.appModeSwitcher = new AppModeSwitcher(apps);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.hide();
            this.appendChild(this.createAppNameBlock());
            this.appendChildren(this.appModeSwitcher);
            this.appendChild(this.createAppVersionBlock());

            return rendered;
        });
    }

    onAppModeSelected(handler: (mode: AppId) => void) {
        this.appModeSwitcher.onAppModeSelected(handler);
    }

    getButtons(): AppModeButton[] {
        return this.appModeSwitcher.getButtons();
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(AppContext.get().getApplication().getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }

    private createAppVersionBlock(): SpanEl {
        const cleanVersion = StringHelper.cleanVersion(CONFIG.appVersion);
        const appVersionSpan = SpanEl.fromText(`v${cleanVersion}`, 'app-version');
        if (CONFIG.appVersion !== cleanVersion) {
            appVersionSpan.setTitle(`v${CONFIG.appVersion}`);
        }
        return appVersionSpan;
    }
}
