import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {DefaultModels} from './DefaultModels';
import {LiveEditPageProxy} from './LiveEditPageProxy';
import {TextInspectionPanel} from './contextwindow/inspect/region/TextInspectionPanel';
import {ContentInspectionPanel} from './contextwindow/inspect/ContentInspectionPanel';
import {RegionInspectionPanel} from './contextwindow/inspect/region/RegionInspectionPanel';
import {ImageInspectionPanel} from './contextwindow/inspect/region/ImageInspectionPanel';
import {LayoutInspectionPanel} from './contextwindow/inspect/region/LayoutInspectionPanel';
import {FragmentInspectionPanel} from './contextwindow/inspect/region/FragmentInspectionPanel';
import {PartInspectionPanel} from './contextwindow/inspect/region/PartInspectionPanel';
import {PageInspectionPanel} from './contextwindow/inspect/page/PageInspectionPanel';
import {InspectionsPanel, InspectionsPanelConfig} from './contextwindow/inspect/InspectionsPanel';
import {InsertablesPanel} from './contextwindow/insert/InsertablesPanel';
import {ContextWindow, ContextWindowConfig, getInspectParameters} from './contextwindow/ContextWindow';
import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {SaveAsTemplateAction} from '../action/SaveAsTemplateAction';
import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {ShowSplitEditEvent} from '../ShowSplitEditEvent';
import {LiveEditModel} from '../../../page-editor/LiveEditModel';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/LiveEditPageInitializationErrorEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {HTMLAreaDialogHandler} from '../../inputtype/ui/text/dialog/HTMLAreaDialogHandler';
import {CreateHtmlAreaDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {UriHelper} from '../../rendering/UriHelper';
import {RenderingMode} from '../../rendering/RenderingMode';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {ContentDeletedEvent} from '../../event/ContentDeletedEvent';
import {ContentUpdatedEvent} from '../../event/ContentUpdatedEvent';
import {EditContentEvent} from '../../event/EditContentEvent';
import {Content, ContentBuilder} from '../../content/Content';
import {Site} from '../../content/Site';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Component} from '../../page/region/Component';
import {Page} from '../../page/Page';
import {PartComponent} from '../../page/region/PartComponent';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import {ImageComponent} from '../../page/region/ImageComponent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {ComponentPath} from '../../page/region/ComponentPath';
import {BaseInspectionPanel} from './contextwindow/inspect/BaseInspectionPanel';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {BrEl} from '@enonic/lib-admin-ui/dom/BrEl';
import {ContentId} from '../../content/ContentId';
import {InspectEvent} from '../../event/InspectEvent';
import {ContextPanelMode} from '../../view/context/ContextSplitPanel';
import {LiveEditPagePlaceholder} from './LiveEditPagePlaceholder';
import {Descriptor} from '../../page/Descriptor';
import {ContentType} from '../../inputtype/schema/ContentType';
import {ModalDialog} from '../../inputtype/ui/text/dialog/ModalDialog';
import {GetComponentDescriptorsRequest} from '../../resource/GetComponentDescriptorsRequest';
import {PageComponentType} from '../../page/region/PageComponentType';
import {PageEventsManager} from '../PageEventsManager';
import {PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationEvent} from '../PageNavigationEvent';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {PageNavigationEventType} from '../PageNavigationEventType';
import {TextComponent} from '../../page/region/TextComponent';
import {Region} from '../../page/region/Region';
import {PageState} from './PageState';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {ComponentDescriptorUpdatedEvent} from '../../page/region/ComponentDescriptorUpdatedEvent';
import {ComponentImageUpdatedEvent} from '../../page/region/ComponentImageUpdatedEvent';
import {ComponentFragmentUpdatedEvent} from '../../page/region/ComponentFragmentUpdatedEvent';
import {PageItem} from '../../page/region/PageItem';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentDetachedEvent} from '../../page/region/ComponentDetachedEvent';
import {ComponentFragmentCreatedEvent} from '../../page/region/ComponentFragmentCreatedEvent';
import {ComponentDuplicatedEvent} from '../../page/region/ComponentDuplicatedEvent';
import {PageNavigationEventData, PageNavigationEventSource} from '../PageNavigationEventData';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {ToggleContextPanelEvent} from '../../view/context/ToggleContextPanelEvent';
import {ComponentTextUpdatedEvent} from '../../page/region/ComponentTextUpdatedEvent';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {PageHelper} from '../../util/PageHelper';
import {ContextPanelState} from '../../view/context/ContextPanelState';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export interface LiveFormPanelConfig {

    contentType: ContentType;

    contentWizardPanel: ContentWizardPanel;

    defaultModels: DefaultModels;

    content: Content;

    liveEditPage: LiveEditPageProxy;
}

export interface InspectPageParams {
    showPanel: boolean,
    showWidget: boolean,
    keepPanelSelection?: boolean,
    source?: PageNavigationEventSource,
}

enum ErrorType {
    APP_MISSING = 0,
    RENDER_ERROR = 1
}

export class LiveFormPanel
    extends Panel
    implements PageNavigationHandler {

    public static debug: boolean = false;

    private defaultModels: DefaultModels;

    private content: Content;

    private contentType: ContentType;

    private liveEditModel?: LiveEditModel;

    private pageLoading: boolean = false;

    private pageSkipReload: boolean = false;

    private frameContainer?: Panel;

    private lockPageAfterProxyLoad: boolean = false;

    private modifyPermissions: boolean;

    private contextWindow: ContextWindow;

    private isTextModeOn: boolean;

    private contextPanelMode: ContextPanelMode;

    private contextPanelState: ContextPanelState;

    private componentToInspectOnContextPanelExpand: Component;

    private placeholder?: LiveEditPagePlaceholder;
    private insertablesPanel: InsertablesPanel;
    private inspectionsPanel: InspectionsPanel;
    private contentInspectionPanel: ContentInspectionPanel;
    private pageInspectionPanel: PageInspectionPanel;
    private regionInspectionPanel: RegionInspectionPanel;
    private imageInspectionPanel: ImageInspectionPanel;
    private partInspectionPanel: PartInspectionPanel;
    private layoutInspectionPanel: LayoutInspectionPanel;
    private fragmentInspectionPanel: FragmentInspectionPanel;
    private textInspectionPanel: TextInspectionPanel;

    private contentWizardPanel: ContentWizardPanel;

    private liveEditPageProxy?: LiveEditPageProxy;

    private previewMessageEl: PEl;

    private errorMessages: { type: ErrorType, message: string }[] = [];

    private contentEventListener: (event: ContentUpdatedEvent | ContentDeletedEvent) => void;

    private hasContentEventListeners: boolean;

    private isRenderable: boolean;

    private hasPage: boolean;

    private hasMissingApps: boolean;

    private hasAvailableControllers: boolean;

    private lastInspectedItemPath: ComponentPath;

    private saveAction: Action;

    private getDescriptorsPromise: Q.Promise<Descriptor[]>;

    private debouncedUpdateFunc: () => void;

    private showLoadMaskHandler: () => void;
    private hideLoadMaskHandler: () => void;
    private contentUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;
    private contentPermissionsUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel');

        this.contentWizardPanel = config.contentWizardPanel;
        this.defaultModels = config.defaultModels;
        this.content = config.content;
        this.contentType = config.contentType;
        this.liveEditPageProxy = config.liveEditPage;
        this.debouncedUpdateFunc = AppHelper.debounce(this.updateRenderingState.bind(this), 500);

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();
        this.initEventHandlers();
    }

    protected initElements(): void {
        if (!this.content.getPage()) {
            this.createLiveEditPagePlaceholder();
        }

        this.initPageRequiredElements();
    }

    updateHasControllers(): Q.Promise<void> {
        this.getDescriptorsPromise = this.createControllersRequest().sendAndParse();

        return this.getDescriptorsPromise.then((descriptors: Descriptor[]) => {
            const isChanged =
                !ObjectHelper.isDefined(this.hasAvailableControllers) || this.hasAvailableControllers !== descriptors.length > 0;

            this.hasAvailableControllers = descriptors.length > 0;

            if (isChanged) {
                this.debouncedUpdateFunc();
            }

            return Q.resolve();
        }).catch(DefaultErrorHandler.handle);
    }

    hasControllers(): Q.Promise<boolean> {
        this.getDescriptorsPromise = this.getDescriptorsPromise ?? this.createControllersRequest().sendAndParse();

        return this.getDescriptorsPromise.then((descriptors: Descriptor[]) => {
            return descriptors.length > 0;
        });
    }

    private createControllersRequest(): GetComponentDescriptorsRequest {
        const req: GetComponentDescriptorsRequest = new GetComponentDescriptorsRequest();
        req.setComponentType(PageComponentType.get());
        req.setContentId(this.content.getContentId());
        return req;
    }

    protected initPageRequiredElements(): void {
        this.liveEditPageProxy.setModifyPermissions(this.modifyPermissions);
        this.contextWindow = this.createContextWindow();

        this.addPageProxyLoadEventListeners();
        this.addPageProxyEventListeners();
    }

    private createLiveEditPagePlaceholder(): void {
        this.placeholder = new LiveEditPagePlaceholder(this.content.getContentId(), this.contentType);
        this.placeholder.setEnabled(this.modifyPermissions);
        this.whenRendered(() => this.appendChild(this.placeholder));
    }

    protected initEventHandlers() {
        this.initMaskHandlers();
        this.initPropertyChangedHandlers();
        this.initContentUpdatedHandler();

        ShowLiveEditEvent.on(this.showLoadMaskHandler);
        ShowSplitEditEvent.on(this.showLoadMaskHandler);
        ShowContentFormEvent.on(this.hideLoadMaskHandler);
        ContentServerEventsHandler.getInstance().onContentUpdated(this.contentUpdatedHandler);
        ContentServerEventsHandler.getInstance().onContentPermissionsUpdated(this.contentPermissionsUpdatedHandler);

        this.contentEventListener = (event) => {
            this.propagateEvent(event);
        };
    }

    private initMaskHandlers() {
        this.showLoadMaskHandler = () => {
            // in case someone tries to open live edit while it's still not loaded
            if (this.pageLoading) {
                this.contentWizardPanel.getLiveMask().show();
            }
        };

        this.hideLoadMaskHandler = () => {
            const liveEditMask = this.contentWizardPanel.getLiveMask();
            // in case someone tries to open live edit while it's still not loaded
            if (!!liveEditMask && liveEditMask.isVisible()) {
                liveEditMask.hide();
            }
        };
    }

    private initPropertyChangedHandlers(): void {
        const componentUpdatedHandler = (event: ComponentUpdatedEvent) => {
            if (event instanceof ComponentDescriptorUpdatedEvent) {
                if (event.getDescriptorKey()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndReloadOnlyComponent(event.getPath());
                } else {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            } else if (event instanceof ComponentImageUpdatedEvent) {
                if (event.getImageId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndReloadOnlyComponent(event.getPath());
                } else {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            } else if (event instanceof ComponentFragmentUpdatedEvent) {
                if (event.getFragmentId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndReloadOnlyComponent(event.getPath());
                } else {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            } else if (event instanceof ComponentTextUpdatedEvent) {
                if (StringHelper.isEmpty(event.getText())) {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            }
        };

        const componentAddedHandler = (event: ComponentAddedEvent): void => {
            if (event instanceof ComponentDetachedEvent) {
                showSuccess(i18n('notify.component.detached', event.getName()));
                this.saveMarkedContentAndReloadOnlyComponent(event.getPath());
            } else if (event instanceof ComponentFragmentCreatedEvent) {
                const fragmentName = event.getComponent().getName().toString();
                const fragmentType = event.getFragmentContent().getPage()?.getFragment()?.getType().getShortName();
                showSuccess(i18n('notify.fragment.created', fragmentName, fragmentType));
                this.saveMarkedContentAndReloadOnlyComponent(event.getPath());

                const summaryAndStatus = ContentSummaryAndCompareStatus.fromContentSummary(event.getFragmentContent());
                new EditContentEvent([summaryAndStatus]).fire();
            } else if (event instanceof ComponentDuplicatedEvent) {
                this.contentWizardPanel.setMarkedAsReady(false);
                this.saveAndReloadOnlyComponent(event.getPath());
            } else {
                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(event.getPath())));
            }
        };

        PageState.getEvents().onComponentUpdated(componentUpdatedHandler);
        PageState.getEvents().onComponentAdded(componentAddedHandler);
    }

    private initContentUpdatedHandler() {
        this.contentUpdatedHandler = this.handleContentUpdate.bind(this);
        this.contentPermissionsUpdatedHandler = this.handleContentPermissionsUpdate.bind(this);
    }

    private handleContentUpdate(summaryAndStatuses: ContentSummaryAndCompareStatus[]) {
        if (!this.content) {
            return;
        }

        // Update action with new content on save if it gets updated
        summaryAndStatuses.forEach((summaryAndStatus: ContentSummaryAndCompareStatus) => {
            if (this.content.getContentId().equals(summaryAndStatus.getContentId())) {
                this.handleThisContentUpdated(summaryAndStatus);
            } else if (summaryAndStatus.getType().isFragment()) {
                this.handleFragmentUpdate(summaryAndStatus);
            }
        });
    }

    private handleThisContentUpdated(updated: ContentSummaryAndCompareStatus): void {
        SaveAsTemplateAction.get()?.setContentSummary(updated.getContentSummary());
    }

    private handleFragmentUpdate(fragment: ContentSummaryAndCompareStatus): void {
        const updatedFragmentId = fragment.getContentId();
        const fragmentComponent =
            PageHelper.findFragmentInRegionsByFragmentId(PageState.getState()?.getRegions()?.getRegions(), updatedFragmentId);

        if (fragmentComponent) {
            this.reloadComponent(fragmentComponent.getPath());
        }
    }

    private handleContentPermissionsUpdate(contents: ContentSummaryAndCompareStatus[]) {
        if (!this.content) {
            return;
        }

        const thisContentId: ContentId = this.content.getContentId();

        if (!ContentSummaryAndCompareStatus.isInArray(thisContentId, contents)) {
            return;
        }

        new ContentSummaryAndCompareStatusFetcher().fetch(thisContentId)
            .then((contentSummary: ContentSummaryAndCompareStatus) => SaveAsTemplateAction.get().setContentSummary(
                contentSummary.getContentSummary()))
            .catch(DefaultErrorHandler.handle);
    }


    private addPageProxyLoadEventListeners(): void {
        PageEventsManager.get().onLoaded(() => {
            this.hideLoadMaskHandler();
            this.pageLoading = false;

            if (this.lockPageAfterProxyLoad) {
                this.liveEditPageProxy?.setLocked(true);
                this.lockPageAfterProxyLoad = false;
            }

            this.imageInspectionPanel.refresh();
        });
    }

    private createContextWindow(): ContextWindow {
        this.inspectionsPanel = this.createInspectionsPanel();

        this.insertablesPanel = new InsertablesPanel({
            liveEditPage: this.liveEditPageProxy,
            contentWizardPanel: this.contentWizardPanel,
            saveAsTemplateAction: SaveAsTemplateAction.get()
        });

        this.insertablesPanel.setModifyPermissions(this.modifyPermissions);

        return new ContextWindow({
            liveFormPanel: this,
            inspectionPanel: this.inspectionsPanel,
            insertablesPanel: this.insertablesPanel
        } as ContextWindowConfig);
    }

    private createInspectionsPanel(): InspectionsPanel {
        this.saveAction = new Action(i18n('action.apply')).setEnabled(false);

        this.saveAction.onExecuted(() => {
            const selectedItem = this.lastInspectedItemPath ? PageState.getComponentByPath(this.lastInspectedItemPath) : null;

            if (selectedItem instanceof Component) {
                this.contentWizardPanel.setMarkedAsReady(false);
                this.saveAndReloadOnlyComponent(selectedItem.getPath())
                    .then(() => this.saveAction.setEnabled(false))
                    .catch(DefaultErrorHandler.handle);
                return;
            }

            this.contentWizardPanel.saveChanges().then(() => this.saveAction.setEnabled(false)).catch(DefaultErrorHandler.handle);
        });

        this.contentInspectionPanel = new ContentInspectionPanel();

        this.pageInspectionPanel = new PageInspectionPanel(SaveAsTemplateAction.get());
        this.partInspectionPanel = new PartInspectionPanel();
        this.layoutInspectionPanel = new LayoutInspectionPanel();
        this.imageInspectionPanel = new ImageInspectionPanel();
        this.fragmentInspectionPanel = new FragmentInspectionPanel();

        this.textInspectionPanel = new TextInspectionPanel();
        this.regionInspectionPanel = new RegionInspectionPanel();

        return new InspectionsPanel({
            contentInspectionPanel: this.contentInspectionPanel,
            pageInspectionPanel: this.pageInspectionPanel,
            regionInspectionPanel: this.regionInspectionPanel,
            imageInspectionPanel: this.imageInspectionPanel,
            partInspectionPanel: this.partInspectionPanel,
            layoutInspectionPanel: this.layoutInspectionPanel,
            fragmentInspectionPanel: this.fragmentInspectionPanel,
            textInspectionPanel: this.textInspectionPanel,
            saveAction: this.saveAction
        } as InspectionsPanelConfig);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            WindowDOM.get().onBeforeUnload((event) => {
                // the reload is triggered by the main frame,
                // so let the live edit know it to skip the popup
                this.liveEditPageProxy?.skipNextReloadConfirmation(true);
            });

            this.previewMessageEl = new PEl('no-preview-message');

            // append mask here in order for the context window to be above
            this.appendChild(this.previewMessageEl);

            return rendered;
        });
    }

    private togglePreviewPanel(visible: boolean) {
        this.toggleClass('no-preview', visible);
    }

    private hasErrorMessage(type: ErrorType): boolean {
        return this.errorMessages.some((errorMessage) => errorMessage.type === type);
    }

    private addErrorMessage(type: ErrorType, message: string): boolean {
        if (this.hasErrorMessage(type)) {
            return;
        }
        this.errorMessages.push({type, message});
        this.togglePreviewErrors();
    }

    private setErrorMissingApps(): void {
        this.addErrorMessage(ErrorType.APP_MISSING, 'field.preview.missing.description');
    }

    private clearErrorMissingApps() {
        if (!this.errorMessages.length) {
            return;
        }
        this.errorMessages = this.errorMessages.filter((errorMessage) => errorMessage.type !== ErrorType.APP_MISSING);
        this.togglePreviewErrors();
    }

    private clearPreviewErrors() {
        this.errorMessages = [];
        this.togglePreviewErrors();
    }

    private togglePreviewErrors() {
        this.whenRendered(() => {
            if (!this.errorMessages.length) {
                this.togglePreviewPanel(false);
                return;
            }
            const message = this.errorMessages.sort(
                (e1, e2) => e1.type - e2.type)[0].message;
            this.previewMessageEl.removeChildren();
            this.previewMessageEl.appendChildren(
                SpanEl.fromText(i18n('field.preview.failed')),
                new BrEl(),
                SpanEl.fromText(i18n(message))
            );
            this.togglePreviewPanel(true);
        });
    }

    remove(): LiveFormPanel {
        ShowLiveEditEvent.un(this.showLoadMaskHandler);
        ShowSplitEditEvent.un(this.showLoadMaskHandler);
        ShowContentFormEvent.un(this.hideLoadMaskHandler);

        this.liveEditPageProxy.remove();
        super.remove();
        return this;
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
        this.content = liveEditModel.getContent();

        const site: Site = this.content.isSite()
                           ? this.content as Site
                           : liveEditModel.getSiteModel()
                             ? this.liveEditModel.getSiteModel().getSite()
                             : null;

        SaveAsTemplateAction.get()
            .setContentSummary(this.content)
            .setSite(site);

        this.liveEditPageProxy.setModel(liveEditModel);
        this.pageInspectionPanel.setModel(liveEditModel);
        this.partInspectionPanel.setModel(liveEditModel);
        this.layoutInspectionPanel.setModel(liveEditModel);
        this.imageInspectionPanel.setModel(liveEditModel);
        this.fragmentInspectionPanel.setModel(liveEditModel);

        this.handleContentUpdatedEvent();
    }

    private handleContentUpdatedEvent() {
        if (this.hasContentEventListeners) {
            return;
        }

        ContentDeletedEvent.on(this.contentEventListener);
        ContentUpdatedEvent.on(this.contentEventListener);
        this.hasContentEventListeners = true;

        this.onRemoved(() => {
            this.removeContentEventListeners();
        });
    }

    skipNextReloadConfirmation(skip: boolean) {
        this.liveEditPageProxy?.skipNextReloadConfirmation(skip);
    }

    propagateEvent(event: Event) {
        this.liveEditPageProxy.propagateEvent(event);
    }

    loadPage(clearInspection: boolean = true): void {
        if (LiveFormPanel.debug) {
            console.debug('LiveFormPanel.loadPage at ' + new Date().toISOString());
        }

        if (this.pageSkipReload || this.pageLoading) {
            return;
        }

        if (clearInspection) {
            this.clearSelectionAndInspect(false, true);
        }

        this.pageLoading = true;

        this.clearPreviewErrors();

        this.liveEditPageProxy.load();
        this.placeholder?.hide();
        this.placeholder?.deselectOptions();

        if (!this.frameContainer) {
            this.frameContainer = new Panel('frame-container');
            this.frameContainer.setDoOffset(false);
            this.appendChild(this.frameContainer);
            this.frameContainer.appendChildren<Element>(this.liveEditPageProxy.getIFrame(), this.liveEditPageProxy.getDragMask());
        } else {
            this.frameContainer.show();

            if (!this.frameContainer.hasChild(this.liveEditPageProxy.getIFrame())) {
                this.frameContainer.appendChildren<Element>(this.liveEditPageProxy.getIFrame(), this.liveEditPageProxy.getDragMask());
            }
        }

        if (clearInspection) {
            let clearInspectionFn = () => {
                this.contextWindow.clearSelection();
                PageEventsManager.get().unLoaded(clearInspectionFn);
            };
            PageEventsManager.get().onLoaded(clearInspectionFn);
        }
    }

    private saveAndReloadOnlyComponent(path: ComponentPath): Q.Promise<void> {
        assertNotNull(path, 'component path cannot be null');
        this.pageSkipReload = true;

        return this.contentWizardPanel.saveChangesWithoutValidation(false).then(() => {
            this.pageSkipReload = false;
            this.reloadComponent(path);

            // saved component will have default config props populated, so we need to make it a part of a state
            const changedComponent = PageState.getState().getComponentByPath(path);
            const persistedComponent = this.contentWizardPanel.getPersistedItem().getPage()?.getComponentByPath(path);

            if (changedComponent instanceof DescriptorBasedComponent && persistedComponent instanceof DescriptorBasedComponent) {
                changedComponent.setConfig(persistedComponent.getConfig().copy());
                this.inspectComponentOnDemand(changedComponent);
            }
        });
    }

    private reloadComponent(path: ComponentPath): void {
        const componentUrl: string = UriHelper.getComponentUri(this.content.getContentId().toString(),
            path,
            RenderingMode.EDIT);
        this.liveEditPageProxy.loadComponent(path, componentUrl);
    }

    private addPageProxyEventListeners() {
        const eventsManager = PageEventsManager.get();

        eventsManager.onPageLocked(() => {
            this.inspectPage({showPanel: false, showWidget: true});
        });

        eventsManager.onLiveEditPageViewReady(() => {
            // disable insert tab if there is no page for some reason (i.e. error occurred)
            // or there is no controller or template set or no automatic template
            const page = PageState.getState();
            const isPageRenderable = !!page && (page.hasController() || !!page.getTemplate() || page.isFragment());
            const hasDefaultTemplate = this.liveEditModel?.getDefaultModels().hasDefaultPageTemplate();
            this.contextWindow.setItemVisible(this.insertablesPanel, isPageRenderable || hasDefaultTemplate);
        });

        eventsManager.onPageSaveAsTemplate(() => {
            SaveAsTemplateAction.get().execute();
        });

        eventsManager.onComponentDragDropped((path: ComponentPath) => {
            this.inspectPageItemByPath(new PageNavigationEventData(path));
        });

        eventsManager.onShowWarning((event: ShowWarningLiveEditEvent) => {
            showWarning(event.getMessage());
        });

        eventsManager.onEditContent((event: EditContentEvent) => {
            new EditContentEvent(event.getModels()).fire();
        });

        eventsManager.onLiveEditPageInitializationError((event: LiveEditPageInitializationErrorEvent) => {
            showError(event.getMessage(), false);
            this.contentWizardPanel.showForm();
            this.contextWindow.setItemVisible(this.insertablesPanel, false);
        });

        eventsManager.onLiveEditPageDialogCreate((event: CreateHtmlAreaDialogEvent) => {
            const modalDialog: ModalDialog = HTMLAreaDialogHandler.createAndOpenDialog(event);
            eventsManager.notifyDialogCreated(modalDialog, event.getConfig());
        });

        eventsManager.onTextComponentEditModeChanged((value: boolean) => {
            this.isTextModeOn = value;

            if (value && this.isContextPanelExpanded() && !this.isContextPanelDocked()) {
                new ToggleContextPanelEvent().fire();
            }
        });
    }

    private saveMarkedContentAndReloadOnlyComponent(path: ComponentPath) {
        const canMarkContentAsReady = this.canMarkContentAsReady();
        this.contentWizardPanel.setMarkedAsReady(canMarkContentAsReady);
        this.saveAndReloadOnlyComponent(path);
    }

    private canMarkContentAsReady(): boolean {
        if (!this.content.isReady()) {
            return false;
        }

        const persistedContent = this.contentWizardPanel.getPersistedItem();
        const persistedContentBuilder = LiveFormPanel.createContentBuilderWithoutModifiedDate(persistedContent);
        const viewedContent = this.contentWizardPanel.assembleViewedContent(persistedContentBuilder).setPage(null).build();
        const serverContent = LiveFormPanel.createContentBuilderWithoutModifiedDate(this.content).setPage(null).build();

        const hasChangesOutsidePage = !viewedContent.equals(serverContent);

        if (hasChangesOutsidePage) {
            return false;
        }

        const viewedPage = PageState.getState();
        const serverPage = persistedContent.getPage()?.clone();

        return viewedPage.equals(serverPage);
    }

    private static createContentBuilderWithoutModifiedDate(content: Content): ContentBuilder {
        const builder = content.newBuilder();
        builder.modifiedTime = null;
        return builder;
    }

    private inspectPage(params: InspectPageParams) {
        const unlocked = !this.liveEditPageProxy?.isLocked();
        const canShowWidget = unlocked && params.showWidget;
        const canShowPanel = unlocked && params.showPanel;
        this.contextWindow?.showInspectionPanel(
            getInspectParameters({
                panel: this.pageInspectionPanel,
                showWidget: canShowWidget,
                showPanel: canShowPanel,
                source: params.source,
                keepPanelSelection: params.keepPanelSelection
            })
        );
    }

    private clearSelection(showInsertables: boolean = true): boolean {
        const customizedWithController = !this.content.getPage() && PageState.getState()?.hasController();
        const isFragmentContent = PageState.getState()?.isFragment();

        if (this.liveEditModel?.getDefaultModels().hasDefaultPageTemplate() || customizedWithController || isFragmentContent) {
            this.contextWindow.clearSelection(showInsertables);
            return true;
        }

        return false;
    }

    clearSelectionAndInspect(showPanel: boolean, showWidget: boolean) {
        const cleared = this.clearSelection(false);
        const params = cleared ?
            {showPanel: showPanel, showWidget: showWidget, keepPanelSelection: true} :
            {showPanel: false, showWidget: true, keepPanelSelection: true};

        this.inspectPage(params);
    }

    private inspectRegion(regionPath: ComponentPath, source?: PageNavigationEventSource): void {
        const region: Region = PageState.getState().getComponentByPath(regionPath) as Region;

        this.regionInspectionPanel.setRegion(region);
        this.contextWindow.showInspectionPanel(
            getInspectParameters({
                panel: this.regionInspectionPanel,
                showWidget: true,
                showPanel: true,
                source: source,
            })
        );
    }

    private doInspectComponent(component: Component, showPanel: boolean) {
        const showInspectionPanel = (panel: BaseInspectionPanel) =>
            this.contextWindow.showInspectionPanel(
                getInspectParameters({
                    panel,
                    showWidget: true,
                    showPanel,
                    keepPanelSelection: false,
                    silent: true
                })
            );
        if (component instanceof ImageComponent) {
            showInspectionPanel(this.imageInspectionPanel);
            this.imageInspectionPanel.setImageComponent(component);
        } else if (component instanceof PartComponent) {
            showInspectionPanel(this.partInspectionPanel);
            this.partInspectionPanel.setDescriptorBasedComponent(component);
        } else if (component instanceof LayoutComponent) {
            showInspectionPanel(this.layoutInspectionPanel);
            this.layoutInspectionPanel.setDescriptorBasedComponent(component);
        } else if (component instanceof TextComponent) {
            showInspectionPanel(this.textInspectionPanel);
            this.textInspectionPanel.setTextComponent(component);
        } else if (component instanceof FragmentComponent) {
            showInspectionPanel(this.fragmentInspectionPanel);
            this.fragmentInspectionPanel.setFragmentComponent(component);
        } else {
            throw new Error('Component cannot be selected: ' + ClassHelper.getClassName(component));
        }
    }

    private inspectComponentOnDemand(component: Component, source?: PageNavigationEventSource): void {
        assertNotNull(component, 'component cannot be null');

        // not showing/hiding inspection panel if component has no descriptor or if is in text edit mode
        const isPanelToHide: boolean = this.isInspectComponentToHide(component);
        const waitForContextPanel = !isPanelToHide && this.isContextPanelCollapsed();

        if (isPanelToHide && this.isContextPanelExpanded() && !this.isContextPanelDocked()) {
            new ToggleContextPanelEvent().fire();
        }

        if (waitForContextPanel) {
            // Wait until ContextPanel is expanded before activating the InspectPanel inside
            this.componentToInspectOnContextPanelExpand = component;
        }

        InspectEvent.create().setShowWidget(true).setShowPanel(!isPanelToHide).setSource(source).build().fire();

        if (waitForContextPanel) {
            return;
        }

        this.doInspectComponent(component, !isPanelToHide);
    }

    private isInspectComponentToHide(component: Component): boolean {
        if (this.isTextModeOn) {
            return true;
        }

        return component instanceof DescriptorBasedComponent && !component.hasDescriptor() && this.isShown();
    }

    private openComponentInspect(component: Component, source?: PageNavigationEventSource): void {
        assertNotNull(component, 'component cannot be null');

        InspectEvent.create().setShowWidget(true).setShowPanel(true).setSource(source).build().fire();

        this.doInspectComponent(component, true);
    }

    isShown(): boolean {
        return !ObjectHelper.stringEquals(this.getHTMLElement().style.display, 'none');
    }

    setEnabled(enabled: boolean): void {
        this.modifyPermissions = enabled;
        this.insertablesPanel?.setModifyPermissions(enabled);
        this.liveEditPageProxy?.setModifyPermissions(enabled);
        this.placeholder?.setEnabled(enabled);
    }

    setContextPanelMode(mode: ContextPanelMode): void {
        this.contextPanelMode = mode;
    }

    setContextPanelState(state: ContextPanelState): void {
        this.contextPanelState = state;

        if (this.componentToInspectOnContextPanelExpand) {
            if (state === ContextPanelState.EXPANDED) {
                this.doInspectComponent(this.componentToInspectOnContextPanelExpand, true);
            }

            this.componentToInspectOnContextPanelExpand = null;
        }
    }

    unloadPage(): void {
        this.liveEditPageProxy?.unload();
        this.frameContainer?.hide();
        this.partInspectionPanel?.unbindSiteModelListeners();
        this.layoutInspectionPanel?.unbindSiteModelListeners();
        this.liveEditModel = null;

        if (this.placeholder) {
            this.placeholder.deselectOptions();
            this.placeholder.show();
        } else {
            this.createLiveEditPagePlaceholder();
        }

        this.removeContentEventListeners();
    }

    private removeContentEventListeners(): void {
        ContentDeletedEvent.un(this.contentEventListener);
        ContentUpdatedEvent.un(this.contentEventListener);
        this.hasContentEventListeners = false;
    }

    setHasPage(hasPage: boolean): void {
        const isChanged = !ObjectHelper.isDefined(this.hasPage) || hasPage !== this.hasPage;
        this.hasPage = hasPage;

        if (isChanged) {
            this.debouncedUpdateFunc();
        }
    }

    setHasMissingApps(hasMissingApps: boolean): void {
        const isChanged = !ObjectHelper.isDefined(this.hasMissingApps) || this.hasMissingApps !== hasMissingApps;
        this.hasMissingApps = hasMissingApps;

        if (isChanged) {
            this.debouncedUpdateFunc();
        }
    }

    setIsRenderable(isRenderable: boolean): void {
        const isChanged = !ObjectHelper.isDefined(this.isRenderable) || this.isRenderable !== isRenderable;
        this.isRenderable = isRenderable;

        if (isChanged) {
            this.debouncedUpdateFunc();
        }
    }

    getContextWindow(): ContextWindow {
        return this.contextWindow;
    }

    handle(event: PageNavigationEvent): void {
        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.contextWindow.clearSelection(true);
            return;
        }

        if (event.getType() === PageNavigationEventType.SELECT) {
            this.inspectPageItemByPath(event.getData());
            return;
        }

        if (event.getType() === PageNavigationEventType.INSPECT) {
            this.inspectPageItemByPath(event.getData(), true);
            return;
        }
    }

    private inspectPageItemByPath(data: PageNavigationEventData, force?: boolean): void {
        const path: ComponentPath = data.getPath();
        this.lastInspectedItemPath = path;
        const currentPage: Page = PageState.getState();
        const item: PageItem = currentPage?.getComponentByPath(path);

        if (item instanceof Component) {
            if (force) { // force inspecting component
                this.openComponentInspect(item, data.getSource());
            } else { // inspect component only if inspection panel is open, close if no descriptor
                this.inspectComponentOnDemand(item, data.getSource());
            }
        } else if (item instanceof Region) {
            this.inspectRegion(path, data.getSource());
        } else if (item instanceof Page || (!currentPage && path.isRoot())) {
            this.inspectPage({showPanel: true, showWidget: true, source: data.getSource()});
        }
    }

    private isContextPanelExpanded(): boolean {
        return this.contextPanelState === ContextPanelState.EXPANDED;
    }

    private isContextPanelCollapsed(): boolean {
        return this.contextPanelState === ContextPanelState.COLLAPSED;
    }

    private isContextPanelDocked(): boolean {
        return this.contextPanelMode === ContextPanelMode.DOCKED;
    }

    setSaveEnabled(enabled: boolean): void {
        this.saveAction.setEnabled(enabled);
    }

    private updateRenderingState(): void {
        if (this.isRenderable) {
            this.clearErrorMissingApps();
            return;
        }

        // live edit is not rendered, setting state depending on the reason

        if (!this.hasPage) {  // no page, OK, nothing to render, just show placeholder
            this.handleNoPage();
            return;
        }

        // has page, but not renderable, not OK

        if (this.hasMissingApps) { // some apps are missing, assuming error is because of that (actually maybe not but we can't know)
            this.setErrorMissingApps();
        } else { // some other error
            this.handleErrorRenderingPage();
        }
    }

    private handleNoPage(): void {
        this.clearErrorMissingApps();
        this.placeholder?.setHasControllersMode(this.hasAvailableControllers);
    }

    private handleErrorRenderingPage(): void {
        this.clearErrorMissingApps();

        if (!this.placeholder) {
            this.createLiveEditPagePlaceholder();
        }

        this.frameContainer?.hide();
        this.placeholder.setPageIsNotRenderableMode();
        this.placeholder.show();
    }
}
