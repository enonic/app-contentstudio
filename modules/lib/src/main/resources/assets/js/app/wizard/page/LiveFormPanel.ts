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
import {PageView} from '../../../page-editor/PageView';
import {ComponentView} from '../../../page-editor/ComponentView';
import {LiveEditPageViewReadyEvent} from '../../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/LiveEditPageInitializationErrorEvent';
import {ComponentViewDragDroppedEvent} from '../../../page-editor/ComponentViewDragDroppedEventEvent';
import {ComponentFragmentCreatedEvent} from '../../../page-editor/ComponentFragmentCreatedEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {PageModel} from '../../../page-editor/PageModel';
import {ComponentDetachedFromFragmentEvent} from '../../../page-editor/ComponentDetachedFromFragmentEvent';
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
import {Page, PageBuilder} from '../../page/Page';
import {PartComponent} from '../../page/region/PartComponent';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import {ImageComponent} from '../../page/region/ImageComponent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {ComponentPath} from '../../page/region/ComponentPath';
import {PageMode} from '../../page/PageMode';
import {BaseInspectionPanel} from './contextwindow/inspect/BaseInspectionPanel';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentIds} from '../../content/ContentIds';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {BrEl} from '@enonic/lib-admin-ui/dom/BrEl';
import {ContentId} from '../../content/ContentId';
import {InspectEvent} from '../../event/InspectEvent';
import {ContextSplitPanel} from '../../view/context/ContextSplitPanel';
import {ContextPanelStateEvent} from '../../view/context/ContextPanelStateEvent';
import {LiveEditPagePlaceholder} from './LiveEditPagePlaceholder';
import {Descriptor} from '../../page/Descriptor';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentType} from '../../inputtype/schema/ContentType';
import {ApplicationRemovedEvent} from '../../site/ApplicationRemovedEvent';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
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

export interface LiveFormPanelConfig {

    contentType: ContentType;

    contentWizardPanel: ContentWizardPanel;

    defaultModels: DefaultModels;

    content: Content;

    liveEditPage: LiveEditPageProxy;
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

    private pageView: PageView;

    private pageModel: PageModel;

    private pageLoading: boolean = false;

    private pageSkipReload: boolean = false;

    private frameContainer?: Panel;

    private lockPageAfterProxyLoad: boolean = false;

    private modifyPermissions: boolean;

    private contextWindow: ContextWindow;

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

    private contentEventListener: (event: any) => void;

    private hasContentEventListeners: boolean;

    private isPageNotRenderable: boolean;

    private showLoadMaskHandler: () => void;
    private hideLoadMaskHandler: () => void;
    private contentUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;
    private contentPermissionsUpdatedHandler: (contentIds: ContentIds) => void;
    private applicationRemovedHandler: (event: ApplicationRemovedEvent) => void;

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel');

        this.contentWizardPanel = config.contentWizardPanel;
        this.defaultModels = config.defaultModels;
        this.content = config.content;
        this.contentType = config.contentType;
        this.liveEditPageProxy = config.liveEditPage;

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();
        this.initEventHandlers();
    }

    protected initElements(): void {
        if (!this.content.getPage()) {
            this.createLiveEditPagePlaceholder();
            this.updatePlaceholder();
        }

        this.initPageRequiredElements();
    }

    private updatePlaceholder(): void {
        this.hasControllers().then((hasControllers: boolean) => {
            this.placeholder.setHasControllers(hasControllers);
        }).catch(DefaultErrorHandler.handle);
    }

    hasControllers(): Q.Promise<boolean> {
        return this.createControllersRequest().sendAndParse().then((descriptors: Descriptor[]) => {
            return Q.resolve(descriptors.length > 0);
        }).catch((err) => {
            DefaultErrorHandler.handle(err);
            return Q.resolve(false);
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
        this.listenControllerSelected();
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

        this.applicationRemovedHandler = (event: ApplicationRemovedEvent) => {
            const currentController: Descriptor = this.pageModel?.getController();
            const removedApp: ApplicationKey = event.getApplicationKey();

            if (currentController && removedApp.equals(currentController.getKey().getApplicationKey())) {
                this.pageModel.setMode(PageMode.NO_CONTROLLER);
            }
        };

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
                }
            } else if (event instanceof ComponentImageUpdatedEvent) {
                if (event.getImageId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndReloadOnlyComponent(event.getPath());
                }
            } else if (event instanceof ComponentFragmentUpdatedEvent) {
                if (event.getFragmentId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndReloadOnlyComponent(event.getPath());
                }
            }
        };

        const pageUpdatedHandler = () => {
            this.contentWizardPanel.setMarkedAsReady(false);
            this.contentWizardPanel.saveChanges().catch((error: any) => {
                DefaultErrorHandler.handle(error);
            });
        };

        PageState.getEvents().onComponentUpdated(componentUpdatedHandler);
        PageState.getEvents().onPageUpdated(pageUpdatedHandler);
        PageState.getEvents().onPageReset(pageUpdatedHandler);
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
        summaryAndStatuses.some((summaryAndStatus: ContentSummaryAndCompareStatus) => {
            if (this.content.getContentId().equals(summaryAndStatus.getContentId())) {
                SaveAsTemplateAction.get()?.setContentSummary(summaryAndStatuses[0].getContentSummary());

                if (!this.isPageNotRenderable && this.placeholder && !this.placeholder.hasSelectedController()) {
                    this.updatePlaceholder();
                }

                return true;
            }
        });
    }

    private handleContentPermissionsUpdate(contentIds: ContentIds) {
        if (!this.content) {
            return;
        }

        const thisContentId: ContentId = this.content.getContentId();
        const isThisContentUpdated: boolean = contentIds.contains(thisContentId);

        if (!isThisContentUpdated) {
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
                this.pageView.setLocked(true);
                this.lockPageAfterProxyLoad = false;
            }

            this.imageInspectionPanel.refresh();
        });
    }

    private listenControllerSelected(): void {
        this.placeholder.onControllerSelected(() => {
            this.contentWizardPanel.setMarkedAsReady(false);
            this.contentWizardPanel.saveChanges().catch(DefaultErrorHandler.handle);
        });
    }

    private createContextWindow(): ContextWindow { //
        this.inspectionsPanel = this.createInspectionsPanel();

        this.pageView?.getPageViewController().onTextEditModeChanged((value: boolean) => {
            if (this.inspectionsPanel.getPanelShown() === this.textInspectionPanel) {
                this.inspectionsPanel.setButtonContainerVisible(value);
            }
        });

        this.insertablesPanel = new InsertablesPanel({
            liveEditPage: this.liveEditPageProxy,
            contentWizardPanel: this.contentWizardPanel,
            saveAsTemplateAction: SaveAsTemplateAction.get()
        });

        this.insertablesPanel.setModifyPermissions(this.modifyPermissions);

        return new ContextWindow(<ContextWindowConfig>{
            liveFormPanel: this,
            inspectionPanel: this.inspectionsPanel,
            insertablesPanel: this.insertablesPanel
        });
    }

    private createInspectionsPanel(): InspectionsPanel {
        const saveAction: Action = new Action(i18n('action.apply'));

        saveAction.onExecuted(() => {
            if (this.pageView) {
                const itemView = this.pageView.getSelectedView();
                if (ObjectHelper.iFrameSafeInstanceOf(itemView, ComponentView)) {
                    const persistedContent = this.contentWizardPanel.getPersistedItem();
                    const viewedPage: Page = this.getPage()?.clone();
                    const savedPage: Page = persistedContent.getPage()?.clone();

                    if (!ObjectHelper.equals(viewedPage, savedPage)) {
                        this.contentWizardPanel.setMarkedAsReady(false);
                    }

                    this.saveAndReloadOnlyComponent(null);
                    return;
                }
            }

            this.contentWizardPanel.saveChanges().catch((error: any) => {
                DefaultErrorHandler.handle(error);
            });
        });

        this.contentInspectionPanel = new ContentInspectionPanel();

        this.pageInspectionPanel = new PageInspectionPanel(SaveAsTemplateAction.get());
        this.partInspectionPanel = new PartInspectionPanel();
        this.layoutInspectionPanel = new LayoutInspectionPanel();
        this.imageInspectionPanel = new ImageInspectionPanel();
        this.fragmentInspectionPanel = new FragmentInspectionPanel();

        this.textInspectionPanel = new TextInspectionPanel();
        this.regionInspectionPanel = new RegionInspectionPanel();

        return new InspectionsPanel(<InspectionsPanelConfig>{
            contentInspectionPanel: this.contentInspectionPanel,
            pageInspectionPanel: this.pageInspectionPanel,
            regionInspectionPanel: this.regionInspectionPanel,
            imageInspectionPanel: this.imageInspectionPanel,
            partInspectionPanel: this.partInspectionPanel,
            layoutInspectionPanel: this.layoutInspectionPanel,
            fragmentInspectionPanel: this.fragmentInspectionPanel,
            textInspectionPanel: this.textInspectionPanel,
            saveAction: saveAction
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            WindowDOM.get().onBeforeUnload((event) => {
                console.log('onbeforeunload ' + this.liveEditModel?.getContent().getDisplayName());
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

    private setErrorRenderingFailed() {
        this.addErrorMessage(ErrorType.RENDER_ERROR, 'field.preview.failed.description');
    }

    setErrorMissingApps() {
        this.addErrorMessage(ErrorType.APP_MISSING, 'field.preview.missing.description');
    }

    clearErrorMissingApps() {
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
            this.previewMessageEl.appendChildren<any>(
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

    public getPage(): Page {
        return this.pageModel?.getPage() || this.assemblePageFromSelectedController();
    }

    private assemblePageFromSelectedController(): Page {
        if (this.placeholder?.hasSelectedController()) {
            const descriptor: Descriptor = this.placeholder.getSelectedController();
            return new PageBuilder()
                .setController(descriptor.getKey())
                .setConfig(new PropertyTree())
                .build();
        }

        return null;
    }

    public getPageMode(): PageMode {
        return this.pageModel ? this.pageModel.getMode() : null;
    }

    public getPageView(): PageView {
        return this.pageView;
    }

    setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel?.getSiteModel()?.unApplicationRemoved(this.applicationRemovedHandler);

        this.liveEditModel = liveEditModel;
        this.content = liveEditModel.getContent();
        this.pageModel = liveEditModel.getPageModel();
        this.pageModel.setIgnorePropertyChanges(true);
        this.isPageNotRenderable = false;

        const site: Site = this.content.isSite()
                           ? <Site>this.content
                           : liveEditModel.getSiteModel()
                             ? this.liveEditModel.getSiteModel().getSite()
                             : null;

        SaveAsTemplateAction.get()
            .setContentSummary(this.content)
            .setPageModel(this.pageModel)
            .setSite(site);

        this.liveEditPageProxy.setModel(liveEditModel);
        this.pageInspectionPanel.setModel(liveEditModel);
        this.partInspectionPanel.setModel(liveEditModel);
        this.layoutInspectionPanel.setModel(liveEditModel);
        this.imageInspectionPanel.setModel(liveEditModel);
        this.fragmentInspectionPanel.setModel(liveEditModel);

        this.pageModel.setIgnorePropertyChanges(false);
        this.liveEditModel.getSiteModel().onApplicationRemoved(this.applicationRemovedHandler);

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

    private saveAndReloadOnlyComponent(path: ComponentPath) {
        assertNotNull(path, 'component path cannot be null');
        this.pageSkipReload = true;

        const componentUrl: string = UriHelper.getComponentUri(this.content.getContentId().toString(),
            path,
            RenderingMode.EDIT);

        this.contentWizardPanel.saveChangesWithoutValidation(false).then(() => {
            this.pageSkipReload = false;
            this.liveEditPageProxy.loadComponent(path, componentUrl);
        });
    }

    private addPageProxyEventListeners() {
        const eventsManager = PageEventsManager.get();

        eventsManager.onPageLocked(() => {
            this.inspectPage(false);
        });

        eventsManager.onLiveEditPageViewReady((event: LiveEditPageViewReadyEvent) => {
            this.pageView = event.getPageView();

            // disable insert tab if there is no page for some reason (i.e. error occurred)
            // or there is no controller or template set
            const pageModelRenderable = this.pageModel?.isRenderable();
            this.contextWindow.setItemVisible(this.insertablesPanel, !!this.pageView && pageModelRenderable);

            if (!this.pageView) {
                this.setErrorRenderingFailed();
            }
        });

        eventsManager.onPageSaveAsTemplate(() => {
            console.log('here');
            SaveAsTemplateAction.get().execute();
        });

        PageState.getEvents().onComponentRemoved(() => {
            if (!this.pageModel.isPageTemplate() && this.pageModel.getMode() === PageMode.AUTOMATIC) {
                this.pageModel.initializePageFromDefault(this);
            }

            this.clearSelection();
        });

        eventsManager.onComponentViewDragDropped((event: ComponentViewDragDroppedEvent) => {
            let componentView = event.getComponentView();
            if (!componentView.isEmpty()) {
                this.inspectComponentByPath(componentView.getPath());
            }
        });

        eventsManager.onComponentFragmentCreated((event: ComponentFragmentCreatedEvent) => {
            let componentType = event.getSourceComponentType().getShortName();
            let componentName = event.getFragmentContent().getDisplayName();
            showSuccess(i18n('notify.fragment.created', componentName, componentType));

         //   this.saveMarkedContentAndReloadOnlyComponent(event.get());

            let summaryAndStatus = ContentSummaryAndCompareStatus.fromContentSummary(event.getFragmentContent());
            new EditContentEvent([summaryAndStatus]).fire();
        });

        eventsManager.onComponentDetached((event: ComponentDetachedFromFragmentEvent) => {
            showSuccess(i18n('notify.component.detached', event.getComponentView().getName()));

       //     this.saveMarkedContentAndReloadOnlyComponent(event.getComponentView());
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
        });

        eventsManager.onLiveEditPageDialogCreate((event: CreateHtmlAreaDialogEvent) => {
            const modalDialog: ModalDialog = HTMLAreaDialogHandler.createAndOpenDialog(event);
            eventsManager.notifyDialogCreated(modalDialog, event.getConfig());
        });
    }

    private saveMarkedContentAndReloadOnlyComponent(path: ComponentPath) {
        const canMarkContentAsReady = this.canMarkContentAsReady(path);
        this.contentWizardPanel.setMarkedAsReady(canMarkContentAsReady);
        this.saveAndReloadOnlyComponent(path);
    }

    private canMarkContentAsReady(componentPath: ComponentPath): boolean {
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

        const viewedPage = this.getPage().clone();
        const serverPage = persistedContent.getPage().clone();

        const component = viewedPage.getComponentByPath(componentPath);
        const originalComponent = serverPage.getComponentByPath(componentPath);

        if (component && component instanceof Component) {
            component.remove();
        }
        if (originalComponent && originalComponent instanceof Component) {
            originalComponent.remove();
        }

        return viewedPage.equals(serverPage);
    }

    private static createContentBuilderWithoutModifiedDate(content: Content): ContentBuilder {
        const builder = content.newBuilder();
        builder.modifiedTime = null;
        return builder;
    }

    private inspectPage(showPanel: boolean, showWidget: boolean = true, keepPanelSelection?: boolean) {
        const unlocked = this.pageView ? !this.pageView.isLocked() : true;
        const canShowWidget = unlocked && showWidget;
        const canShowPanel = unlocked && showPanel;
        this.contextWindow?.showInspectionPanel(
            getInspectParameters({
                panel: this.pageInspectionPanel,
                showWidget: canShowWidget,
                showPanel: canShowPanel,
                keepPanelSelection
            })
        );
    }

    private clearSelection(showInsertables: boolean = true): boolean {
        const pageModel = this.liveEditModel.getPageModel();
        const customizedWithController = pageModel.isCustomized() && pageModel.hasController();
        const isFragmentContent = pageModel.getMode() === PageMode.FRAGMENT;
        if (pageModel.hasDefaultPageTemplate() || customizedWithController || isFragmentContent) {
            this.contextWindow.clearSelection(showInsertables);
            return true;
        }

        return false;
    }

    clearSelectionAndInspect(showPanel: boolean, showWidget: boolean) {
        const cleared = this.clearSelection(false);
        if (cleared) {
            this.inspectPage(showPanel, showWidget, true);
        } else {
            this.inspectPage(false, true, true);
        }
    }

    private inspectRegion(regionPath: ComponentPath, showPanel: boolean) {
        const region: Region = this.pageModel.getComponentByPath(regionPath) as Region;

        this.regionInspectionPanel.setRegion(region);
        this.contextWindow.showInspectionPanel(
            getInspectParameters({
                panel: this.regionInspectionPanel,
                showWidget: true,
                showPanel
            })
        );
    }

    private doInspectComponent(component: Component, showWidget: boolean, showPanel: boolean) {
        const showInspectionPanel = (panel: BaseInspectionPanel) =>
            this.contextWindow.showInspectionPanel(
                getInspectParameters({
                    panel,
                    showWidget,
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
            this.inspectionsPanel.setButtonContainerVisible(this.pageView?.getPageViewController().isTextEditMode());
        } else if (component instanceof FragmentComponent) {
            showInspectionPanel(this.fragmentInspectionPanel);
            this.fragmentInspectionPanel.setFragmentComponent(component);
        } else {
            throw new Error('Component cannot be selected: ' + ClassHelper.getClassName(component));
        }
    }

    private inspectComponent(component: Component, showWidget: boolean = true, showPanel: boolean = true) {
        assertNotNull(component, 'componentView cannot be null');

        const waitForContextPanel = showPanel && ContextSplitPanel.isCollapsed();

        if (waitForContextPanel) {
            // Wait until ContextPanel is expanded before activating the InspectPanel inside
            const stateChangeHandler = (event: ContextPanelStateEvent) => {
                if (ContextSplitPanel.isExpanded()) {
                    setTimeout(() => {
                        this.doInspectComponent(component, showWidget, showPanel);
                    }, 500);
                }
                ContextPanelStateEvent.un(stateChangeHandler);
            };
            ContextPanelStateEvent.on(stateChangeHandler);
        }

        if (this.isPanelSelectable()) {
            new InspectEvent(showWidget, showPanel).fire();
        }

        if (waitForContextPanel) {
            return;
        }

        this.doInspectComponent(component, showWidget, showPanel);
    }

    private isPanelSelectable(): boolean {
        return !PageState.getState().isFragment();
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

    unloadPage(): void {
        this.liveEditPageProxy?.unload();
        this.frameContainer?.hide();
        this.partInspectionPanel?.unbindSiteModelListeners();
        this.layoutInspectionPanel?.unbindSiteModelListeners();
        this.liveEditModel = null;
        this.pageModel = null;

        if (this.placeholder) {
            this.placeholder.deselectOptions();
            this.placeholder.show();
            this.updatePlaceholder();
        } else {
            this.createLiveEditPagePlaceholder();
            this.updatePlaceholder();
        }

        this.removeContentEventListeners();
    }

    private removeContentEventListeners(): void {
        ContentDeletedEvent.un(this.contentEventListener);
        ContentUpdatedEvent.un(this.contentEventListener);
        this.hasContentEventListeners = false;
    }

    setPageIsNotRenderable(): void {
        this.isPageNotRenderable = true;

        if (!this.placeholder) {
            this.createLiveEditPagePlaceholder();
        }

        this.frameContainer?.hide();
        this.placeholder.setPageIsNotRenderable();
        this.placeholder.show();
    }

    getContextWindow(): ContextWindow {
        return this.contextWindow;
    }

    handle(event: PageNavigationEvent): void {
        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.clearSelection();
            return;
        }

        if (event.getType() === PageNavigationEventType.SELECT) {
            this.inspectComponentByPath(event.getData().getPath());
            return;
        }

        if (event.getType() === PageNavigationEventType.INSPECT) {
            this.inspectComponentByPath(event.getData().getPath());
            return;
        }
    }

    private inspectComponentByPath(path: ComponentPath): void {
        const item: PageItem = path.isRoot() ? PageState.getState() : PageState.getState().getComponentByPath(path);

        if (item instanceof Component) {
            this.inspectComponent(item);
        } else if (item instanceof Region) {
            this.inspectRegion(path, true);
        } else if (item instanceof Page) {
            this.inspectPage(true);
        }
    }
}
