import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Application} from 'lib-admin-ui/app/Application';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {Path} from 'lib-admin-ui/rest/Path';
import {MainAppContainer} from './MainAppContainer';
import {SettingsAppContainer} from './settings/SettingsAppContainer';
import {ContentAppContainer} from './ContentAppContainer';
import {SettingsServerEventsListener} from './settings/event/SettingsServerEventsListener';
import {ContentEventsListener} from './ContentEventsListener';
import {AppContext} from './AppContext';
import {AppMode} from './AppMode';
import {ProjectContext} from './project/ProjectContext';
import {ContentAppMode} from './ContentAppMode';

export class AppWrapper
    extends DivEl {

    private sidebar: DivEl;

    private mainPanel: MainAppContainer;

    private settingsPanel: SettingsAppContainer;

    private toggleIcon: Button;

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
        AppContext.get().setMode(this.isSettingsPage() ? AppMode.SETTINGS : AppMode.MAIN);
    }

    private initElements() {
        this.sidebar = new DivEl('sidebar');
        this.toggleIcon = new ToggleIcon();
        this.actionsBlock = new ActionsBlock();
        this.mainPanel = new ContentAppContainer(this.application);
        this.settingsPanel = new SettingsAppContainer(this.application);
    }

    private isSettingsPage(): boolean {
        if (this.isSettingsUrlWithNoHash()) {
            return true;
        }

        const path: Path = this.application.getPath();

        if (path.getElements().length === 0) {
            return false;
        }

        return path.getElement(0) === AppMode.SETTINGS;
    }

    private isSettingsUrlWithNoHash(): boolean {
        return window.location.href.endsWith(`${CONFIG.mainUrl}/${AppMode.SETTINGS}`);
    }

    private initListeners() {
        this.toggleIcon.onClicked(this.toggleState.bind(this));
        this.handleClickOutsideSidebar();

        const settingsServerEventsListener = new SettingsServerEventsListener([this.application]);
        settingsServerEventsListener.start();

        const clientEventsListener = new ContentEventsListener();
        clientEventsListener.start();

        this.actionsBlock.onContentItemPressed(() => {
            if (AppContext.get().isMainMode()) {
                return;
            }

            history.pushState(null, null, `${AppMode.MAIN}#/${ProjectContext.get().getProject()}/${ContentAppMode.BROWSE}`);
            AppContext.get().setMode(AppMode.MAIN);
            this.settingsPanel.hide();
            this.mainPanel.show();
        });

        this.actionsBlock.onSettingsItemPressed(() => {
            if (AppContext.get().isSettingsMode()) {
                return;
            }

            history.pushState(null, null, AppMode.SETTINGS);
            AppContext.get().setMode(AppMode.SETTINGS);
            this.mainPanel.hide();
            this.settingsPanel.show();
        });
    }

    private handleClickOutsideSidebar() {
        this.mouseClickListener = (event: MouseEvent) => {
            if (screen && screen.width > 540) {
                // Don't auto-collapse the toolbar under desktop resolutions
                return;
            }
            if (this.hasClass('sidebar-expanded')) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.sidebar.getHTMLElement() || element === this.toggleIcon.getHTMLElement()) {
                        return;
                    }
                }
                this.toggleState();
            }
        };
    }

    private toggleState() {
        this.sidebar.show();
        const isSidebarVisible: boolean = this.hasClass('sidebar-expanded');
        this.toggleClass('sidebar-expanded', !isSidebarVisible);
        this.toggleIcon.toggleClass('toggled', !isSidebarVisible);
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
            this.toggleIcon.addClass('sidebar-toggler');
            if (AppContext.get().isMainMode()) {
                this.settingsPanel.hide();
            } else {
                this.mainPanel.hide();
            }
            this.appendChildren(this.toggleIcon, this.sidebar, this.mainPanel, this.settingsPanel);

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
        this.contentItem = new Button(i18n('app.content'));
        this.contentItem.addClass('icon-version-modified');
        this.settingsItem = new Button(i18n('app.settings'));
        this.settingsItem.addClass('icon-cog');

        if (AppContext.get().isMainMode()) {
            this.contentItem.addClass('selected');
        } else {
            this.settingsItem.addClass('selected');
        }
    }

    private initActions() {
        this.contentItem.onClicked(() => {
            this.contentItem.addClass('selected');
            this.settingsItem.removeClass('selected');
        });

        this.settingsItem.onClicked(() => {
            this.settingsItem.addClass('selected');
            this.contentItem.removeClass('selected');
        });
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
