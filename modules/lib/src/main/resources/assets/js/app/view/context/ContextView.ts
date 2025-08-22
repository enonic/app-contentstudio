import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {EmulatedEvent} from '../../event/EmulatedEvent';
import {InspectEvent} from '../../event/InspectEvent';
import {GetWidgetsByInterfaceRequest} from '../../resource/GetWidgetsByInterfaceRequest';
import {UserAccessWidgetItemView} from '../../security/UserAccessWidgetItemView';
import {ContextWindow} from '../../wizard/page/contextwindow/ContextWindow';
import {ShowLiveEditEvent} from '../../wizard/ShowLiveEditEvent';
import {ShowSplitEditEvent} from '../../wizard/ShowSplitEditEvent';
import {ReloadActiveWidgetEvent} from './ReloadActiveWidgetEvent';
import {DependenciesWidgetItemView} from './widget/dependency/DependenciesWidgetItemView';
import {AttachmentsWidgetItemView} from './widget/details/AttachmentsWidgetItemView';
import {BasePropertiesWidgetItemView} from './widget/details/BasePropertiesWidgetItemView';
import {ContentWidgetItemView} from './widget/details/ContentWidgetItemView';
import {OnlinePropertiesWidgetItemView} from './widget/details/OnlinePropertiesWidgetItemView';
import {PageTemplateWidgetItemView} from './widget/details/PageTemplateWidgetItemView';
import {StatusWidgetItemView} from './widget/details/StatusWidgetItemView';
import {EmulatorDevice} from './widget/emulator/EmulatorDevice';
import {EmulatorWidgetItemView} from './widget/emulator/EmulatorWidgetItemView';
import {PageEditorWidgetItemView} from './widget/pageeditor/PageEditorWidgetItemView';
import {VersionContext} from './widget/version/VersionContext';
import {VersionHistoryView} from './widget/version/VersionHistoryView';
import {WidgetItemView} from './WidgetItemView';
import {WidgetsSelectionRow} from './WidgetsSelectionRow';
import {InternalWidgetType, WidgetView} from './WidgetView';
import {ShowContentFormEvent} from '../../wizard/ShowContentFormEvent';

export class ContextView
    extends DivEl {

    protected widgetViews: WidgetView[] = [];
    protected contextContainer: DivEl;
    protected widgetsSelectionRow: WidgetsSelectionRow;

    protected loadMask: LoadMask;
    protected divForNoSelection: DivEl;

    protected item: ContentSummaryAndCompareStatus;

    protected activeWidget: WidgetView;
    private defaultWidgetView: WidgetView;

    protected pageEditorWidgetView?: WidgetView;
    protected pageEditorWidgetItemView?: PageEditorWidgetItemView;
    protected propertiesWidgetView: WidgetView;
    protected versionsWidgetView: WidgetView;
    protected emulatorWidgetView?: WidgetView;

    protected contextWindow?: ContextWindow;
    protected alreadyFetchedCustomWidgets: boolean;

    protected isPageRenderable: boolean;
    private sizeChangedListeners: (() => void)[] = [];

    private widgetsUpdateList: Record<string, (key: string, type: ApplicationEventType) => void> = {};

    public static debug: boolean = false;
    private editorMode: boolean;

    constructor(editorMode: boolean = false) {
        super('context-panel-view');

        this.editorMode = editorMode;

        this.contextContainer = new DivEl('context-container');

        this.loadMask = new LoadMask(this);
        this.loadMask.addClass('context-panel-mask');
        this.appendChild(this.loadMask);

        this.initCommonWidgetViews();
        this.initDivForNoSelection();
        this.initWidgetsSelectionRow();

        this.appendChild(this.contextContainer);
        this.appendChild(this.divForNoSelection);

        this.subscribeToEvents();

        this.layout();

        this.getCustomWidgetViewsAndUpdateDropdown();
    }

    private subscribeToEvents() {
        const handleApplicationEvents = (e) => this.handleApplicationEvents(e);
        ApplicationEvent.on(handleApplicationEvents);
        this.onRemoved(() => ApplicationEvent.un(handleApplicationEvents));

        VersionContext.onActiveVersionChanged((contentId: string, version: string) => {
            if (this.item?.getId() === contentId && this.isVisible() && this.activeWidget === this.versionsWidgetView) {
                this.updateActiveWidget();
            }
        });

        const createPageEditorVisibilityChangedHandler = (visible: boolean) => () => {
            this.updateSelectedWidget();
        };

        ShowLiveEditEvent.on(createPageEditorVisibilityChangedHandler(true));
        ShowSplitEditEvent.on(createPageEditorVisibilityChangedHandler(true));
        ShowContentFormEvent.on(createPageEditorVisibilityChangedHandler(false));

        const contentServerEventsHandler = ContentServerEventsHandler.getInstance();

        contentServerEventsHandler.onContentPermissionsUpdated((contents: ContentSummaryAndCompareStatus[]) => {
            const itemSelected: boolean = this.item != null;
            const activeWidgetVisible: boolean = this.activeWidget != null && this.isVisible();

            if (activeWidgetVisible && this.activeWidget.isInternal() && itemSelected &&
                ContentSummaryAndCompareStatus.isInArray(this.item.getContentId(), contents)) {
                this.updateActiveWidget();
            }
        });

        contentServerEventsHandler.onContentPublished((contents: ContentSummaryAndCompareStatus[]) => {
            if (!this.item) {
                return;
            }

            const itemId: string = this.item.getId();

            contents
                .filter((content: ContentSummaryAndCompareStatus) => content.getId() === itemId)
                .forEach((content: ContentSummaryAndCompareStatus) => {
                    const isSameContent: boolean = this.item.equals(content);
                    const wasModified: boolean = this.item.getCompareStatus() !== CompareStatus.NEW;

                    if (!isSameContent && wasModified) {
                        this.setItem(content);
                    }
                });
        });

        ReloadActiveWidgetEvent.on(() => {
            if (this.activeWidget) {
                this.activeWidget.updateWidgetItemViews().catch(DefaultErrorHandler.handle);
            }
        });
    }

    private initDivForNoSelection() {
        this.divForNoSelection = new DivEl('no-selection-message');
        this.divForNoSelection.getEl().setInnerHtml(i18n('field.contextPanel.empty'));
        this.appendChild(this.divForNoSelection);
    }

    private initWidgetsSelectionRow() {
        this.widgetsSelectionRow = new WidgetsSelectionRow();
        this.appendChild(this.widgetsSelectionRow);
        this.widgetsSelectionRow.updateState(this.activeWidget);
    }

    private handleApplicationEvents(event: ApplicationEvent) {
        const isWidgetUpdated = [
                                    ApplicationEventType.INSTALLED,
                                    ApplicationEventType.UNINSTALLED,
                                    ApplicationEventType.STARTED,
                                    ApplicationEventType.STOPPED,
                                    ApplicationEventType.UPDATED
                                ].indexOf(event.getEventType()) > -1;

        if (isWidgetUpdated) {
            const key = event.getApplicationKey().getName();

            if (!this.widgetsUpdateList[key]) {
                this.widgetsUpdateList[key] = AppHelper.debounce((k, type) => this.handleWidgetUpdate(k, type), 1000);
            }
            this.widgetsUpdateList[key](key, event.getEventType());
        }
    }

    private handleWidgetUpdate(key: string, type: ApplicationEventType) {
        if (this.isWidgetRemoveEvent(type)) {
            this.handleWidgetRemoveEvent(key);
        } else if (!!this.getWidgetByKey(key)) {
            this.handleWidgetUpdateEvent(key);
        } else {
            this.handleWidgetAddedEvent(key);
        }
    }

    private isWidgetRemoveEvent(type: ApplicationEventType): boolean {
        return [
                   ApplicationEventType.UNINSTALLED,
                   ApplicationEventType.STOPPED
               ].indexOf(type) > -1;
    }

    private handleWidgetRemoveEvent(key: string) {
        this.removeWidgetByKey(key);

        if (this.isActiveWidget(key)) {
            this.activateDefaultWidget();
        }

        this.updateView();
    }

    private isActiveWidgetByType(view: WidgetView): boolean {
        return view?.compareByType(this.activeWidget);
    }

    private isActiveWidget(key: string): boolean {
        return this.activeWidget && this.activeWidget.getWidgetKey() === key;
    }

    private handleWidgetUpdateEvent(key: string) {
        this.fetchWidgetByKey(key).then((widget: Widget) => {
            const widgetView: WidgetView =
                WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
            this.updateWidget(widgetView);

            if (this.isActiveWidget(key)) {
                this.resetActiveWidget();
                widgetView.setActive();
            }

            this.updateView();
        });
    }

    private handleWidgetAddedEvent(key: string) {
        this.fetchWidgetByKey(key).then((widget: Widget) => {
            const widgetView: WidgetView =
                WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
            this.addWidget(widgetView);
            this.updateView();
        });
    }

    private updateView() {
        this.widgetsSelectionRow.updateWidgetsDropdown(this.widgetViews);
        this.widgetsSelectionRow.updateState(this.activeWidget);
    }

    getCustomWidgetViewsAndUpdateDropdown(): Q.Promise<void> {
        let deferred = Q.defer<void>();
        if (!this.alreadyFetchedCustomWidgets) {
            this.fetchAndInitCustomWidgetViews().then(() => {
                this.widgetsSelectionRow.updateWidgetsDropdown(this.widgetViews);
                this.alreadyFetchedCustomWidgets = true;
                deferred.resolve(null);
            });
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    setActiveWidget(widgetView: WidgetView) {
        if (this.activeWidget) {
            this.activeWidget.setInactive();
        }

        this.activeWidget = widgetView;
        this.activeWidget.addClass('active');

        this.toggleClass('default-widget', this.defaultWidgetView.isActive());
        this.toggleClass('internal', widgetView.isInternal());
        this.toggleClass('emulator', widgetView.isEmulator());

        if (this.widgetsSelectionRow) {
            this.widgetsSelectionRow.updateState(this.activeWidget);
        }
    }

    getActiveWidget(): WidgetView {
        return this.activeWidget;
    }

    resetActiveWidget() {
        if (this.activeWidget) {
            this.activeWidget.removeClass('active');
        }
        this.activeWidget = null;
    }

    activateDefaultWidget() {
        if (this.defaultWidgetView) {
            this.defaultWidgetView.setActive();
        }
    }

    public setItem(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (ContextView.debug) {
            console.debug('ContextView.setItem: ', item);
        }
        const itemSelected = item != null;
        const selectionChanged = !ObjectHelper.equals(this.item, item);

        this.item = item;

        const activeWidgetVisible = this.activeWidget != null && this.isVisible();

        this.layout(!itemSelected);
        if (activeWidgetVisible && selectionChanged && (this.activeWidget.isExternal() || itemSelected)) {
            return this.updateActiveWidget();
        }

        return Q();
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    private getWidgetsInterfaceNames(): string[] {
        return ['contentstudio.contextpanel'];
    }

    updateActiveWidget(): Q.Promise<void> {
        if (ContextView.debug) {
            console.debug('ContextView.updateWidgetsForItem');
        }

        if (!this.activeWidget) {
            return Q();
        }

        return this.activeWidget.updateWidgetItemViews().then(() => {
            this.activeWidget.slideIn();
            return Q.resolve();
        }).catch(DefaultErrorHandler.handle);
    }

    public showLoadMask() {
        this.loadMask.show();
    }

    public hideLoadMask() {
        this.loadMask.hide();
    }

    private initCommonWidgetViews() {
        this.propertiesWidgetView = WidgetView.create()
            .setName(i18n('field.contextPanel.details'))
            .setDescription(i18n('field.contextPanel.details.description'))
            .setWidgetClass('properties-widget')
            .setIconClass('icon-list')
            .setType(InternalWidgetType.INFO)
            .setContextView(this)
            .setWidgetItemViews(this.getDetailsWidgetItemViews()).build();

        this.emulatorWidgetView = WidgetView.create()
            .setName(i18n('field.contextPanel.emulator'))
            .setDescription(i18n('field.contextPanel.emulator.description'))
            .setWidgetClass('emulator-widget')
            .setIconClass(`${StyleHelper.getCurrentPrefix()}icon-mobile`)
            .setType(InternalWidgetType.EMULATOR)
            .setContextView(this)
            .addWidgetItemView(new EmulatorWidgetItemView()).build();

        this.versionsWidgetView = this.createVersionsWidgetView();
        if (this.editorMode) {
            this.pageEditorWidgetView = this.createPageEditorWidgetView();
            this.addWidget(this.pageEditorWidgetView);
        }
        this.addWidgets([this.propertiesWidgetView, this.versionsWidgetView, this.createDependenciesWidgetView()]);

        this.defaultWidgetView = this.propertiesWidgetView;
        this.setActiveWidget(this.defaultWidgetView);
    }

    private createPageEditorWidgetView(): WidgetView {
        this.pageEditorWidgetItemView = new PageEditorWidgetItemView();
        this.pageEditorWidgetItemView.appendContextWindow(this.contextWindow);

        const pageEditorWidgetView = WidgetView.create()
            .setName(i18n('field.contextPanel.pageEditor'))
            .setDescription(i18n('field.contextPanel.pageEditor.description'))
            .setWidgetClass('page-editor-widget')
            .setIconClass('icon-puzzle')
            .addWidgetItemView(this.pageEditorWidgetItemView)
            .setContextView(this)
            .setType(InternalWidgetType.COMPONENTS)
            .build();

        InspectEvent.on((event: InspectEvent) => {
            if (event.isShowWidget() && this.activeWidget !== this.versionsWidgetView &&
                this.pageEditorWidgetView.compareByType(this.defaultWidgetView)) {
                this.activateDefaultWidget();
            }
        });
        return pageEditorWidgetView;
    }

    protected createVersionsWidgetView(): WidgetView {
        return WidgetView.create()
            .setName(i18n('field.contextPanel.versionHistory'))
            .setDescription(i18n('field.contextPanel.versionHistory.description'))
            .setWidgetClass('versions-widget')
            .setIconClass('icon-history')
            .setType(InternalWidgetType.HISTORY)
            .setContextView(this)
            .addWidgetItemView(new VersionHistoryView()).build();
    }

    protected createDependenciesWidgetView(): WidgetView {
        return WidgetView.create()
            .setName(i18n('field.contextPanel.dependencies'))
            .setDescription(i18n('field.contextPanel.dependencies.description'))
            .setWidgetClass('dependency-widget')
            .setIconClass('icon-link')
            .setType(InternalWidgetType.DEPENDENCIES)
            .setContextView(this)
            .addWidgetItemView(new DependenciesWidgetItemView()).build();
    }

    protected getDetailsWidgetItemViews(): WidgetItemView[] {
        return [
            new ContentWidgetItemView(),
            new StatusWidgetItemView(),
            new UserAccessWidgetItemView(),
            new BasePropertiesWidgetItemView(),
            new OnlinePropertiesWidgetItemView(),
            new PageTemplateWidgetItemView(),
            new AttachmentsWidgetItemView()
        ];
    }

    protected fetchCustomWidgetViews(): Q.Promise<Widget[]> {
        const getWidgetsByInterfaceRequest = new GetWidgetsByInterfaceRequest(this.getWidgetsInterfaceNames());

        return getWidgetsByInterfaceRequest.sendAndParse();
    }

    private fetchAndInitCustomWidgetViews(): Q.Promise<void> {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            widgets.forEach((widget) => {
                const widgetView = WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
                this.addWidget(widgetView);
            });
        }).catch((reason) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            showError(msg);
        });
    }

    private fetchWidgetByKey(key: string): Q.Promise<Widget> {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            for (const widget of widgets) {
                if (widget.getWidgetDescriptorKey().getApplicationKey().getName() === key) {
                    return widget;
                }
            }
            return null;
        }).catch((reason) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            showError(msg);
            return null;
        });
    }

    getContextContainer(): DivEl {
        return this.contextContainer;
    }

    private getWidgetByKey(key: string): WidgetView {
        for (const widgetView of this.widgetViews) {
            if (widgetView.getWidgetKey() === key) {
                return widgetView;
            }
        }
        return null;
    }

    private addWidget(widget: WidgetView) {
        this.widgetViews.push(widget);
        this.contextContainer.appendChild(widget);
    }

    private insertWidget(widget: WidgetView, index: number) {
        this.widgetViews.splice(index, 0, widget);
        this.contextContainer.insertChild(widget, index);
    }

    private getIndexOfLastInternalWidget(): number {
        for (let index = 0; index < this.widgetViews.length; index++) {
            if (!this.widgetViews[index].isInternal()) {
                return index - 1;
            }
        }
        return this.widgetViews.length - 1;
    }

    private addWidgets(widgetViews: WidgetView[]) {
        widgetViews.forEach((widget) => {
            this.addWidget(widget);
        });
    }

    private removeWidget(widget: WidgetView) {
        if (widget) {
            this.widgetViews = this.widgetViews.filter(view => !widget.compareByType(view));
            widget.remove();
        }
    }

    private removeWidgetByKey(key: string) {
        const widget = this.getWidgetByKey(key);
        if (widget) {
            this.widgetViews = this.widgetViews.filter((view) => view !== widget);
            widget.remove();
        }
    }

    private updateWidget(widget: WidgetView) {
        for (let i = 0; i < this.widgetViews.length; i++) {
            if (this.widgetViews[i].getWidgetName() === widget.getWidgetName()) {
                this.widgetViews[i].replaceWith(widget);
                this.widgetViews[i] = widget;
                break;
            }
        }
    }

    setIsPageRenderable(value: boolean): void {
        this.isPageRenderable = value;
    }

    updateSelectedWidget() {
        const shouldActivatePageWidget = this.editorMode &&
                                         (this.isPageRenderable && !this.item?.getType()?.isShortcut()
                                          || this.item?.getContentSummary()?.isPage());
        if (shouldActivatePageWidget) {
            this.activatePageEditorWidget();
        } else {
            this.deactivatePageEditorWidget();
        }
    }

    private activatePageEditorWidget(): void {
        const isVersionsWidgetActive: boolean = this.isActiveWidgetByType(this.versionsWidgetView);

        this.defaultWidgetView = this.pageEditorWidgetView;

        if (!isVersionsWidgetActive) {
            this.activateDefaultWidget();
        }
    }

    private deactivatePageEditorWidget(): void {
        const isPageEditorWidgetActive: boolean = this.isActiveWidgetByType(this.pageEditorWidgetView);

        this.defaultWidgetView = this.propertiesWidgetView;

        if (isPageEditorWidgetActive) {
            this.activateDefaultWidget();
        }
    }

    private layout(empty: boolean = true) {
        this.toggleClass('no-selection', empty);
    }

    onPanelSizeChanged(listener: () => void) {
        this.sizeChangedListeners.push(listener);
    }

    notifyPanelSizeChanged() {
        this.sizeChangedListeners.forEach((listener: () => void) => listener());
    }

    appendContextWindow(contextWindow: ContextWindow) {
        this.contextWindow = contextWindow;
        this.pageEditorWidgetItemView?.appendContextWindow(this.contextWindow);
    }

    isVisible(): boolean {
        return super.isVisible() && this.getEl().getWidth() > 0;
    }
}
