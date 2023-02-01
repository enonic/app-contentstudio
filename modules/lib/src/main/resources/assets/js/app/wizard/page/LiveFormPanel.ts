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
import {ContextWindowController} from './contextwindow/ContextWindowController';
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
import {PartComponentView} from '../../../page-editor/part/PartComponentView';
import {LayoutComponentView} from '../../../page-editor/layout/LayoutComponentView';
import {RegionView} from '../../../page-editor/RegionView';
import {PageSelectedEvent} from '../../../page-editor/PageSelectedEvent';
import {RegionSelectedEvent} from '../../../page-editor/RegionSelectedEvent';
import {ItemViewSelectedEvent} from '../../../page-editor/ItemViewSelectedEvent';
import {ItemViewDeselectedEvent} from '../../../page-editor/ItemViewDeselectedEvent';
import {TextComponentView} from '../../../page-editor/text/TextComponentView';
import {ComponentRemovedEvent} from '../../../page-editor/ComponentRemovedEvent';
import {ComponentViewDragDroppedEvent} from '../../../page-editor/ComponentViewDragDroppedEventEvent';
import {ComponentDuplicatedEvent} from '../../../page-editor/ComponentDuplicatedEvent';
import {ComponentInspectedEvent} from '../../../page-editor/ComponentInspectedEvent';
import {PageInspectedEvent} from '../../../page-editor/PageInspectedEvent';
import {ComponentFragmentCreatedEvent} from '../../../page-editor/ComponentFragmentCreatedEvent';
import {FragmentComponentView} from '../../../page-editor/fragment/FragmentComponentView';
import {FragmentComponentReloadRequiredEvent} from '../../../page-editor/FragmentComponentReloadRequiredEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {ImageComponentView} from '../../../page-editor/image/ImageComponentView';
import {PageModel} from '../../../page-editor/PageModel';
import {ComponentDetachedFromFragmentEvent} from '../../../page-editor/ComponentDetachedFromFragmentEvent';
import {BeforeContentSavedEvent} from '../../event/BeforeContentSavedEvent';
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
import {Component, ComponentPropertyChangedEventHandler} from '../../page/region/Component';
import {Page, PageBuilder} from '../../page/Page';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {ComponentPropertyChangedEvent} from '../../page/region/ComponentPropertyChangedEvent';
import {PartComponent} from '../../page/region/PartComponent';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import {ImageComponent} from '../../page/region/ImageComponent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {ComponentPath} from '../../page/region/ComponentPath';
import {PageMode} from '../../page/PageMode';
import {RegionPath} from '../../page/region/RegionPath';
import {BaseInspectionPanel} from './contextwindow/inspect/BaseInspectionPanel';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentIds} from '../../content/ContentIds';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {BrEl} from '@enonic/lib-admin-ui/dom/BrEl';
import {ContentId} from '../../content/ContentId';
import {ItemView} from '../../../page-editor/ItemView';
import {HtmlEditorCursorPosition} from '../../inputtype/ui/text/HtmlEditor';
import * as $ from 'jquery';
import {InspectEvent} from '../../event/InspectEvent';
import {ContextSplitPanel} from '../../view/context/ContextSplitPanel';
import {ContextPanelStateEvent} from '../../view/context/ContextPanelStateEvent';
import {LiveEditPagePlaceholder} from './LiveEditPagePlaceholder';
import {Descriptor} from '../../page/Descriptor';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentType} from '../../inputtype/schema/ContentType';
import {ApplicationRemovedEvent} from '../../site/ApplicationRemovedEvent';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {DescriptorKey} from '../../page/DescriptorKey';
import {ModalDialog} from '../../inputtype/ui/text/dialog/ModalDialog';

export interface LiveFormPanelConfig {

    contentType: ContentType;

    contentWizardPanel: ContentWizardPanel;

    defaultModels: DefaultModels;

    content: Content;
}

enum ErrorType {
    APP_MISSING = 0,
    RENDER_ERROR = 1
}

export class LiveFormPanel
    extends Panel {

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

    private modifyPermissions: boolean = false;

    private contextWindow: ContextWindow;
    private contextWindowController: ContextWindowController;

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

    private saveAsTemplateAction: SaveAsTemplateAction;

    private showLoadMaskHandler: () => void;
    private hideLoadMaskHandler: () => void;
    private componentPropertyChangedHandler: ComponentPropertyChangedEventHandler;
    private propertyChangedHandler: (event: PropertyChangedEvent) => void;
    private contentUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;
    private contentPermissionsUpdatedHandler: (contentIds: ContentIds) => void;
    private applicationRemovedHandler: (event: ApplicationRemovedEvent) => void;

    private pageViewReadyListeners: { (pageView: PageView): void }[] = [];

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel');

        this.contentWizardPanel = config.contentWizardPanel;
        this.defaultModels = config.defaultModels;
        this.content = config.content;
        this.contentType = config.contentType;

        this.initElements();
        this.initEventHandlers();
    }

    protected initElements(): void {
        if (!this.content.getPage()) {
            this.createLiveEditPagePlaceholder();
            this.placeholder.loadControllers();
        }

        this.initPageRequiredElements();
    }

    protected initPageRequiredElements(): void {
        this.saveAsTemplateAction = new SaveAsTemplateAction();
        this.liveEditPageProxy = new LiveEditPageProxy(this.content.getContentId());
        this.liveEditPageProxy.setModifyPermissions(this.modifyPermissions);
        this.contextWindow = this.createContextWindow();

        // constructor to listen to live edit events during wizard rendering
        this.contextWindowController = new ContextWindowController(
            this.contextWindow,
            this.contentWizardPanel
        );

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
            const currentController: Descriptor = this.pageModel.getController();
            const removedApp: ApplicationKey = event.getApplicationKey();

            if (currentController && removedApp.equals(currentController.getKey().getApplicationKey())) {
                this.pageModel.setMode(PageMode.NO_CONTROLLER);
            }
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

    private initPropertyChangedHandlers() {
        this.componentPropertyChangedHandler = (event: ComponentPropertyChangedEvent) => {
            if (ObjectHelper.iFrameSafeInstanceOf(event.getComponent(), DescriptorBasedComponent)) {
                if (event.getPropertyName() === DescriptorBasedComponent.PROPERTY_DESCRIPTOR) {

                    const componentView = this.pageView.getComponentViewByPath(event.getPath());
                    if (componentView) {
                        if (ObjectHelper.iFrameSafeInstanceOf(componentView, PartComponentView)) {
                            const partView = <PartComponentView>componentView;
                            const partComponent: PartComponent = partView.getComponent();
                            if (partComponent.hasDescriptor()) {
                                this.contentWizardPanel.setMarkedAsReady(false);
                                this.saveAndReloadOnlyComponent(componentView);
                            }
                        } else if (ObjectHelper.iFrameSafeInstanceOf(componentView, LayoutComponentView)) {
                            const layoutView = <LayoutComponentView>componentView;
                            const layoutComponent: LayoutComponent = layoutView.getComponent();
                            if (layoutComponent.hasDescriptor()) {
                                this.contentWizardPanel.setMarkedAsReady(false);
                                this.saveAndReloadOnlyComponent(componentView);
                            }
                        }
                    } else {
                        console.debug('ComponentView by path not found: ' + event.getPath().toString());
                    }
                }
            } else if (ObjectHelper.iFrameSafeInstanceOf(event.getComponent(), ImageComponent)) {
                if (event.getPropertyName() === ImageComponent.PROPERTY_IMAGE && !event.getComponent().isEmpty()) {
                    const componentView = this.pageView.getComponentViewByPath(event.getPath());
                    if (componentView) {
                        this.contentWizardPanel.setMarkedAsReady(false);
                        this.saveAndReloadOnlyComponent(componentView);
                    }
                }
            } else if (ObjectHelper.iFrameSafeInstanceOf(event.getComponent(), FragmentComponent)) {
                if (event.getPropertyName() === FragmentComponent.PROPERTY_FRAGMENT && !event.getComponent().isEmpty()) {
                    const componentView = this.pageView.getComponentViewByPath(event.getPath());
                    if (componentView) {
                        this.contentWizardPanel.setMarkedAsReady(false);
                        this.saveAndReloadOnlyComponent(componentView);
                    }
                }
            }
        };

        this.propertyChangedHandler = (event: PropertyChangedEvent) => {

            // NB: To make the event.getSource() check work,
            // all calls from this to PageModel that changes a property must done with this as eventSource argument
            if (!ObjectHelper.objectEquals(this, event.getSource())) {

                const oldValue = event.getOldValue();
                const newValue = event.getNewValue();

                if (event.getPropertyName() === PageModel.PROPERTY_CONTROLLER && !ObjectHelper.objectEquals(oldValue, newValue)) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.contentWizardPanel.saveChanges().catch((error: any) => {
                        DefaultErrorHandler.handle(error);
                    });
                }
                if (event.getPropertyName() === PageModel.PROPERTY_TEMPLATE) {

                    // do not reload page if there was no template in pageModel before and if new template is the default one -
                    // case when switching automatic template to default
                    // only reload when switching from customized with controller set back to template or automatic template
                    if (!(this.pageModel.getDefaultPageTemplate().equals(this.pageModel.getTemplate()) && !oldValue &&
                          !this.pageModel.hasController())) {
                        this.pageInspectionPanel.refreshInspectionHandler();
                        this.lockPageAfterProxyLoad = true;
                        this.contentWizardPanel.setMarkedAsReady(false);
                        this.contentWizardPanel.saveChanges().catch((error: any) => {
                            DefaultErrorHandler.handle(error);
                        });
                    }
                }
            }
        };
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
                this.saveAsTemplateAction?.setContentSummary(summaryAndStatuses[0].getContentSummary());

                if (this.placeholder && !this.placeholder.hasSelectedController()) {
                    this.placeholder.loadControllers();
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
            .then((contentSummary: ContentSummaryAndCompareStatus) => this.saveAsTemplateAction.setContentSummary(
                contentSummary.getContentSummary()))
            .catch(DefaultErrorHandler.handle);
    }


    private addPageProxyLoadEventListeners(): void {
        this.liveEditPageProxy.onLoaded(() => {
            this.hideLoadMaskHandler();
            this.pageLoading = false;

            if (this.lockPageAfterProxyLoad) {
                this.pageView.setLocked(true);
                this.lockPageAfterProxyLoad = false;
            }

            this.imageInspectionPanel.refresh();
        });

        if (BrowserHelper.isIE()) { // have to cleanup objects loaded by current live edit frame so IE won't fail after frame reload
            this.liveEditPageProxy.onBeforeLoad(() => {
                this.fragmentInspectionPanel.cleanUp();
                this.imageInspectionPanel.cleanUp();
                this.partInspectionPanel.cleanUp();
                this.layoutInspectionPanel.cleanUp();
            });
        }
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
            saveAsTemplateAction: this.saveAsTemplateAction
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

                    this.saveAndReloadOnlyComponent(<ComponentView<Component>>itemView, true);
                    return;
                }
            }

            this.contentWizardPanel.saveChanges().catch((error: any) => {
                DefaultErrorHandler.handle(error);
            });
        });

        this.contentInspectionPanel = new ContentInspectionPanel();

        this.pageInspectionPanel = new PageInspectionPanel(this.saveAsTemplateAction);
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
                .setCustomized(true)
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
        this.pageModel?.unPropertyChanged(this.propertyChangedHandler);
        this.pageModel?.unComponentPropertyChangedEvent(this.componentPropertyChangedHandler);
        this.liveEditModel?.getSiteModel()?.unApplicationRemoved(this.applicationRemovedHandler);

        this.liveEditModel = liveEditModel;
        this.content = liveEditModel.getContent();
        this.insertablesPanel.setContent(this.content);
        this.pageModel = liveEditModel.getPageModel();
        this.pageModel.setIgnorePropertyChanges(true);

        const site: Site = this.content.isSite()
                           ? <Site>this.content
                           : liveEditModel.getSiteModel()
                             ? this.liveEditModel.getSiteModel().getSite()
                             : null;

        this.saveAsTemplateAction
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
        this.pageModel.onPropertyChanged(this.propertyChangedHandler);
        this.pageModel.onComponentPropertyChangedEvent(this.componentPropertyChangedHandler);
        this.liveEditModel.getSiteModel().onApplicationRemoved(this.applicationRemovedHandler);

        this.handleContentUpdatedEvent();
    }

    private handleContentUpdatedEvent() {
        if (!this.contentEventListener) {
            this.contentEventListener = (event) => {
                this.propagateEvent(event);
            };

            ContentDeletedEvent.on(this.contentEventListener);
            ContentUpdatedEvent.on(this.contentEventListener);

            this.onRemoved(() => {
                ContentDeletedEvent.un(this.contentEventListener);
                ContentUpdatedEvent.un(this.contentEventListener);
            });
        }
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

        this.insertablesPanel.getComponentsView().addClass('loading');
        this.liveEditPageProxy.onLoaded(() => {
            this.insertablesPanel.getComponentsView().removeClass('loading');
        });

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
                this.liveEditPageProxy.unLoaded(clearInspectionFn);
            };
            this.liveEditPageProxy.onLoaded(clearInspectionFn);
        }
    }

    private saveAndReloadOnlyComponent(componentView: ComponentView<Component>, avoidInspectComponentRefresh?: boolean) {
        assertNotNull(componentView, 'componentView cannot be null');
        this.pageSkipReload = true;

        const componentUrl: string = UriHelper.getComponentUri(this.content.getContentId().toString(),
            componentView.getComponentPath(),
            RenderingMode.EDIT);

        this.contentWizardPanel.saveChangesWithoutValidation(false).then(() => {
            this.pageSkipReload = false;
            componentView.showLoadingSpinner();
            return this.liveEditPageProxy.loadComponent(componentView, componentUrl, avoidInspectComponentRefresh);
        }).catch((error: any) => {
            DefaultErrorHandler.handle(error);

            componentView.hideLoadingSpinner();
            componentView.showRenderingError(componentUrl, error.message);
        }).done();
    }

    private addPageProxyEventListeners() {
        this.liveEditPageProxy.onPageLocked(() => {
            this.inspectPage(false);
        });

        let path;
        let isComponentView: boolean = false;
        let textEditorCursorPos: HtmlEditorCursorPosition;

        BeforeContentSavedEvent.on(() => {
            path = null;
            textEditorCursorPos = null;

            if (!this.pageView) {
                return;
            }
            const selected: ItemView = this.pageView.getSelectedView();

            if (ObjectHelper.iFrameSafeInstanceOf(selected, ComponentView)) {
                path = (<ComponentView<any>>selected).getComponentPath();
                isComponentView = true;

                if (this.pageView.isTextEditMode() && ObjectHelper.iFrameSafeInstanceOf(selected, TextComponentView)) {
                    textEditorCursorPos = (<TextComponentView>selected).getCursorPosition();
                }
            } else if (ObjectHelper.iFrameSafeInstanceOf(selected, RegionView)) {
                path = (<RegionView>selected).getRegionPath();
            }

            if (path && BrowserHelper.isIE()) {
                path = path.toString();
            }
        });

        const restoreSelection = () => {
            if (path) {
                if (BrowserHelper.isIE()) {
                    path = isComponentView ? ComponentPath.fromString(path) : RegionPath.fromString(path);
                }
                const selected: ComponentView<Component> | RegionView = ObjectHelper.iFrameSafeInstanceOf(path, ComponentPath)
                                                                        ? this.pageView.getComponentViewByPath(path)
                                                                        : this.pageView.getRegionViewByPath(path);
                if (selected) {
                    selected.selectWithoutMenu(true);
                    selected.scrollComponentIntoView();

                    if (textEditorCursorPos && ObjectHelper.iFrameSafeInstanceOf(selected, TextComponentView)) {
                        this.setCursorPositionInTextComponent(<TextComponentView>selected, textEditorCursorPos);
                        textEditorCursorPos = null;
                    }
                }
            }
        };

        this.liveEditPageProxy.onLiveEditPageViewReady((event: LiveEditPageViewReadyEvent) => {
            this.pageView = event.getPageView();

            // disable insert tab if there is no page for some reason (i.e. error occurred)
            // or there is no controller or template set
            const pageModelRenderable = this.pageModel?.isRenderable();
            this.contextWindow.setItemVisible(this.insertablesPanel, !!this.pageView && pageModelRenderable);

            if (this.pageView) {
                this.insertablesPanel.setPageView(this.pageView);
                this.pageView.getContextMenuActions().push(this.saveAsTemplateAction);
                restoreSelection();

                this.notifyPageViewReady(this.pageView);
            } else {
                this.setErrorRenderingFailed();
            }
        });

        this.liveEditPageProxy.onPageSelected((event: PageSelectedEvent) => {
            this.inspectPage(!event.isRightClicked());
        });

        this.liveEditPageProxy.onRegionSelected((event: RegionSelectedEvent) => {
            this.inspectRegion(event.getRegionView(), !event.isRightClicked());
        });

        this.liveEditPageProxy.onItemViewSelected((event: ItemViewSelectedEvent) => {
            const itemView = event.getItemView();
            const defaultClicked = !event.isRightClicked();
            const newSelection = !event.isRestoredSelection();

            if (event.shouldAvoidInspectComponentRefresh()) {
                return;
            }

            itemView.scrollComponentIntoView();
            if (ObjectHelper.iFrameSafeInstanceOf(itemView, ComponentView)) {
                this.inspectComponent(<ComponentView<Component>>itemView, newSelection,
                    newSelection && defaultClicked && !this.pageView.isTextEditMode());

                if (textEditorCursorPos && this.pageView.isTextEditMode() &&
                    ObjectHelper.iFrameSafeInstanceOf(itemView, TextComponentView)) {
                    this.setCursorPositionInTextComponent(<TextComponentView>itemView, textEditorCursorPos);
                    textEditorCursorPos = null;
                }
            } else {
                this.inspectionsPanel.updateButtonsVisibility();
            }
        });

        this.liveEditPageProxy.onItemViewDeselected((event: ItemViewDeselectedEvent) => {
            this.clearSelection();
        });

        this.liveEditPageProxy.onComponentRemoved((event: ComponentRemovedEvent) => {

            if (!this.pageModel.isPageTemplate() && this.pageModel.getMode() === PageMode.AUTOMATIC) {
                this.pageModel.initializePageFromDefault(this);
            }

            this.clearSelection();
        });

        this.liveEditPageProxy.onComponentViewDragDropped((event: ComponentViewDragDroppedEvent) => {

            let componentView = event.getComponentView();
            if (!componentView.isEmpty()) {
                this.inspectComponent(componentView);
            }
        });

        this.liveEditPageProxy.onComponentDuplicated((event: ComponentDuplicatedEvent) => {
            this.contentWizardPanel.setMarkedAsReady(false);
            this.saveAndReloadOnlyComponent(event.getDuplicatedComponentView());
        });

        this.liveEditPageProxy.onComponentInspected((event: ComponentInspectedEvent) => {
            let componentView = event.getComponentView();
            this.inspectComponent(componentView);
        });

        this.liveEditPageProxy.onPageInspected((event: PageInspectedEvent) => {
            this.inspectPage(true);
        });

        this.liveEditPageProxy.onComponentFragmentCreated((event: ComponentFragmentCreatedEvent) => {
            let fragmentView: FragmentComponentView = event.getComponentView();
            let componentType = event.getSourceComponentType().getShortName();
            let componentName = fragmentView.getComponent().getName().toString();
            showSuccess(i18n('notify.fragment.created', componentName, componentType));

            this.saveMarkedContentAndReloadOnlyComponent(event.getComponentView());

            let summaryAndStatus = ContentSummaryAndCompareStatus.fromContentSummary(event.getFragmentContent());
            new EditContentEvent([summaryAndStatus]).fire();
        });

        this.liveEditPageProxy.onComponentDetached((event: ComponentDetachedFromFragmentEvent) => {
            showSuccess(i18n('notify.component.detached', event.getComponentView().getName()));

            this.saveMarkedContentAndReloadOnlyComponent(event.getComponentView());
        });

        this.liveEditPageProxy.onFragmentReloadRequired((event: FragmentComponentReloadRequiredEvent) => {
            let fragmentView = event.getFragmentComponentView();

            let componentUrl = UriHelper.getComponentUri(this.content.getContentId().toString(), fragmentView.getComponentPath(),
                RenderingMode.EDIT);

            fragmentView.showLoadingSpinner();
            this.liveEditPageProxy.loadComponent(fragmentView, componentUrl).catch((errorMessage: any) => {
                DefaultErrorHandler.handle(errorMessage);

                fragmentView.hideLoadingSpinner();
                fragmentView.showRenderingError(componentUrl, errorMessage);
            });
        });

        this.liveEditPageProxy.onShowWarning((event: ShowWarningLiveEditEvent) => {
            showWarning(event.getMessage());
        });

        this.liveEditPageProxy.onEditContent((event: EditContentEvent) => {
            new EditContentEvent(event.getModels()).fire();
        });

        this.liveEditPageProxy.onLiveEditPageInitializationError((event: LiveEditPageInitializationErrorEvent) => {
            showError(event.getMessage(), false);
            new ShowContentFormEvent().fire();
            this.contentWizardPanel.showForm();
        });

        this.liveEditPageProxy.onLiveEditPageDialogCreate((event: CreateHtmlAreaDialogEvent) => {
            const modalDialog: ModalDialog = HTMLAreaDialogHandler.createAndOpenDialog(event);
            this.liveEditPageProxy.notifyLiveEditPageDialogCreated(modalDialog, event.getConfig());
        });
    }

    private setCursorPositionInTextComponent(textComponentView: TextComponentView, cursorPosition: HtmlEditorCursorPosition): void {
        this.pageView.appendContainerForTextToolbar();
        textComponentView.startPageTextEditMode();
        $(textComponentView.getHTMLElement()).simulate('click');

        textComponentView.onEditorReady(() =>
            setTimeout(() => textComponentView.setCursorPosition(cursorPosition), 100)
        );
    }

    private saveMarkedContentAndReloadOnlyComponent(componentView: ComponentView<Component>) {
        const componentPath = componentView.getComponentPath();
        const canMarkContentAsReady = this.canMarkContentAsReady(componentPath);
        this.contentWizardPanel.setMarkedAsReady(canMarkContentAsReady);
        this.saveAndReloadOnlyComponent(componentView);
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

        const component = viewedPage.findComponentByPath(componentPath);
        const originalComponent = serverPage.findComponentByPath(componentPath);

        if (component) {
            component.remove();
        }
        if (originalComponent) {
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

    clearPageViewSelectionAndOpenInspectPage(showPanel: boolean) {
        if (this.pageView && this.pageView.hasSelectedView()) {
            this.pageView.getSelectedView().deselect();
        }
        this.inspectPage(showPanel);
    }

    private inspectRegion(regionView: RegionView, showPanel: boolean) {

        let region = regionView.getRegion();

        this.regionInspectionPanel.setRegion(region);
        this.contextWindow.showInspectionPanel(
            getInspectParameters({
                panel: this.regionInspectionPanel,
                showWidget: true,
                showPanel
            })
        );
    }

    private doInspectComponent(componentView: ComponentView<Component>, showWidget: boolean, showPanel: boolean) {
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
        if (ObjectHelper.iFrameSafeInstanceOf(componentView, ImageComponentView)) {
            showInspectionPanel(this.imageInspectionPanel);
            this.imageInspectionPanel.setImageComponentView(<ImageComponentView>componentView);
            this.imageInspectionPanel.setImageComponent(<ImageComponent>componentView.getComponent());
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentView, PartComponentView)) {
            showInspectionPanel(this.partInspectionPanel);
            this.partInspectionPanel.setDescriptorBasedComponent(<PartComponent>componentView.getComponent());
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentView, LayoutComponentView)) {
            showInspectionPanel(this.layoutInspectionPanel);
            this.layoutInspectionPanel.setDescriptorBasedComponent(<LayoutComponent>componentView.getComponent());
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentView, TextComponentView)) {
            showInspectionPanel(this.textInspectionPanel);
            this.textInspectionPanel.setTextComponent(<TextComponentView>componentView);
            this.inspectionsPanel.setButtonContainerVisible(this.pageView?.getPageViewController().isTextEditMode());
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentView, FragmentComponentView)) {
            showInspectionPanel(this.fragmentInspectionPanel);
            this.fragmentInspectionPanel.setFragmentComponentView(<FragmentComponentView>componentView);
            this.fragmentInspectionPanel.setFragmentComponent(<FragmentComponent>componentView.getComponent());
        } else {
            throw new Error('ComponentView cannot be selected: ' + ClassHelper.getClassName(componentView));
        }
    }

    private inspectComponent(componentView: ComponentView<Component>, showWidget: boolean = true, showPanel: boolean = true) {
        assertNotNull(componentView, 'componentView cannot be null');

        const waitForContextPanel = showPanel && ContextSplitPanel.isCollapsed();

        if (waitForContextPanel) {
            // Wait until ContextPanel is expanded before activating the InspectPanel inside
            const stateChangeHandler = (event: ContextPanelStateEvent) => {
                if (ContextSplitPanel.isExpanded()) {
                    setTimeout(() => {
                        this.doInspectComponent(componentView, showWidget, showPanel);
                    }, 500);
                }
                ContextPanelStateEvent.un(stateChangeHandler);
            };
            ContextPanelStateEvent.on(stateChangeHandler);
        }

        if (this.isPanelSelectable(componentView)) {
            new InspectEvent(showWidget, showPanel).fire();
        }

        if (waitForContextPanel) {
            return;
        }

        this.doInspectComponent(componentView, showWidget, showPanel);
    }

    private isPanelSelectable(componentView: ComponentView<Component>): boolean {
        return !ObjectHelper.iFrameSafeInstanceOf(componentView, PageView) || this.getPageMode() !== PageMode.FRAGMENT;
    }

    isShown(): boolean {
        return !ObjectHelper.stringEquals(this.getHTMLElement().style.display, 'none');
    }

    onPageViewReady(listener: (pageView: PageView) => void) {
        this.pageViewReadyListeners.push(listener);
    }

    unPageViewReady(listener: (pageView: PageView) => void) {
        this.pageViewReadyListeners = this.pageViewReadyListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyPageViewReady(pageView: PageView) {
        this.pageViewReadyListeners.forEach(listener => {
            listener(pageView);
        });
    }

    setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;
        this.insertablesPanel?.setModifyPermissions(modifyPermissions);
        this.liveEditPageProxy?.setModifyPermissions(modifyPermissions);
        this.placeholder?.setEnabled(modifyPermissions);
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
            this.placeholder.loadControllers();
        } else {
            this.createLiveEditPagePlaceholder();
            this.placeholder.loadControllers();
        }

        ContentDeletedEvent.un(this.contentEventListener);
        ContentUpdatedEvent.un(this.contentEventListener);
    }

    setPageIsNotRenderable(): void {
        if (!this.placeholder) {
            this.createLiveEditPagePlaceholder();
        }

        this.placeholder.setPageIsNotRenderable();
    }

    isRenderable(): boolean {
        return this.contentWizardPanel.isRenderable();
    }

    getContextWindow(): ContextWindow {
        return this.contextWindow;
    }
}
