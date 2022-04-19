import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {Element, NewElementBuilder} from 'lib-admin-ui/dom/Element';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';
import {AppContext} from './AppContext';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {TooltipHelper} from './TooltipHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {Store} from 'lib-admin-ui/store/Store';
import {CONFIG} from 'lib-admin-ui/util/Config';
import {GetWidgetsByInterfaceRequest} from './resource/GetWidgetsByInterfaceRequest';
import {Widget, WidgetBuilder, WidgetDescriptorKey} from 'lib-admin-ui/content/Widget';
import {UriHelper} from './rendering/UriHelper';
import {WidgetHelper} from './util/WidgetHelper';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {ContentAppContainer} from './ContentAppContainer';
import {Router} from './Router';
import {UrlAction} from './UrlAction';
import {ContentAppBar} from './bar/ContentAppBar';

export class AppWrapper
    extends DivEl {

    private sidebar: Sidebar;

    private widgets: Widget[] = [];

    private widgetElements: Map<string, Element> = new Map<string, Element>();

    private toggleSidebarButton: Button;

    private appBar: ContentAppBar;

    private widgetsBlock: DivEl;

    private touchListener: (event: TouchEvent) => void;

    private widgetAddedListeners: { (Widget): void }[] = [];

    constructor(className?: string) {
        super(`main-app-wrapper ${(className || '')}`.trim());

        this.initElements();
        this.initListeners();
        this.addStudioWidget();
        this.updateSidebarWidgets();
        this.toggleSidebar();
        TooltipHelper.init();
    }

    private initElements() {
        this.sidebar = new Sidebar();
        this.toggleSidebarButton = new ToggleIcon();
        this.appBar = ContentAppBar.getInstance();
        this.widgetsBlock = new DivEl('widgets-block');
    }

    private initListeners() {
        this.toggleSidebarButton.onClicked(this.toggleSidebar.bind(this));
        this.handleTouchOutsideSidebar();

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
        this.sidebar.addWidget(studioWidget, 'icon-version-modified');
    }

    private createStudioWidget(): Widget {
        const studioWidgetBuilder: WidgetBuilder = Widget.create();

        studioWidgetBuilder.widgetDescriptorKey = WidgetDescriptorKey.fromString(`${CONFIG.get('appId')}:main`);
        studioWidgetBuilder.displayName = i18n('app.name');
        studioWidgetBuilder.url = UrlAction.BROWSE;
        studioWidgetBuilder.config = {
            context: 'project'
        };

        return studioWidgetBuilder.build();
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
        Array.from(this.widgetElements.values()).forEach((el: Element) => el.hide());
        AppContext.get().setWidget(widget);
        this.updateUrl(widget);

        const key: string = widget.getWidgetDescriptorKey().toString();

        if (this.widgetElements.has(key)) {
            this.widgetElements.get(key).show();
        } else {
            this.fetchAndAppendWidget(widget);
        }

        const isProjectSelectorShown: boolean = widget.getConfig()['context'] === 'project';

        if (isProjectSelectorShown) {
            this.appBar.showProjectSelector();
        } else {
            this.appBar.hideProjectSelector();
        }

        this.appBar.setAppName(widget.getDisplayName());

        this.sidebar.toggleActiveButton();
    }

    private updateUrl(widget: Widget): void {
        if (widget.getUrl() === UrlAction.BROWSE) {
            Router.get().setHash(UrlAction.BROWSE);
            return;
        }

        const appKeyLastPart: string = widget.getWidgetDescriptorKey().getApplicationKey().getName().split('.').pop();
        const widgetName: string = widget.getWidgetDescriptorKey().getName();
        Router.get().setHash(`widget/${appKeyLastPart}/${widgetName}`);
    }

    private fetchAndAppendWidget(widget: Widget): void {
        if (widget === this.widgets[0]) { // default studio app
            const widgetEl: Element = this.createStudioWidgetEl();
            this.widgetElements.set(widget.getWidgetDescriptorKey().toString(), widgetEl);
            this.widgetsBlock.appendChild(widgetEl);
            return;
        }

        fetch(UriHelper.getAdminUri(widget.getUrl(), '/'))
            .then(response => response.text())
            .then((html: string) => {
                const widgetElem: Element = WidgetHelper.injectWidgetHtml(html, this.widgetsBlock).widgetContainer;
                this.widgetElements.set(widget.getWidgetDescriptorKey().toString(), widgetElem);
            })
            .catch(err => {
                throw new Error('Failed to fetch widget: ' + err);
            });
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

    private updateSidebarWidgets() {
        new GetWidgetsByInterfaceRequest(['contentstudio.menuitem']).sendAndParse().then((widgets: Widget[]) => {
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
        const debouncedAdminToolUpdate: Function = AppHelper.debounce(() => {
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
            this.appendChildren(this.toggleSidebarButton, <Element>this.sidebar, headerAndWidgetsBlock);

            return rendered;
        });
    }

    onItemAdded(handler: (item: Widget) => void) {
        this.widgetAddedListeners.push(handler);
    }

    unItemAdded(handler: (item: Widget) => void) {
        this.widgetAddedListeners = this.widgetAddedListeners.filter((curr: { (widget: Widget): void }) => {
            return handler !== curr;
        });
    }

    private notifyItemAdded(item: Widget) {
        this.widgetAddedListeners.forEach((handler: { (widget: Widget): void }) => {
            handler(item);
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

    addWidget(widget: Widget, buttonClass?: string): void {
        this.createWidgetButton(widget, buttonClass);
    }

    private createWidgetButton(widget: Widget, buttonClass?: string) {
        const sidebarButton: SidebarButton = new SidebarButton(widget.getWidgetDescriptorKey().toString());
        sidebarButton.setLabel(widget.getDisplayName());
        sidebarButton.setTitle(widget.getDisplayName());

        if (buttonClass) {
            sidebarButton.addClass(buttonClass);
        }

        const imgEl: ImgEl = new ImgEl(widget.getIconUrl());
        sidebarButton.appendChild(imgEl);

        this.listenButtonClicked(sidebarButton);

        const pos: number = this.getButtonPos(sidebarButton);

        if (pos < 0) {
            this.appendChild(sidebarButton);
        } else {
            this.insertChild(sidebarButton, pos);
        }

        this.buttons.push(sidebarButton);
    }

    toggleActiveButton() {
        this.buttons.forEach((b: SidebarButton) => {
            b.toggleSelected(b.getWidgetId() === AppContext.get().getCurrentAppOrWidgetId());
        });
    }

    private getButtonPos(sidebarButton: SidebarButton): number {
        if (sidebarButton.getWidgetId().endsWith('studio:main')) {
            return 0;
        }

        if (this.buttons.some((button: SidebarButton) => button.getWidgetId().endsWith('studio:settings'))) {
            return this.buttons.length - 1;
        }

        return -1;
    }

    private onButtonClicked(button: SidebarButton) {
        this.buttons.forEach((b: Button) => {
            b.toggleClass(SidebarButton.SELECTED_CLASS, b === button);
        });

        if (button.getWidgetId() !== AppContext.get().getCurrentAppOrWidgetId()) {
            this.notifyItemSelected(button.getWidgetId());
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

    removeWidget(widget: Widget): void {
        this.removeButtonById(widget.getWidgetDescriptorKey().toString());
    }

    private removeButtonById(itemId: string): void {
        const buttonToRemove: SidebarButton = this.buttons.find((b: SidebarButton) => b.getWidgetId() === itemId);

        if (buttonToRemove) {
            this.buttons = this.buttons.filter((b: SidebarButton) => b !== buttonToRemove);
            buttonToRemove.remove();
        }
    }

    private notifyItemSelected(itemId: string) {
        this.itemSelectedListeners.forEach((listener: (id: string) => void) => {
            listener(itemId);
        });
    }

    onItemSelected(handler: (itemId: string) => void) {
        this.itemSelectedListeners.push(handler);
    }

    getButtons(): Button[] {
        return this.buttons;
    }
}

class SidebarButton
    extends Button {

    private readonly widgetId: string;

    static SELECTED_CLASS: string = 'selected';

    constructor(widgetId: string) {
        super();

        this.widgetId = widgetId;
        this.toggleClass(SidebarButton.SELECTED_CLASS, widgetId === AppContext.get().getCurrentAppOrWidgetId());
    }

    getWidgetId(): string {
        return this.widgetId;
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

    addWidget(widget: Widget, buttonClass?: string): void {
        this.appModeSwitcher.addWidget(widget, buttonClass);
    }

    toggleActiveButton() {
        this.appModeSwitcher.toggleActiveButton();
    }

    removeWidget(widget: Widget): void {
        this.appModeSwitcher.removeWidget(widget);
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
