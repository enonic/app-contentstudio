import {Component} from '../../page/region/Component';
import {type ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentDescriptorUpdatedEvent} from '../../page/region/ComponentDescriptorUpdatedEvent';
import {ComponentDetachedEvent} from '../../page/region/ComponentDetachedEvent';
import {ComponentDuplicatedEvent} from '../../page/region/ComponentDuplicatedEvent';
import {ComponentFragmentCreatedEvent} from '../../page/region/ComponentFragmentCreatedEvent';
import {ComponentFragmentUpdatedEvent} from '../../page/region/ComponentFragmentUpdatedEvent';
import {ComponentImageUpdatedEvent} from '../../page/region/ComponentImageUpdatedEvent';
import {type ComponentPath} from '../../page/region/ComponentPath';
import {ComponentTextUpdatedEvent} from '../../page/region/ComponentTextUpdatedEvent';
import {type ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {type Content, type ContentBuilder} from '../../content/Content';
import {type ContentId} from '../../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {type ContentType} from '../../inputtype/schema/ContentType';
import {type CreateHtmlAreaDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {Descriptor} from '../../page/Descriptor';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {EditContentEvent} from '../../event/EditContentEvent';
import {FragmentComponentType} from '../../page/region/FragmentComponentType';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import {LayoutComponentType} from '../../page/region/LayoutComponentType';
import {Page} from '../../page/Page';
import {PageEventsManager} from '../PageEventsManager';
import {PageHelper} from '../../util/PageHelper';
import {type PageItem} from '../../page/region/PageItem';
import {type PageItemType} from '../../page/region/PageItemType';
import {type PageNavigationEvent} from '../PageNavigationEvent';
import {PageNavigationEventData, type PageNavigationEventSource} from '../PageNavigationEventData';
import {PageNavigationEventType} from '../PageNavigationEventType';
import {type PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {PageState} from './PageState';
import {PartComponent} from '../../page/region/PartComponent';
import {PartComponentType} from '../../page/region/PartComponentType';
import {Region} from '../../page/region/Region';
import {type Site} from '../../content/Site';
import {TextComponent} from '../../page/region/TextComponent';
import {TextComponentType} from '../../page/region/TextComponentType';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {type Mask} from '@enonic/lib-admin-ui/ui/mask/Mask';
import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import type Q from 'q';
import {ContentServerEventsHandler} from '../../event/ContentServerEventsHandler';
import {InspectEvent} from '../../event/InspectEvent';
import {HTMLAreaProxy} from '../../inputtype/ui/text/dialog/HTMLAreaProxy';
import {type ModalDialog} from '../../inputtype/ui/text/dialog/ModalDialog';
import {RenderingMode} from '../../rendering/RenderingMode';
import {UriHelper} from '../../rendering/UriHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContextPanelState} from '../../view/context/ContextPanelState';
import {ContextPanelMode} from '../../view/context/ContextSplitPanel';
import {type PreviewWidgetDropdown} from '../../view/toolbar/PreviewWidgetDropdown';
import {type WidgetRenderer} from '../../view/WidgetRenderingHandler';
import {SaveAsTemplateAction} from '../action/SaveAsTemplateAction';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {WizardWidgetRenderingHandler} from '../WizardWidgetRenderingHandler';
import {ContextWindow, type ContextWindowConfig, getInspectParameters} from './contextwindow/ContextWindow';
import {InsertablesPanel} from './contextwindow/insert/InsertablesPanel';
import {type BaseInspectionPanel} from './contextwindow/inspect/BaseInspectionPanel';
import {InspectionsPanel} from './contextwindow/inspect/InspectionsPanel';
import {PageInspectionPanel} from './contextwindow/inspect/page/PageInspectionPanel';
import {ComponentInspectionPanel} from './contextwindow/inspect/region/ComponentInspectionPanel';
import {DescriptorBasedComponentInspectionPanel} from './contextwindow/inspect/region/DescriptorBasedComponentInspectionPanel';
import {FragmentInspectionPanel} from './contextwindow/inspect/region/FragmentInspectionPanel';
import {LayoutInspectionPanel} from './contextwindow/inspect/region/LayoutInspectionPanel';
import {PartInspectionPanel} from './contextwindow/inspect/region/PartInspectionPanel';
import {RegionInspectionPanel} from './contextwindow/inspect/region/RegionInspectionPanel';
import {TextInspectionPanel} from './contextwindow/inspect/region/TextInspectionPanel';
import {FrameContainer} from './FrameContainer';
import {type LiveEditPageProxy} from './LiveEditPageProxy';
import {type LiveEditModel} from '../../../page-editor/LiveEditModel';
import {type ShowWarningLiveEditEvent} from '../../../page-editor/event/ShowWarningLiveEditEvent';
import {type LiveEditPageInitializationErrorEvent} from '../../../page-editor/event/LiveEditPageInitializationErrorEvent';

export interface LiveFormPanelConfig {

    contentType: ContentType;

    contentWizardPanel: ContentWizardPanel;

    liveEditPage: LiveEditPageProxy;

    liveEditModel: LiveEditModel;
}

export interface InspectPageParams {
    showPanel: boolean,
    showWidget: boolean,
    keepPanelSelection?: boolean,
    source?: PageNavigationEventSource,
}

export class LiveFormPanel
    extends Panel
    implements PageNavigationHandler, WidgetRenderer {

    public static debug: boolean = false;

    private content: Content;

    private liveEditModel?: LiveEditModel;

    private pageLoading: boolean = false;

    private pageSkipReload: boolean = false;

    private frameContainer?: FrameContainer;

    private lockPageAfterProxyLoad: boolean = false;

    private modifyPermissions: boolean;

    private contextWindow: ContextWindow;

    private isTextModeOn: boolean;

    private contextPanelMode: ContextPanelMode;

    private contextPanelState: ContextPanelState;

    private componentToInspectOnContextPanelExpand: Component;

    private insertablesPanel?: InsertablesPanel;
    private inspectionsPanel: InspectionsPanel;
    private defaultPanelToShow: BaseInspectionPanel;
    private availableInspectPanels: Map<PageItemType, BaseInspectionPanel> = new Map<PageItemType, BaseInspectionPanel>();
    private contentWizardPanel: ContentWizardPanel;

    private liveEditPageProxy?: LiveEditPageProxy;

    private lastInspectedItemPath: ComponentPath;

    private saveAction: Action;

    private contextPanelToggleHandler?: () => void;

    private widgetRenderingHandler: WizardWidgetRenderingHandler;

    private showLoadMaskHandler: () => void;
    private hideLoadMaskHandler: () => void;
    private contentUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;
    private contentPermissionsUpdatedHandler: (data: ContentSummaryAndCompareStatus[]) => void;

    constructor(config: LiveFormPanelConfig) {
        super('live-form-panel widget-preview-panel');

        this.contentWizardPanel = config.contentWizardPanel;
        this.liveEditPageProxy = config.liveEditPage;
        this.content = config.liveEditModel.getContent();

        this.widgetRenderingHandler = new WizardWidgetRenderingHandler(this);

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();
        this.initEventHandlers();

        this.setModel(config.liveEditModel);
    }

    getIFrameEl(): IFrameEl {
        return this.liveEditPageProxy.getIFrame();
    }

    getChildrenContainer(): DivEl {
        return this.getFrameContainer().getWrapper();
    }

    getPreviewAction(): Action {
        return this.contentWizardPanel.getWizardActions().getPreviewAction();
    }

    getMask(): Mask {
        return this.contentWizardPanel.getLiveMask();
    }

    getWidgetSelector(): PreviewWidgetDropdown {
        return this.frameContainer.getWidgetSelector()
    }

    protected initElements(): void {

        this.frameContainer = new FrameContainer({
            proxy: this.liveEditPageProxy,
            wizardActions: this.contentWizardPanel.getWizardActions()
        });

        this.liveEditPageProxy.setModifyPermissions(this.modifyPermissions);
        this.contextWindow = this.createContextWindow();

        this.addPageProxyLoadEventListeners();
        this.addPageProxyEventListeners();
    }

    hasControllers(): Q.Promise<boolean> {
        return this.widgetRenderingHandler.hasControllers();
    }

    isRenderable(): Q.Promise<boolean> {
        return this.widgetRenderingHandler.isItemRenderable();
    }

    protected initEventHandlers() {
        this.initMaskHandlers();
        this.initPropertyChangedHandlers();
        this.initContentUpdatedHandler();

        ShowLiveEditEvent.on(this.showLoadMaskHandler);
        ShowContentFormEvent.on(this.hideLoadMaskHandler);
        ContentServerEventsHandler.getInstance().onContentUpdated(this.contentUpdatedHandler);
        ContentServerEventsHandler.getInstance().onContentPermissionsUpdated(this.contentPermissionsUpdatedHandler);

        // showing apply button for page, part and layout with form items
        const formLayoutHandler = (panel: BaseInspectionPanel) => {
            if (panel !== this.inspectionsPanel.getPanelShown()) {
                return;
            }

            if (panel instanceof DescriptorBasedComponentInspectionPanel) {
                this.updateButtonsVisibility(panel.getSelectedValue());
            } else if (panel instanceof PageInspectionPanel) {
                const selectedValue = panel.getSelectedValue()?.getData();
                this.updateButtonsVisibility(selectedValue instanceof Descriptor ? selectedValue : null);
            }
        }

        this.availableInspectPanels.forEach((panel) => {
            panel.onLayoutListener(formLayoutHandler);
        });
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
                    this.saveAndLoadComponent(event.getPath());
                } else {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            } else if (event instanceof ComponentImageUpdatedEvent) {
                if (event.getImageId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndLoadComponent(event.getPath());
                } else {
                    this.liveEditPageProxy.resetComponent(event.getPath());
                }
            } else if (event instanceof ComponentFragmentUpdatedEvent) {
                if (event.getFragmentId()) {
                    this.contentWizardPanel.setMarkedAsReady(false);
                    this.saveAndLoadComponent(event.getPath());
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
                this.saveAndLoadComponent(event.getPath());
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
            const isCreateEvent = fragment.getContentSummary().getModifiedTime().getTime() -
                                  fragment.getContentSummary().getCreatedTime().getTime() < 500;
            if (!isCreateEvent) {
                this.loadComponent(fragmentComponent.getPath());
            }
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
        });
    }

    private createContextWindow(): ContextWindow {
        this.saveAction = this.initSaveAction();
        this.initAvailablePanels();

        this.inspectionsPanel = new InspectionsPanel({
            inspectionPanels: Array.from(this.availableInspectPanels.values()),
            defaultPanelToShow: this.defaultPanelToShow,
            saveAction: this.saveAction
        });

        this.insertablesPanel = this.isNotPartOrTextFragment() ? new InsertablesPanel({
            liveEditPage: this.liveEditPageProxy,
            contentWizardPanel: this.contentWizardPanel,
            saveAsTemplateAction: SaveAsTemplateAction.get()
        }) : null;

        this.insertablesPanel?.setModifyPermissions(this.modifyPermissions);

        return new ContextWindow({
            liveFormPanel: this,
            inspectionPanel: this.inspectionsPanel,
            insertablesPanel: this.insertablesPanel
        } as ContextWindowConfig);
    }

    private initAvailablePanels(): void {
        if (this.content.getPage()?.isFragment()) {
            this.initPanelsForFragment();
        } else {
            this.initPagePanels();
        }
    }

    private initPanelsForFragment(): void {
        // fragment content doesn't have a top level page inspection panel, we can't change tempate or controller etc.
        const fragment = this.content.getPage().getFragment();

        if (fragment instanceof TextComponent) {
            this.initTextComponentFragmentPanels();
        } else if (fragment instanceof PartComponent) {
            this.initPartComponentFragmentPanels();
        } else if (fragment instanceof LayoutComponent) {
            this.initLayoutComponentFragmentPanels();
        } else {
            console.warn('Fragment type not supported for inspection: ' + fragment.getType().getShortName());
        }
    }

    private initTextComponentFragmentPanels(): void {
        // text fragment doesn't have any other components except itself
        const textInspectionPanel = new TextInspectionPanel();
        this.availableInspectPanels.set(TextComponentType.get(), textInspectionPanel);
        this.defaultPanelToShow = textInspectionPanel;
    }

    private initPartComponentFragmentPanels(): void {
        // part fragment doesn't have any other components except itself
        const partInspectionPanel = new PartInspectionPanel();
        this.availableInspectPanels.set(PartComponentType.get(), partInspectionPanel);
        this.defaultPanelToShow = partInspectionPanel;
    }

    private initLayoutComponentFragmentPanels(): void {
        // layout fragment might have any components to inspect, except top level page
        const layoutInspectionPanel = new LayoutInspectionPanel();
        this.availableInspectPanels.set(LayoutComponentType.get(), layoutInspectionPanel);
        this.availableInspectPanels.set(PartComponentType.get(), new PartInspectionPanel());
        this.availableInspectPanels.set(FragmentComponentType.get(), new FragmentInspectionPanel());
        this.availableInspectPanels.set(TextComponentType.get(), new TextInspectionPanel());
        this.availableInspectPanels.set('region', new RegionInspectionPanel());
        this.defaultPanelToShow = layoutInspectionPanel;
    }

    private initPagePanels(): void {
        const pageInspectionPanel = new PageInspectionPanel();

        this.availableInspectPanels.set('page', pageInspectionPanel);
        this.availableInspectPanels.set(LayoutComponentType.get(), new LayoutInspectionPanel());
        this.availableInspectPanels.set(PartComponentType.get(), new PartInspectionPanel());
        this.availableInspectPanels.set(FragmentComponentType.get(), new FragmentInspectionPanel());
        this.availableInspectPanels.set(TextComponentType.get(), new TextInspectionPanel());
        this.availableInspectPanels.set('region', new RegionInspectionPanel());
        this.defaultPanelToShow = pageInspectionPanel;
    }

    private initSaveAction(): Action {
        const saveAction = new Action(i18n('action.apply')).setEnabled(false);

        saveAction.onExecuted(() => {
            const selectedItem = this.lastInspectedItemPath ? PageState.getComponentByPath(this.lastInspectedItemPath) : null;

            if (selectedItem instanceof DescriptorBasedComponent) {
                this.contentWizardPanel.setMarkedAsReady(false);
                this.saveAndReloadExistingComponent(selectedItem.getPath())
                    .then(() => this.saveAction.setEnabled(false))
                    .catch(DefaultErrorHandler.handle); // save config, reload component view, keep inspect panel
                return;
            }

            if (selectedItem instanceof Component) {
                this.contentWizardPanel.setMarkedAsReady(false);
                this.saveAndLoadComponent(selectedItem.getPath())
                    .then(() => this.saveAction.setEnabled(false))
                    .catch(DefaultErrorHandler.handle);
                return;
            }

            this.contentWizardPanel.saveChanges().then(() => this.saveAction.setEnabled(false)).catch(DefaultErrorHandler.handle);
        });

        return saveAction;
    }

    private saveAndReloadExistingComponent(path: ComponentPath): Q.Promise<void> {
        this.pageSkipReload = true;

        return this.contentWizardPanel.saveChangesWithoutValidation(false).then(() => {
            this.pageSkipReload = false;
            this.reloadExistingComponent(path);
        });
    }

    private isNotPartOrTextFragment(): boolean {
        return !this.content.getPage()?.getFragment() || this.content.getPage().getFragment() instanceof LayoutComponent;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {

            this.appendChild(this.frameContainer);
            // we handle widget event manually in LiveEditPageProxy
            this.widgetRenderingHandler.layout();

            WindowDOM.get().onBeforeUnload((event) => {
                // the reload is triggered by the main frame,
                // so let the live edit know it to skip the popup
                this.liveEditPageProxy?.skipNextReloadConfirmation(true);
            });

            return rendered;
        });
    }


    remove(): LiveFormPanel {
        ShowLiveEditEvent.un(this.showLoadMaskHandler);
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
        this.availableInspectPanels.forEach((panel) => panel.setModel(liveEditModel));
    }

    public getModel(): LiveEditModel {
        return this.liveEditModel;
    }


    skipNextReloadConfirmation(skip: boolean) {
        this.liveEditPageProxy?.skipNextReloadConfirmation(skip);
    }

    onRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.widgetRenderingHandler.onRenderableChanged(listener);
    }

    unRenderableChanged(listener: (isRenderable: boolean, wasRenderable: boolean) => void) {
        this.widgetRenderingHandler.unRenderableChanged(listener);
    }

    loadPage(clearInspection: boolean = true): Promise<boolean> {
        if (LiveFormPanel.debug) {
            console.debug('LiveFormPanel.loadPage at ' + new Date().toISOString());
        }

        if (this.pageSkipReload) {
            return Promise.resolve(false);
        }

        if (clearInspection) {
            this.clearSelectionAndInspect(false, true);
        }

        this.pageLoading = true;

        return this.liveEditPageProxy.load(this.widgetRenderingHandler, this.getWidgetSelector().getSelectedWidget())
            .then((loaded) => {
                if (!loaded) {
                    // no widget was able to render it so there will be no page loaded eventt
                    this.pageLoading = false;
                }

                if (clearInspection) {
                    const clearInspectionFn = () => {
                        this.contextWindow.clearSelection();
                        PageEventsManager.get().unLoaded(clearInspectionFn);
                    };
                    PageEventsManager.get().onLoaded(clearInspectionFn);
                }

                return loaded;
            });
    }

    private saveAndLoadComponent(path: ComponentPath): Q.Promise<void> {
        assertNotNull(path, 'component path cannot be null');
        this.pageSkipReload = true;

        return this.contentWizardPanel.saveChangesWithoutValidation(false).then((content: Content) => {
            this.pageSkipReload = false;
            this.loadComponent(path);
        });
    }

    private loadComponent(path: ComponentPath): void {
        const componentUrl: string = UriHelper.getComponentUri(this.content.getContentId().toString(),
            path,
            RenderingMode.EDIT);
        this.liveEditPageProxy.loadComponent(path, componentUrl);
    }

    private reloadExistingComponent(path: ComponentPath): void {
        const componentUrl: string = UriHelper.getComponentUri(this.content.getContentId().toString(),
            path,
            RenderingMode.EDIT);
        this.liveEditPageProxy.loadComponent(path, componentUrl, true);
    }

    private addPageProxyEventListeners() {
        const eventsManager = PageEventsManager.get();

        eventsManager.onPageLocked(() => {
            this.inspectPage({showPanel: false, showWidget: true});
        });

        eventsManager.onLiveEditPageViewReady(() => {
            if (this.content.getPage()?.isFragment()) { // preselection selector's value to make it not empty
                const component = PageState.getState().getFragment();
                const inspectionPanel = this.availableInspectPanels.get(component.getType());

                if (inspectionPanel instanceof ComponentInspectionPanel) {
                    inspectionPanel.setComponent(component);
                }
            }
        });


        eventsManager.onPageSaveAsTemplate(() => {
            SaveAsTemplateAction.get().execute();
        });

        eventsManager.onComponentDragDropped((from: ComponentPath, to: ComponentPath) => {
            this.inspectPageItemByPath(new PageNavigationEventData(to));
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
            const modalDialog: ModalDialog = HTMLAreaProxy.createAndOpenDialog(event);
            eventsManager.notifyDialogCreated(modalDialog, event.getConfig());
        });

        eventsManager.onTextComponentEditModeChanged((value: boolean) => {
            this.isTextModeOn = value;

            if (value && this.isContextPanelExpanded() && !this.isContextPanelDocked()) {
                this.contextPanelToggleHandler?.();
            }
        });
    }

    private saveMarkedContentAndReloadOnlyComponent(path: ComponentPath) {
        const canMarkContentAsReady = this.canMarkContentAsReady();
        this.contentWizardPanel.setMarkedAsReady(canMarkContentAsReady);
        this.saveAndLoadComponent(path);
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

    private inspectPage(params: InspectPageParams): void {
        const pagePanel = this.availableInspectPanels.get('page') as PageInspectionPanel;
        this.contextWindow?.showInspectionPanel(
            getInspectParameters({
                panel: pagePanel,
                showWidget: params.showWidget,
                showPanel: params.showPanel,
                source: params.source,
                keepPanelSelection: params.keepPanelSelection
            })
        );

        const val = pagePanel?.getSelectedValue()?.getData();
        if (val instanceof Descriptor) {
            this.updateButtonsVisibility(val);
        }
    }

    private clearSelection(showInsertables: boolean = true): boolean {
        const customizedWithController = !this.content.getPage() && PageState.getState()?.hasController();
        const isFragmentContent = PageState.getState()?.isFragment();

        if (this.liveEditModel?.getDefaultModels()?.hasDefaultPageTemplate() || customizedWithController || isFragmentContent) {
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
        const regionInspectionPanel = this.availableInspectPanels.get('region') as RegionInspectionPanel;
        regionInspectionPanel?.setRegion(region);

        this.contextWindow.showInspectionPanel(
            getInspectParameters({
                panel: regionInspectionPanel,
                showWidget: true,
                showPanel: true,
                source: source,
            })
        );

        this.inspectionsPanel.setButtonContainerVisible(false);
    }

    private doInspectComponent(component: Component, showPanel: boolean, focus?: boolean): void {
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

        const inspectionPanel = this.availableInspectPanels.get(component.getType());

        if (inspectionPanel instanceof ComponentInspectionPanel) {
            showInspectionPanel(inspectionPanel);
            if (focus) {
                setTimeout(() => inspectionPanel.focus(), 200);
            }
            inspectionPanel.setComponent(component);

            // show apply for text comp, page, part and layout will handle it themselves when selected descriptor is set
            if (!(inspectionPanel instanceof DescriptorBasedComponentInspectionPanel)) {
                this.inspectionsPanel.setButtonContainerVisible(inspectionPanel instanceof TextInspectionPanel);
            }
        }
    }

    private inspectComponentOnDemand(component: Component, source?: PageNavigationEventSource, focus?: boolean): void {
        assertNotNull(component, 'component cannot be null');

        // not showing/hiding inspection panel if component has no descriptor or if is in text edit mode
        const isPanelToHide: boolean = this.isInspectComponentToHide(component);
        const waitForContextPanel = !isPanelToHide && this.isContextPanelCollapsed();

        if (isPanelToHide && this.isContextPanelExpanded() && !this.isContextPanelDocked()) {
            this.contextPanelToggleHandler?.();
        }

        if (waitForContextPanel) {
            // Wait until ContextPanel is expanded before activating the InspectPanel inside
            this.componentToInspectOnContextPanelExpand = component;
        }

        InspectEvent.create().setShowWidget(true).setShowPanel(!isPanelToHide).setSource(source).build().fire();

        if (waitForContextPanel) {
            return;
        }

        this.doInspectComponent(component, !isPanelToHide, focus);
    }

    private isInspectComponentToHide(component: Component): boolean {
        if (this.isTextModeOn) {
            return false;
        }

        return component instanceof DescriptorBasedComponent && !component.hasDescriptor() && this.isShown();
    }

    private openComponentInspect(component: Component, source?: PageNavigationEventSource, focus?: boolean): void {
        assertNotNull(component, 'component cannot be null');

        InspectEvent.create().setShowWidget(true).setShowPanel(true).setSource(source).build().fire();

        this.doInspectComponent(component, true, focus);
    }

    isShown(): boolean {
        return !ObjectHelper.stringEquals(this.getHTMLElement().style.display, 'none');
    }

    setEnabled(enabled: boolean): void {
        this.modifyPermissions = enabled;

        this.insertablesPanel?.setModifyPermissions(enabled);
        this.liveEditPageProxy?.setModifyPermissions(enabled);
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
        this.availableInspectPanels.forEach(
            (panel) => panel instanceof DescriptorBasedComponentInspectionPanel && panel.unbindSiteModelListeners());
        this.liveEditModel = null;
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
        const focusEditor = data.isFocus();
        this.lastInspectedItemPath = path;
        const currentPage: Page = PageState.getState();
        const item: PageItem = currentPage?.getComponentByPath(path);

        if (item instanceof Component) {
            if (force) { // force inspecting component
                this.openComponentInspect(item, data.getSource(), focusEditor);
            } else { // inspect component only if inspection panel is open, close if no descriptor
                this.inspectComponentOnDemand(item, data.getSource(), focusEditor);
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

    getFrameContainer() {
        return this.frameContainer;
    }

    private updateButtonsVisibility(descriptor?: Descriptor): void {
        this.inspectionsPanel.setButtonContainerVisible(descriptor?.getConfig()?.getFormItems().length > 0);
    }

    setToggleContextPanelHandler(handler: () => void) {
        this.contextPanelToggleHandler = handler;
    }
}
