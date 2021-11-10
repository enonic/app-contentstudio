import * as Q from 'q';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {InternalWidgetType, WidgetView} from './WidgetView';
import {WidgetsSelectionRow} from './WidgetsSelectionRow';
import {VersionHistoryView} from './widget/version/VersionHistoryView';
import {DependenciesWidgetItemView} from './widget/dependency/DependenciesWidgetItemView';
import {StatusWidgetItemView} from './widget/details/StatusWidgetItemView';
import {PropertiesWidgetItemView} from './widget/details/PropertiesWidgetItemView';
import {AttachmentsWidgetItemView} from './widget/details/AttachmentsWidgetItemView';
import {PageTemplateWidgetItemView} from './widget/details/PageTemplateWidgetItemView';
import {ActiveContextPanelManager} from './ActiveContextPanelManager';
import {ActiveContentVersionSetEvent} from '../../event/ActiveContentVersionSetEvent';
import {GetWidgetsByInterfaceRequest} from '../../resource/GetWidgetsByInterfaceRequest';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {UserAccessWidgetItemView} from '../../security/UserAccessWidgetItemView';
import {EmulatorWidgetItemView} from './widget/emulator/EmulatorWidgetItemView';
import {PageEditorWidgetItemView} from './widget/pageeditor/PageEditorWidgetItemView';
import {PageEditorData} from '../../wizard/page/LiveFormPanel';
import {ContentWidgetItemView} from './widget/details/ContentWidgetItemView';
import {InspectEvent} from '../../event/InspectEvent';
import {EmulatedEvent} from '../../event/EmulatedEvent';
import {EmulatorDevice} from './widget/emulator/EmulatorDevice';
import {ShowLiveEditEvent} from '../../wizard/ShowLiveEditEvent';
import {ShowSplitEditEvent} from '../../wizard/ShowSplitEditEvent';
import {ShowContentFormEvent} from '../../wizard/ShowContentFormEvent';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentIds} from '../../content/ContentIds';
import {ContextPanel} from './ContextPanel';
import {Widget} from 'lib-admin-ui/content/Widget';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {LoadMask} from 'lib-admin-ui/ui/mask/LoadMask';
import {ReloadActiveWidgetEvent} from './ReloadActiveWidgetEvent';
import {ContentId} from '../../content/ContentId';
import {WidgetItemView} from './WidgetItemView';

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

    protected pageEditorWidgetView: WidgetView;
    protected propertiesWidgetView: WidgetView;
    protected emulatorWidgetView?: WidgetView;

    protected data: PageEditorData;

    protected alreadyFetchedCustomWidgets: boolean;

    protected contentRenderable: boolean;

    protected pageEditorVisible: boolean;

    private sizeChangedListeners: { (): void }[] = [];

    private widgetsUpdateList: { [key: string]: (key: string, type: ApplicationEventType) => void } = {};

    public static debug: boolean = false;

    constructor(data?: PageEditorData) {
        super('context-panel-view');

        this.data = data;

        this.contentRenderable = false;
        this.pageEditorVisible = false;

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

        ActiveContentVersionSetEvent.on(() => {
            if (ActiveContextPanelManager.getActiveContextPanel().isVisibleOrAboutToBeVisible() && !!this.activeWidget &&
                this.activeWidget.getWidgetName() === i18n('field.widget.versionHistory')) {
                this.updateActiveWidget();
            }
        });

        const createPageEditorVisibilityChangedHandler = (visible: boolean) => () => {
            this.pageEditorVisible = visible;
            this.updateWidgetsVisibility();
        };

        ShowLiveEditEvent.on(createPageEditorVisibilityChangedHandler(true));
        ShowSplitEditEvent.on(createPageEditorVisibilityChangedHandler(true));
        ShowContentFormEvent.on(createPageEditorVisibilityChangedHandler(false));

        const contentServerEventsHandler = ContentServerEventsHandler.getInstance();

        contentServerEventsHandler.onContentPermissionsUpdated((contentIds: ContentIds) => {
            const itemSelected: boolean = this.item != null;
            const activeContextPanel: ContextPanel = ActiveContextPanelManager.getActiveContextPanel();
            const activeWidgetVisible: boolean = this.activeWidget != null && activeContextPanel.isVisibleOrAboutToBeVisible();

            if (activeWidgetVisible && this.activeWidget.isInternal() && itemSelected) {
                const selectedItemContentId: ContentId = this.item.getContentId();
                const isSelectedItemPermissionsUpdated: boolean = contentIds.contains(selectedItemContentId);
                if (isSelectedItemPermissionsUpdated) {
                    this.updateActiveWidget();
                }
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
                this.activeWidget.updateWidgetItemViews();
            }
        });
    }

    private initDivForNoSelection() {
        this.divForNoSelection = new DivEl('no-selection-message');
        this.divForNoSelection.getEl().setInnerHtml(i18n('field.contextPanel.empty'));
        this.appendChild(this.divForNoSelection);
    }

    private initWidgetsSelectionRow() {
        this.widgetsSelectionRow = new WidgetsSelectionRow(this);
        this.appendChild(this.widgetsSelectionRow);
        this.widgetsSelectionRow.updateState(this.activeWidget);
    }

    getWidgetsSelectionRow(): WidgetsSelectionRow {
        return this.widgetsSelectionRow;
    }

    public resetWidgetsWidth() {
        this.widgetViews.forEach((widgetView: WidgetView) => {
            widgetView.resetContainerWidth();
        });
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

    public setItem(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        if (ContextView.debug) {
            console.debug('ContextView.setItem: ', item);
        }
        const itemSelected = item != null;
        const selectionChanged = !ObjectHelper.equals(this.item, item);

        this.item = item;

        const activeContextPanel = ActiveContextPanelManager.getActiveContextPanel();
        const activeWidgetVisible = this.activeWidget != null && activeContextPanel?.isVisibleOrAboutToBeVisible();

        this.layout(!itemSelected);
        if (activeWidgetVisible && selectionChanged && (this.activeWidget.isExternal() || itemSelected)) {
            return this.updateActiveWidget();
        }

        return Q<any>(null);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    private getWidgetsInterfaceNames(): string[] {
        return ['contentstudio.contextpanel'];
    }

    updateActiveWidget(): Q.Promise<any> {
        if (ContextView.debug) {
            console.debug('ContextView.updateWidgetsForItem');
        }

        if (!this.activeWidget) {
            return Q<any>(null);
        }

        return this.activeWidget.updateWidgetItemViews().then(() => {
            this.activeWidget.slideIn();
        });
    }

    public showLoadMask() {
        this.loadMask.show();
    }

    public hideLoadMask() {
        this.loadMask.hide();
    }

    private initCommonWidgetViews() {
        if (this.isPageEditorPresent()) {
            this.pageEditorWidgetView = WidgetView.create()
                .setName(i18n('field.contextPanel.pageEditor'))
                .setDescription(i18n('field.contextPanel.pageEditor.description'))
                .setWidgetClass('page-editor-widget')
                .setIconClass('icon-puzzle')
                .addWidgetItemView(new PageEditorWidgetItemView(this.data))
                .setContextView(this)
                .setType(InternalWidgetType.COMPONENTS)
                .build();

            InspectEvent.on((event: InspectEvent) => {
                if (event.isShowWidget() && this.pageEditorWidgetView.compareByType(this.defaultWidgetView)) {
                    this.activateDefaultWidget();
                }
            });
        }

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
            .addWidgetItemView(new EmulatorWidgetItemView({})).build();

        this.defaultWidgetView = this.propertiesWidgetView;

        this.addWidgets(this.getInitialWidgets());

        this.setActiveWidget(this.defaultWidgetView);
    }

    private isInsideWizard(): boolean {
        return this.data != null;
    }

    private isPageEditorPresent(): boolean {
        return this.isInsideWizard() && this.data.liveFormPanel != null;
    }

    protected getInitialWidgets(): WidgetView[] {
        const widgets: WidgetView[] = [this.propertiesWidgetView, this.createVersionsWidgetView(), this.createDependenciesWidgetView()];

        if (!this.isInsideWizard()) {
            widgets.push(this.emulatorWidgetView);
        }

        return widgets;
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
            new PropertiesWidgetItemView(),
            new PageTemplateWidgetItemView(),
            new AttachmentsWidgetItemView()
        ];
    }

    private fetchCustomWidgetViews(): Q.Promise<Widget[]> {
        let getWidgetsByInterfaceRequest = new GetWidgetsByInterfaceRequest(this.getWidgetsInterfaceNames());

        return getWidgetsByInterfaceRequest.sendAndParse();
    }

    private fetchAndInitCustomWidgetViews(): Q.Promise<any> {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            widgets.forEach((widget) => {
                let widgetView = WidgetView.create().setName(widget.getDisplayName()).setContextView(this).setWidget(widget).build();
                this.addWidget(widgetView);
            });
        }).catch((reason: any) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            showError(msg);
        });
    }

    private fetchWidgetByKey(key: string): Q.Promise<Widget> {
        return this.fetchCustomWidgetViews().then((widgets: Widget[]) => {
            for (let i = 0; i < widgets.length; i++) {
                if (widgets[i].getWidgetDescriptorKey().getApplicationKey().getName() === key) {
                    return widgets[i];
                }
            }
            return null;
        }).catch((reason: any) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            showError(msg);
            return null;
        });
    }

    updateContextContainerHeight() {
        const activeContextPanelEl = ActiveContextPanelManager.getActiveContextPanel().getEl();
        if (activeContextPanelEl) {
            const panelHeight = ActiveContextPanelManager.getActiveContextPanel().getEl().getHeight();
            const panelOffset = ActiveContextPanelManager.getActiveContextPanel().getEl().getOffsetToParent();
            const containerHeight = this.contextContainer.getEl().getHeight();
            const containerOffset = this.contextContainer.getEl().getOffsetToParent();

            if (containerOffset.top > 0 && containerHeight !== (panelHeight - panelOffset.top - containerOffset.top)) {
                this.contextContainer.getEl().setHeightPx(panelHeight - panelOffset.top - containerOffset.top);
            }
        }
    }

    private getWidgetByKey(key: string): WidgetView {
        for (let i = 0; i < this.widgetViews.length; i++) {
            if (this.widgetViews[i].getWidgetKey() === key) {
                return this.widgetViews[i];
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

    updateRenderableStatus(renderable: boolean) {
        this.contentRenderable = renderable;
        this.updateWidgetsVisibility();
    }

    updateWidgetsVisibility() {
        const checkWidgetPresent = (widget: WidgetView) => this.widgetViews.some(w => widget.compareByType(w));
        const checkWidgetActive = (widget: WidgetView) => widget.compareByType(this.activeWidget);

        let widgetsUpdated = false;

        const canAddPageEditorWidget = this.isPageEditorPresent() && this.pageEditorWidgetView != null;
        const canAddEmulatorWidget = this.isPageEditorPresent();

        if (canAddPageEditorWidget) {
            const pageEditorWidgetPresent = checkWidgetPresent(this.pageEditorWidgetView);
            const pageEditorWidgetActive = checkWidgetActive(this.pageEditorWidgetView);
            const shouldPageEditorWidgetBePresent = this.contentRenderable && this.pageEditorVisible;

            if (shouldPageEditorWidgetBePresent && !pageEditorWidgetPresent) {
                this.insertWidget(this.pageEditorWidgetView, 0);
                if (!pageEditorWidgetActive) {
                    this.defaultWidgetView = this.pageEditorWidgetView;
                    this.activateDefaultWidget();
                }
                widgetsUpdated = true;
            } else if (!shouldPageEditorWidgetBePresent && pageEditorWidgetPresent) {
                this.defaultWidgetView = this.propertiesWidgetView;
                if (pageEditorWidgetActive) {
                    this.activateDefaultWidget();
                }
                this.removeWidget(this.pageEditorWidgetView);
                widgetsUpdated = true;
            }
        }

        if (canAddEmulatorWidget) {
            const emulatorWidgetPresent = checkWidgetPresent(this.emulatorWidgetView);
            const emulatorWidgetActive = checkWidgetActive(this.emulatorWidgetView);
            const shouldEmulatorWidgetBePresent = this.contentRenderable && this.pageEditorVisible;

            if (shouldEmulatorWidgetBePresent && !emulatorWidgetPresent) {
                const index = this.getIndexOfLastInternalWidget() + 1;
                this.insertWidget(this.emulatorWidgetView, index);
                widgetsUpdated = true;
            } else if (!shouldEmulatorWidgetBePresent && emulatorWidgetPresent) {
                if (emulatorWidgetActive) {
                    this.activateDefaultWidget();
                }
                this.removeWidget(this.emulatorWidgetView);
                new EmulatedEvent(EmulatorDevice.getFullscreen(), false).fire();
                widgetsUpdated = true;
            }
        }

        if (widgetsUpdated) {
            this.widgetsSelectionRow.updateWidgetsDropdown(this.widgetViews, this.activeWidget);
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
}
