import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Application} from 'lib-admin-ui/app/Application';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {SettingsAppContainer} from './settings/SettingsAppContainer';
import {ContentAppContainer} from './ContentAppContainer';
import {AppContext} from './AppContext';
import {AppMode} from './AppMode';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {MainAppContainer} from './MainAppContainer';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private appContainers: MainAppContainer[] = [];

    private toggleSidebarButton: Button;

    private application: Application;

    private mouseClickListener: (event: MouseEvent) => void;

    constructor(application: Application) {
        super('main-app-wrapper');

        this.application = application;

        this.initAppMode();
        this.initElements();
        this.initListeners();
    }

    private initAppMode() {
        AppContext.get().setMode(this.getAppMode());
    }

    private getAppMode(): AppMode {
        if (this.isSettingsPage()) {
            return AppMode.SETTINGS;
        }

        return AppMode.MAIN;
    }

    private isSettingsPage(): boolean {
        return window.location.href.indexOf(`${CONFIG.mainUrl}/${AppMode.SETTINGS}`) > -1;
    }

    private initElements() {
        this.sidebar = new Sidebar(this.application);
        this.toggleSidebarButton = new ToggleIcon();
        this.initAppContainers();
    }

    private initAppContainers() {
        const contentAppContainer: MainAppContainer = new ContentAppContainer(this.application);
        contentAppContainer.hide();
        this.appContainers.push(contentAppContainer);

        if (AppContext.get().isSettingsMode()) {
            const settingsAppContainer: MainAppContainer = this.addSettings();
            settingsAppContainer.show();
        } else {
            contentAppContainer.show();
            new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
                if (loginResult.isContentAdmin()) {
                    this.addSettings();
                }
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private addSettings(): MainAppContainer {
        const settingsAppContainer: MainAppContainer = new SettingsAppContainer(this.application);
        settingsAppContainer.hide();
        this.appContainers.push(settingsAppContainer);
        this.sidebar.addSettingsButton();

        if (this.isRendered()) {
            this.appendChild(settingsAppContainer);
        } else {
            this.onRendered(() => {
                this.appendChild(settingsAppContainer);
            });
        }

        return settingsAppContainer;
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleClickOutsideSidebar();

        this.sidebar.onAppModeSelected((mode: AppMode) => {
            const containerToHide: MainAppContainer = this.getAppContainerByMode(AppContext.get().getMode());
            const containerToShow: MainAppContainer = this.getAppContainerByMode(mode);
            history.pushState(null, null, containerToShow.generateAppUrl());
            AppContext.get().setMode(mode);
            containerToHide.hide();
            containerToShow.show();
        });
    }

    private getAppContainerByMode(mode: AppMode): MainAppContainer {
        return this.appContainers.filter((appContainer: MainAppContainer) => appContainer.getMode() === mode)[0];
    }

    private handleClickOutsideSidebar() {
        this.mouseClickListener = (event: MouseEvent) => {
            if (screen && screen.width > 540) {
                // Don't auto-collapse the toolbar under desktop resolutions
                return;
            }
            if (this.hasClass('sidebar-expanded')) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.sidebar.getHTMLElement() || element === this.toggleSidebarButton.getHTMLElement()) {
                        return;
                    }
                }
                this.toggleSidebar();
            }
        };
    }

    private toggleSidebar() {
        this.sidebar.show();
        const isSidebarVisible: boolean = this.hasClass('sidebar-expanded');
        this.toggleClass('sidebar-expanded', !isSidebarVisible);
        this.toggleSidebarButton.toggleClass('toggled', !isSidebarVisible);
        if (!isSidebarVisible) {
            Body.get().onMouseDown(this.mouseClickListener);
        } else {
            Body.get().unMouseDown(this.mouseClickListener);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.toggleSidebarButton, <Element>this.sidebar, ...this.appContainers);

            return rendered;
        });
    }

}

class ToggleIcon
    extends Button {

    constructor() {
        super();
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

    private appModeSelectedListeners: { (mode: AppMode): void } [] = [];

    constructor() {
        super('actions-block');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.createContentButton();
    }

    private initListeners() {
        this.buttons.forEach(this.listenButtonClicked.bind(this));
    }

    private createContentButton() {
        const name: string = i18n('app.content');
        const contentButton: AppModeButton = new AppModeButton(name, 'icon-version-modified', AppMode.MAIN);
        this.buttons.push(contentButton);
    }

    private createSettingsButton(): AppModeButton {
        const name: string = i18n('app.settings');
        const settingsButton: AppModeButton = new AppModeButton(name, 'icon-cog', AppMode.SETTINGS);
        this.buttons.push(settingsButton);

        return settingsButton;
    }

    private listenButtonClicked(button: AppModeButton) {
        button.onClicked(() => {
            this.buttons.forEach((b: AppModeButton) => {
                b.toggleSelected(b === button);
            });

            if (button.getMode() !== AppContext.get().getMode()) {
                this.notifyAppModeSelected(button.getMode());
            }
        });
    }

    private notifyAppModeSelected(mode: AppMode) {
        this.appModeSelectedListeners.forEach((listener: (mode: AppMode) => void) => {
            listener(mode);
        });
    }

    onAppModeSelected(handler: (mode: AppMode) => void) {
        this.appModeSelectedListeners.push(handler);
    }

    addSettingsButton() {
        const settingsButton: AppModeButton = this.createSettingsButton();

        this.listenButtonClicked(settingsButton);

        if (this.isRendered()) {
            this.appendChild(settingsButton);
        } else {
            this.onRendered(() => {
                this.insertChild(settingsButton, 1);
            });
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(...this.buttons);

            return rendered;
        });
    }
}

class AppModeButton
    extends Button {

    private mode: AppMode;

    private static SELECTED_CLASS: string = 'selected';

    constructor(name: string, iconClass: string, mode: AppMode) {
        super(name);

        this.mode = mode;
        this.setTitle(name);
        this.addClass(iconClass);
        this.toggleClass(AppModeButton.SELECTED_CLASS, mode === AppContext.get().getMode());
    }

    getMode(): AppMode {
        return this.mode;
    }

    toggleSelected(condition: boolean) {
        this.toggleClass(AppModeButton.SELECTED_CLASS, condition);
    }
}

class Sidebar
    extends DivEl {

    private application: Application;

    private appModeSwitcher: AppModeSwitcher;

    constructor(application: Application) {
        super('sidebar');

        this.application = application;
        this.appModeSwitcher = new AppModeSwitcher();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.hide();
            this.appendChild(this.createAppNameBlock());
            this.appendChildren(this.appModeSwitcher);

            return rendered;
        });
    }

    addSettingsButton() {
        this.appModeSwitcher.addSettingsButton();
    }

    onAppModeSelected(handler: (mode: AppMode) => void) {
        this.appModeSwitcher.onAppModeSelected(handler);
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(this.application.getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }
}
