import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {CompareStatus} from '../../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {InspectEvent} from '../../event/InspectEvent';
import {GetExtensionsByInterfaceRequest} from '../../resource/GetExtensionsByInterfaceRequest';
import {ExtensionPermissionsItemView} from '../../security/ExtensionPermissionsItemView';
import {type ContextWindow} from '../../wizard/page/contextwindow/ContextWindow';
import {ReloadActiveExtensionEvent} from './ReloadActiveExtensionEvent';
import {ExtensionDependencyItemView} from './extension/dependency/ExtensionDependencyItemView';
import {ExtensionAttachmentsItemView} from './extension/details/ExtensionAttachmentsItemView';
import {ExtensionBasePropertiesItemView} from './extension/details/ExtensionBasePropertiesItemView';
import {ExtensionContentItemView} from './extension/details/ExtensionContentItemView';
import {ExtensionOnlinePropertiesItemView} from './extension/details/ExtensionOnlinePropertiesItemView';
import {ExtensionPageTemplateItemView} from './extension/details/ExtensionPageTemplateItemView';
import {ExtensionStatusItemView} from './extension/details/ExtensionStatusItemView';
import {ExtensionPageEditorItemView} from './extension/pageeditor/ExtensionPageEditorItemView';
import {VersionHistoryView} from './extension/version/VersionHistoryView';
import {type ExtensionItemView} from './ExtensionItemView';
import {ExtensionSelectionRow} from './ExtensionSelectionRow';
import {InternalExtensionType, ExtensionView} from './ExtensionView';
import {PageEventsManager} from '../../wizard/PageEventsManager';
import {PageNavigationMediator} from '../../wizard/PageNavigationMediator';
import {type PageNavigationEvent} from '../../wizard/PageNavigationEvent';
import {PageNavigationEventType} from '../../wizard/PageNavigationEventType';
import {type PageNavigationHandler} from '../../wizard/PageNavigationHandler';

export class ContextView
    extends DivEl
    implements PageNavigationHandler {

    protected extensionViews: ExtensionView[] = [];
    protected contextContainer: DivEl;
    protected extensionsSelectionRow: ExtensionSelectionRow;

    protected loadMask: LoadMask;
    protected divForNoSelection: DivEl;

    protected item: ContentSummaryAndCompareStatus;

    protected activeExtension: ExtensionView;
    private defaultExtension: ExtensionView;

    protected extensionPageEditorView?: ExtensionView;
    protected extensionPageEditorItemView?: ExtensionPageEditorItemView;
    protected extensionPropertiesView: ExtensionView;
    protected extensionVersionsView: ExtensionView;

    protected contextWindow?: ContextWindow;
    protected alreadyFetchedCustomExtensions: boolean;

    private sizeChangedListeners: (() => void)[] = [];

    private extensionsUpdateList: Record<string, (key: string, type: ApplicationEventType) => void> = {};

    private editorMode: boolean;

    private isPageRenderable: boolean = undefined;

    public static debug: boolean = false;

    constructor(editorMode: boolean = false) {
        super('context-panel-view');

        this.editorMode = editorMode;

        this.contextContainer = new DivEl('context-container');

        this.loadMask = new LoadMask(this);
        this.loadMask.addClass('context-panel-mask');
        this.appendChild(this.loadMask);

        this.initCommonExtensionViews();
        this.initDivForNoSelection();
        this.initExtensionsSelectionRow();

        this.appendChild(this.contextContainer);
        this.appendChild(this.divForNoSelection);

        this.subscribeToEvents();

        this.layout();

        this.getCustomExtensionViewsAndUpdateDropdown();
    }

    private subscribeToEvents() {
        const handleApplicationEvents = (e) => this.handleApplicationEvents(e);
        ApplicationEvent.on(handleApplicationEvents);
        this.onRemoved(() => ApplicationEvent.un(handleApplicationEvents));

        PageEventsManager.get().onRenderableChanged((renderable: boolean) => {
            const wasRenderable: boolean = this.isPageRenderable;
            this.isPageRenderable = renderable;

            if (wasRenderable !== undefined && renderable !== wasRenderable) {
                // only switch the extension when the page becomes renderable
                this.updateSelectedExtension();
            }
        });

        const contentServerEventsHandler = ContentServerEventsHandler.getInstance();

        contentServerEventsHandler.onContentPermissionsUpdated((contents: ContentSummaryAndCompareStatus[]) => {
            const itemSelected: boolean = this.item != null;
            const activeExtensionVisible: boolean = this.activeExtension != null && this.isVisible();

            if (activeExtensionVisible && this.activeExtension.isInternal() && itemSelected &&
                ContentSummaryAndCompareStatus.isInArray(this.item.getContentId(), contents)) {
                this.updateActiveExtension();
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

        ReloadActiveExtensionEvent.on(() => {
            if (this.activeExtension) {
                this.activeExtension.updateExtensionItemViews().catch(DefaultErrorHandler.handle);
            }
        });

        PageNavigationMediator.get().addPageNavigationHandler(this);
    }

    handle(event: PageNavigationEvent): void {
        /* Uncomment to switch to the Details extension on component deselect.
        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.deactivatePageEditorExtension();
            return;
        }
         */

        if (event.getType() === PageNavigationEventType.SELECT) {
            this.activatePageEditorExtension();
            return;
        }

        if (event.getType() === PageNavigationEventType.INSPECT) {
            this.activatePageEditorExtension();
            return;
        }
    }

    private initDivForNoSelection() {
        this.divForNoSelection = new DivEl('no-selection-message');
        this.divForNoSelection.getEl().setInnerHtml(i18n('field.contextPanel.empty'));
        this.appendChild(this.divForNoSelection);
    }

    private initExtensionsSelectionRow() {
        this.extensionsSelectionRow = new ExtensionSelectionRow();
        this.appendChild(this.extensionsSelectionRow);
        this.extensionsSelectionRow.updateState(this.activeExtension);
    }

    private handleApplicationEvents(event: ApplicationEvent) {
        const isExtensionUpdated = [
                                    ApplicationEventType.INSTALLED,
                                    ApplicationEventType.UNINSTALLED,
                                    ApplicationEventType.STARTED,
                                    ApplicationEventType.STOPPED,
                                    ApplicationEventType.UPDATED
                                ].indexOf(event.getEventType()) > -1;

        if (isExtensionUpdated) {
            const key = event.getApplicationKey().getName();

            if (!this.extensionsUpdateList[key]) {
                this.extensionsUpdateList[key] = AppHelper.debounce((k, type) => this.handleExtensionUpdate(k, type), 1000);
            }
            this.extensionsUpdateList[key](key, event.getEventType());
        }
    }

    private handleExtensionUpdate(key: string, type: ApplicationEventType) {
        if (this.isExtensionRemoveEvent(type)) {
            this.handleExtensionRemoveEvent(key);
        } else if (this.getExtensionByKey(key)) {
            this.handleExtensionUpdateEvent(key);
        } else {
            this.handleExtensionAddedEvent(key);
        }
    }

    private isExtensionRemoveEvent(type: ApplicationEventType): boolean {
        return [
                   ApplicationEventType.UNINSTALLED,
                   ApplicationEventType.STOPPED
               ].indexOf(type) > -1;
    }

    private handleExtensionRemoveEvent(key: string) {
        this.removeExtensionByKey(key);

        if (this.isActiveExtension(key)) {
            this.activateDefaultExtension();
        }

        this.updateView();
    }

    private isActiveExtensionByType(view: ExtensionView): boolean {
        return view?.compareByType(this.activeExtension);
    }

    private isActiveExtension(key: string): boolean {
        return this.activeExtension && this.activeExtension.getExtensionKey() === key;
    }

    private handleExtensionUpdateEvent(key: string) {
        this.fetchExtensionByKey(key).then((extension: Extension) => {
            const extensionView: ExtensionView =
                ExtensionView.create().setName(extension.getDisplayName()).setContextView(this).setExtension(extension).build();
            this.updateExtension(extensionView);

            if (this.isActiveExtension(key)) {
                this.resetActiveExtension();
                extensionView.setActive();
            }

            this.updateView();
        });
    }

    private handleExtensionAddedEvent(key: string) {
        this.fetchExtensionByKey(key).then((extension: Extension) => {
            const extensionView: ExtensionView =
                ExtensionView.create().setName(extension.getDisplayName()).setContextView(this).setExtension(extension).build();
            this.addExtension(extensionView);
            this.updateView();
        });
    }

    private updateView() {
        this.extensionsSelectionRow.updateExtensionDropdown(this.extensionViews);
        this.extensionsSelectionRow.updateState(this.activeExtension);
    }

    getCustomExtensionViewsAndUpdateDropdown(): Q.Promise<void> {
        const deferred = Q.defer<void>();
        if (!this.alreadyFetchedCustomExtensions) {
            this.fetchAndInitCustomExtensionViews().then(() => {
                this.extensionsSelectionRow.updateExtensionDropdown(this.extensionViews);
                this.alreadyFetchedCustomExtensions = true;
                deferred.resolve(null);
            });
        } else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    setActiveExtension(extensionView: ExtensionView) {
        if (this.activeExtension) {
            this.activeExtension.setInactive();
        }

        this.activeExtension = extensionView;
        this.activeExtension.addClass('active');

        this.toggleClass('default-widget', this.defaultExtension.isActive());
        this.toggleClass('internal', extensionView.isInternal());

        if (this.extensionsSelectionRow) {
            this.extensionsSelectionRow.updateState(this.activeExtension);
        }
    }

    getActiveExtension(): ExtensionView {
        return this.activeExtension;
    }

    resetActiveExtension() {
        if (this.activeExtension) {
            this.activeExtension.removeClass('active');
        }
        this.activeExtension = null;
    }

    activateDefaultExtension() {
        if (this.defaultExtension) {
            this.defaultExtension.setActive();
        }
    }

    public setItem(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
        if (ContextView.debug) {
            console.debug('ContextView.setItem: ', item);
        }
        const itemSelected = item != null;
        const selectionChanged = !ObjectHelper.equals(this.item, item);

        this.item = item;

        const activeExtensionVisible = this.activeExtension != null && this.isVisible();

        this.layout(!itemSelected);
        if (activeExtensionVisible && selectionChanged && (this.activeExtension.isExternal() || itemSelected)) {
            return this.updateActiveExtension();
        }

        return Q();
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item;
    }

    updateActiveExtension(): Q.Promise<void> {
        if (ContextView.debug) {
            console.debug('ContextView.updateExtensionsForItem');
        }

        if (!this.activeExtension) {
            return Q();
        }

        return this.activeExtension.updateExtensionItemViews().then(() => {
            this.activeExtension.slideIn();
        }).catch(DefaultErrorHandler.handle);
    }

    public showLoadMask() {
        this.loadMask.show();
    }

    public hideLoadMask() {
        this.loadMask.hide();
    }

    private initCommonExtensionViews() {
        this.extensionPropertiesView = ExtensionView.create()
            .setName(i18n('field.contextPanel.details'))
            .setDescription(i18n('field.contextPanel.details.description'))
            .setExtensionClass('extension-properties')
            .setIconClass('icon-list')
            .setType(InternalExtensionType.INFO)
            .setContextView(this)
            .setExtensionItemViews(this.getExtensionDetailsItemViews()).build();

        this.extensionVersionsView = this.createExtensionVersionsView();
        if (this.editorMode) {
            this.extensionPageEditorView = this.createExtensionPageEditorView();
        }
        this.addExtensions(this.getInitialExtensions());

        this.defaultExtension = this.extensionPropertiesView;
        this.setActiveExtension(this.defaultExtension);
    }

    protected getInitialExtensions(): ExtensionView[] {
        const result = [this.extensionPropertiesView, this.extensionVersionsView, this.createExtensionDependenciesView()];
        if (this.extensionPageEditorView) {
            // add page editor extension as second item
            result.splice(1, 0, this.extensionPageEditorView);
        }
        return result;
    }

    private createExtensionPageEditorView(): ExtensionView {
        this.extensionPageEditorItemView = new ExtensionPageEditorItemView();
        this.extensionPageEditorItemView.appendContextWindow(this.contextWindow);

        const pageEditorExtensionView = ExtensionView.create()
            .setName(i18n('field.contextPanel.pageEditor'))
            .setDescription(i18n('field.contextPanel.pageEditor.description'))
            .setExtensionClass('page-editor-widget')
            .setIconClass('icon-puzzle')
            .addExtensionItemView(this.extensionPageEditorItemView)
            .setContextView(this)
            .setType(InternalExtensionType.COMPONENTS)
            .build();

        InspectEvent.on((event: InspectEvent) => {
            if (event.isShowExtension() && this.activeExtension !== this.extensionVersionsView &&
                this.extensionPageEditorView.compareByType(this.defaultExtension)) {
                this.activateDefaultExtension();
            }
        });
        return pageEditorExtensionView;
    }

    protected createExtensionVersionsView(): ExtensionView {
        return ExtensionView.create()
            .setName(i18n('field.contextPanel.versionHistory'))
            .setDescription(i18n('field.contextPanel.versionHistory.description'))
            .setExtensionClass('extension-versions')
            .setIconClass('icon-history')
            .setType(InternalExtensionType.HISTORY)
            .setContextView(this)
            .addExtensionItemView(new VersionHistoryView()).build();
    }

    protected createExtensionDependenciesView(): ExtensionView {
        return ExtensionView.create()
            .setName(i18n('field.contextPanel.dependencies'))
            .setDescription(i18n('field.contextPanel.dependencies.description'))
            .setExtensionClass('extension-dependency')
            .setIconClass('icon-link')
            .setType(InternalExtensionType.DEPENDENCIES)
            .setContextView(this)
            .addExtensionItemView(new ExtensionDependencyItemView()).build();
    }

    protected getExtensionDetailsItemViews(): ExtensionItemView[] {
        return [
            new ExtensionContentItemView(),
            new ExtensionStatusItemView(),
            new ExtensionPermissionsItemView(),
            new ExtensionBasePropertiesItemView(),
            new ExtensionOnlinePropertiesItemView(),
            new ExtensionPageTemplateItemView(),
            new ExtensionAttachmentsItemView()
        ];
    }

    protected fetchCustomExtensions(): Q.Promise<Extension[]> {
        return new GetExtensionsByInterfaceRequest('contentstudio.contextpanel').sendAndParse();
    }

    private fetchAndInitCustomExtensionViews(): Q.Promise<void> {
        return this.fetchCustomExtensions().then((extensions: Extension[]) => {
            extensions.forEach((extension) => {
                const widgetView = ExtensionView.create().setName(extension.getDisplayName()).setContextView(this).setExtension(extension).build();
                this.addExtension(widgetView);
            });
        }).catch((reason) => {
            const msg = reason ? reason.message : i18n('notify.widget.error');
            showError(msg);
        });
    }

    private fetchExtensionByKey(key: string): Q.Promise<Extension> {
        return this.fetchCustomExtensions().then((extensions: Extension[]) => {
            for (const extension of extensions) {
                if (extension.getDescriptorKey().getApplicationKey().getName() === key) {
                    return extension;
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

    private getExtensionByKey(key: string): ExtensionView {
        for (const extensionView of this.extensionViews) {
            if (extensionView.getExtensionKey() === key) {
                return extensionView;
            }
        }
        return null;
    }

    private addExtension(extension: ExtensionView) {
        this.extensionViews.push(extension);
        this.contextContainer.appendChild(extension);
    }

    private addExtensions(extensionViews: ExtensionView[]) {
        extensionViews.forEach((extensionView) => {
            this.addExtension(extensionView);
        });
    }

    private removeExtensionByKey(key: string) {
        const extension = this.getExtensionByKey(key);
        if (extension) {
            this.extensionViews = this.extensionViews.filter((view) => view !== extension);
            extension.remove();
        }
    }

    private updateExtension(extension: ExtensionView) {
        for (let i = 0; i < this.extensionViews.length; i++) {
            if (this.extensionViews[i].getExtensionName() === extension.getExtensionName()) {
                this.extensionViews[i].replaceWith(extension);
                this.extensionViews[i] = extension;
                break;
            }
        }
    }

    updateSelectedExtension() {
        const shouldActivatePageExtension = this.editorMode &&
                                         (this.isPageRenderable && !this.item?.getType()?.isShortcut()
                                          || this.item?.getContentSummary()?.isPage());
        if (shouldActivatePageExtension) {
            this.activatePageEditorExtension();
        } else {
            this.deactivatePageEditorExtension();
        }
    }

    private activatePageEditorExtension(): void {
        this.defaultExtension = this.extensionPageEditorView;

        this.activateDefaultExtension();
    }

    private deactivatePageEditorExtension(): void {
        const isPageEditorExtensionActive: boolean = this.isActiveExtensionByType(this.extensionPageEditorView);

        this.defaultExtension = this.extensionPropertiesView;

        if (isPageEditorExtensionActive) {
            this.activateDefaultExtension();
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
        this.extensionPageEditorItemView?.appendContextWindow(this.contextWindow);
    }

    isVisible(): boolean {
        return super.isVisible() && this.getEl().getWidth() > 0;
    }
}
