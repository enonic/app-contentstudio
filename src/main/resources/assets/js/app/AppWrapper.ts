import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Application} from 'lib-admin-ui/app/Application';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {AppContext} from './AppContext';
import {AppMode} from './AppMode';
import {MainAppContainer} from './MainAppContainer';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {AppContainerFactory} from './AppContainerFactory';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private appContainers: Map<AppMode, MainAppContainer> = new Map<AppMode, MainAppContainer>();

    private currentAppContainer: MainAppContainer;

    private toggleSidebarButton: Button;

    private touchListener: (event: MouseEvent) => void;

    constructor(application: Application, className?: string) {
        super(`main-app-wrapper ${(className || '')}`.trim());

        this.initAppContext(application);
        this.initElements();
        this.initListeners();
        this.startInitialAppContainer();
    }

    private initAppContext(application: Application) {
        AppContext.get().setMode(this.getAppMode());
        AppContext.get().setApplication(application);
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
        this.sidebar = new Sidebar();
        this.toggleSidebarButton = new ToggleIcon();
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleTouchOutsideSidebar();

        this.sidebar.onAppModeSelected((mode: AppMode) => {
            this.handleAppSelected(mode);
        });
    }

    private handleAppSelected(mode: AppMode) {
        const appToShow: MainAppContainer = this.getOrCreateAppContainerByMode(mode);
        history.pushState(null, null, appToShow.generateAppUrl());
        AppContext.get().setMode(mode);
        this.currentAppContainer.hide();
        appToShow.show();
        this.currentAppContainer = appToShow;
    }

    private getOrCreateAppContainerByMode(mode: AppMode): MainAppContainer {
        if (this.appContainers.has(mode)) {
            return this.appContainers.get(mode);
        }

        return this.createAppContainer(mode);
    }

    private createAppContainer(mode: AppMode): MainAppContainer {
        const appContainer: MainAppContainer = AppContainerFactory.get().createApp(mode);
        this.appContainers.set(mode, appContainer);
        this.appendChild(appContainer);

        return appContainer;
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

    private startInitialAppContainer() {
        const appContainer: MainAppContainer = this.createAppContainer(AppContext.get().getMode());
        appContainer.show();
        this.currentAppContainer = appContainer;
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

    private appModeSelectedListeners: { (mode: AppMode): void } [] = [];

    constructor() {
        super('actions-block');

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.createContentButton();
        this.createSettingsButton();
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

    private onButtonClicked(button: AppModeButton) {
        this.buttons.forEach((b: AppModeButton) => {
            b.toggleSelected(b === button);
        });

        if (button.getMode() !== AppContext.get().getMode()) {
            this.notifyAppModeSelected(button.getMode());
        }
    }

    private listenButtonClicked(button: AppModeButton) {
        button.onTouchStart(() => this.onButtonClicked(button));
        button.onClicked(() => this.onButtonClicked(button));
    }

    private notifyAppModeSelected(mode: AppMode) {
        this.appModeSelectedListeners.forEach((listener: (mode: AppMode) => void) => {
            listener(mode);
        });
    }

    onAppModeSelected(handler: (mode: AppMode) => void) {
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

    private appModeSwitcher: AppModeSwitcher;

    constructor() {
        super('sidebar');

        this.appModeSwitcher = new AppModeSwitcher();
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

    onAppModeSelected(handler: (mode: AppMode) => void) {
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
