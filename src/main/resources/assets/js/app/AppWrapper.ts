import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {Application} from 'lib-admin-ui/app/Application';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {Path} from 'lib-admin-ui/rest/Path';
import {MainAppContainer} from './MainAppContainer';
import {SettingsAppContainer} from './settings/SettingsAppContainer';
import {ContentAppContainer} from './ContentAppContainer';

export class AppWrapper
    extends DivEl {

    private sidebar: DivEl;

    private mainPanel: MainAppContainer;

    private toggleIcon: Button;

    private application: Application;

    private actionsBlock: ActionsBlock;

    private mouseClickListener: (event: MouseEvent) => void;

    constructor(application: Application) {
        super('main-app-wrapper');

        this.application = application;

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.sidebar = new DivEl('sidebar');
        this.toggleIcon = new ToggleIcon();
        this.actionsBlock = new ActionsBlock();
        this.mainPanel = this.createMainContainer();
    }

    private createMainContainer(): MainAppContainer {
        if (this.isSettingsPage()) {
            this.actionsBlock.setSettingsItemActive();
            this.updateSettingsUrlIfHashMissing();
            return new SettingsAppContainer(this.application);
        }

        this.actionsBlock.setContentItemActive();
        return new ContentAppContainer(this.application);
    }

    private updateSettingsUrlIfHashMissing() {
        if (this.isSettingsUrlWithNoHash()) {
            window.location.href = `${CONFIG.mainUrl}#/settings`;
        }
    }

    private isSettingsPage(): boolean {
        if (this.isSettingsUrlWithNoHash()) {
            return true;
        }

        const path: Path = this.application.getPath();

        if (path.getElements().length === 0) {
            return false;
        }

        return path.getElement(0) === 'settings';
    }

    private isSettingsUrlWithNoHash(): boolean {
        return window.location.href.endsWith(`${CONFIG.mainUrl}/settings`);
    }

    private initListeners() {
        this.toggleIcon.onClicked(this.toggleState.bind(this));
        this.handleClickOutsideSidebar();
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
            this.toggleIcon.addClass('launcher-button');
            this.appendChildren(this.toggleIcon, this.sidebar, this.mainPanel);

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

    private contentItem: ActionItem;

    private settingsItem: ActionItem;

    constructor() {
        super('actions-block');

        this.initElements();
    }

    private initElements() {
        this.contentItem = new ActionItem(i18n('app.content'));
        this.contentItem.setIconClass('icon-version-modified').setUrl(CONFIG.mainUrl);
        this.settingsItem = new ActionItem(i18n('app.settings'));
        this.settingsItem.setIconClass('icon-cog').setUrl(`${CONFIG.mainUrl}/settings`);
    }

    setContentItemActive() {
        this.contentItem.setIconClass('selected');
    }

    setSettingsItemActive() {
        this.settingsItem.setIconClass('selected');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.contentItem, this.settingsItem);

            return rendered;
        });
    }
}

export class ActionItem
    extends AEl {

    private button: Button;

    constructor(name: string) {
        super('action-item');

        this.button = new Button(name);
        this.button.setTitle(name);
    }

    setIconClass(value: string): ActionItem {
        this.button.addClass(value);

        return this;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.button);

            return rendered;
        });
    }
}
