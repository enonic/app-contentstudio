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
import {ProjectContext} from './project/ProjectContext';
import {UrlAction} from './UrlAction';

export class AppWrapper
    extends DivEl {

    private sidebar: DivEl;

    private contentAppContainer: ContentAppContainer;

    private settingsAppContainer: SettingsAppContainer;

    private toggleSidebarButton: Button;

    private application: Application;

    private actionsBlock: ActionsBlock;

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

    private initElements() {
        this.sidebar = new DivEl('sidebar');
        this.toggleSidebarButton = new ToggleIcon();
        this.actionsBlock = new ActionsBlock();
        this.contentAppContainer = new ContentAppContainer(this.application);
        this.settingsAppContainer = new SettingsAppContainer(this.application);

        if (AppContext.get().isMainMode()) {
            this.contentAppContainer.show();
        } else {
            this.settingsAppContainer.show();
        }
    }

    private isSettingsPage(): boolean {
        return window.location.href.indexOf(`${CONFIG.mainUrl}/${AppMode.SETTINGS}`) > -1;
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleClickOutsideSidebar();

        this.actionsBlock.onContentItemPressed(() => {
            if (!AppContext.get().isMainMode()) {
                this.switchToContentApp();
            }
        });

        this.actionsBlock.onSettingsItemPressed(() => {
            if (!AppContext.get().isSettingsMode()) {
                this.switchToSettingsApp();
            }
        });
    }

    private switchToContentApp() {
        history.pushState(null, null, `${AppMode.MAIN}#/${ProjectContext.get().getProject()}/${UrlAction.BROWSE}`);
        AppContext.get().setMode(AppMode.MAIN);
        this.settingsAppContainer.hide();
        this.contentAppContainer.show();
    }

    private switchToSettingsApp() {
        history.pushState(null, null, AppMode.SETTINGS);
        AppContext.get().setMode(AppMode.SETTINGS);
        this.contentAppContainer.hide();
        this.settingsAppContainer.show();
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
            this.sidebar.hide();
            this.sidebar.appendChild(this.createAppNameBlock());
            this.sidebar.appendChildren(this.actionsBlock);
            this.toggleSidebarButton.addClass('sidebar-toggler');
            if (AppContext.get().isMainMode()) {
                this.settingsAppContainer.hide();
            } else {
                this.contentAppContainer.hide();
            }
            this.appendChildren(this.toggleSidebarButton, this.sidebar, this.contentAppContainer, this.settingsAppContainer);

            return rendered;
        });
    }

    private createAppNameBlock(): Element {
        const appNameWrapper: DivEl = new DivEl('app-name-wrapper');
        const appName: SpanEl = new SpanEl('app-name');
        appName.setHtml(this.application.getName());
        appNameWrapper.appendChild(appName);

        return appNameWrapper;
    }
}

class ToggleIcon
    extends Button {

    constructor() {
        super();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const lines: SpanEl = new SpanEl('lines');
            this.appendChild(lines);

            return rendered;
        });
    }
}

class ActionsBlock
    extends DivEl {

    private contentItem: Button;

    private settingsItem: Button;

    constructor() {
        super('actions-block');

        this.initElements();
        this.initActions();
    }

    private initElements() {
        this.createContentButton();
        this.createSettingsButton();
    }

    private createContentButton() {
        const contentButtonName: string = i18n('app.content');
        this.contentItem = new Button(contentButtonName);
        this.contentItem.setTitle(contentButtonName);
        this.contentItem.addClass('icon-version-modified');
        this.contentItem.toggleClass('selected', AppContext.get().isMainMode());

    }

    private createSettingsButton() {
        const settingsButtonName: string = i18n('app.settings');
        this.settingsItem = new Button(settingsButtonName);
        this.settingsItem.setTitle(settingsButtonName);
        this.settingsItem.addClass('icon-cog');
        this.settingsItem.toggleClass('selected', AppContext.get().isSettingsMode());
    }

    private initActions() {
        this.getButtons().forEach((button: Button) => {
            button.onClicked(() => {
                this.getButtons().forEach((b: Button) => {
                    b.toggleClass('selected', b === button);
                })
            });
        });
    }

    private getButtons(): Button[] {
        return [this.contentItem, this.settingsItem];
    }

    onContentItemPressed(handler: () => void) {
        this.contentItem.onClicked(handler);
    }

    onSettingsItemPressed(handler: () => void) {
        this.settingsItem.onClicked(handler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.contentItem, this.settingsItem);

            return rendered;
        });
    }
}
