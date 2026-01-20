import {LiveEditModel} from '../../../page-editor/LiveEditModel';
import {ComponentViewDragStartedEvent} from '../../../page-editor/ComponentViewDragStartedEvent';
import {ComponentViewDragStoppedEvent} from '../../../page-editor/ComponentViewDraggingStoppedEvent';
import {ComponentViewDragCanceledEvent} from '../../../page-editor/ComponentViewDragCanceledEvent';
import {ComponentViewDragDroppedEvent} from '../../../page-editor/ComponentViewDragDroppedEventEvent';
import {PageLockedEvent} from '../../../page-editor/event/outgoing/manipulation/PageLockedEvent';
import {PageUnlockedEvent} from '../../../page-editor/event/outgoing/manipulation/PageUnlockedEvent';
import {SelectComponentEvent} from '../../../page-editor/event/outgoing/navigation/SelectComponentEvent';
import {DeselectComponentEvent} from '../../../page-editor/event/outgoing/navigation/DeselectComponentEvent';
import {ComponentInspectedEvent} from '../../../page-editor/ComponentInspectedEvent';
import {ComponentLoadedEvent} from '../../../page-editor/ComponentLoadedEvent';
import {LiveEditPageViewReadyEvent} from '../../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/LiveEditPageInitializationErrorEvent';
import {FragmentComponentReloadRequiredEvent} from '../../../page-editor/FragmentComponentReloadRequiredEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {InitializeLiveEditEvent} from '../../../page-editor/InitializeLiveEditEvent';
import {SkipLiveEditReloadConfirmationEvent} from '../../../page-editor/SkipLiveEditReloadConfirmationEvent';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogConfig} from '../../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DragMask} from '@enonic/lib-admin-ui/ui/mask/DragMask';
import {ContentId} from '../../content/ContentId';
import {CreateHtmlAreaMacroDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaMacroDialogEvent';
import {CreateHtmlAreaContentDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaContentDialogEvent';
import {ComponentPath} from '../../page/region/ComponentPath';
import {PageEventsManager} from '../PageEventsManager';
import {LiveEditPageDialogCreatedEvent} from '../../../page-editor/LiveEditPageDialogCreatedEvent';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {SaveAsTemplateEvent} from '../../../page-editor/SaveAsTemplateEvent';
import {PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationEvent} from '../PageNavigationEvent';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {PageNavigationEventType} from '../PageNavigationEventType';
import {PageNavigationEventData, PageNavigationEventSource} from '../PageNavigationEventData';
import {BeforeContentSavedEvent} from '../../event/BeforeContentSavedEvent';
import {IframeBeforeContentSavedEvent} from '../../event/IframeBeforeContentSavedEvent';
import {LiveEditParams} from '../../../page-editor/LiveEditParams';
import {CreateFragmentEvent} from '../../../page-editor/event/outgoing/manipulation/CreateFragmentEvent';
import {PageResetEvent} from '../../../page-editor/event/outgoing/manipulation/PageResetEvent';
import {SelectPageDescriptorEvent} from '../../../page-editor/event/outgoing/manipulation/SelectPageDescriptorEvent';
import {SelectComponentViewEvent} from '../../../page-editor/event/incoming/navigation/SelectComponentViewEvent';
import {DeselectComponentViewEvent} from '../../../page-editor/event/incoming/navigation/DeselectComponentViewEvent';
import {EditTextComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/EditTextComponentViewEvent';
import {PageState} from './PageState';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {AddComponentEvent} from '../../../page-editor/event/outgoing/manipulation/AddComponentEvent';
import {ComponentType} from '../../page/region/ComponentType';
import {AddComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/AddComponentViewEvent';
import {RemoveComponentRequest} from '../../../page-editor/event/outgoing/manipulation/RemoveComponentRequest';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {RemoveComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/RemoveComponentViewEvent';
import {LoadComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/LoadComponentViewEvent';
import {DuplicateComponentEvent} from '../../../page-editor/event/outgoing/manipulation/DuplicateComponentEvent';
import {SetFragmentComponentEvent} from '../../../page-editor/event/outgoing/manipulation/SetFragmentComponentEvent';
import {DescriptorKey} from '../../page/DescriptorKey';
import {SetComponentDescriptorEvent} from '../../../page-editor/event/outgoing/manipulation/SetComponentDescriptorEvent';
import {UpdateTextComponentEvent} from '../../../page-editor/event/outgoing/manipulation/UpdateTextComponentEvent';
import {DuplicateComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/DuplicateComponentViewEvent';
import {CustomizePageEvent} from '../../../page-editor/event/outgoing/manipulation/CustomizePageEvent';
import {MoveComponentEvent} from '../../../page-editor/event/outgoing/manipulation/MoveComponentEvent';
import {MoveComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/MoveComponentViewEvent';
import {DetachFragmentEvent} from '../../../page-editor/event/outgoing/manipulation/DetachFragmentEvent';
import {ComponentDuplicatedEvent} from '../../page/region/ComponentDuplicatedEvent';
import {ComponentMovedEvent} from '../../page/region/ComponentMovedEvent';
import {ComponentRemovedOnMoveEvent} from '../../page/region/ComponentRemovedOnMoveEvent';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {SetPageLockStateEvent} from '../../../page-editor/event/incoming/manipulation/SetPageLockStateEvent';
import {SetModifyAllowedEvent} from '../../../page-editor/event/incoming/manipulation/SetModifyAllowedEvent';
import {CreateOrDestroyDraggableEvent} from '../../../page-editor/event/incoming/manipulation/CreateOrDestroyDraggableEvent';
import {PageUpdatedEvent} from '../../page/event/PageUpdatedEvent';
import {PageControllerCustomizedEvent} from '../../page/event/PageControllerCustomizedEvent';
import {ResetComponentEvent} from '../../../page-editor/event/outgoing/manipulation/ResetComponentEvent';
import {ResetComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/ResetComponentViewEvent';
import {TextEditModeChangedEvent} from '../../../page-editor/event/outgoing/navigation/TextEditModeChangedEvent';
import {EditContentFromComponentViewEvent} from '../../../page-editor/event/outgoing/manipulation/EditContentFromComponentViewEvent';
import {ContentUrlHelper} from '../../util/ContentUrlHelper';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {PageStateEvent} from '../../../page-editor/event/incoming/common/PageStateEvent';
import {ProjectContext} from '../../project/ProjectContext';
import {ComponentTextUpdatedEvent} from '../../page/region/ComponentTextUpdatedEvent';
import {UpdateTextComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/UpdateTextComponentViewEvent';
import {SetComponentStateEvent} from '../../../page-editor/event/incoming/manipulation/SetComponentStateEvent';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {PageReloadRequestedEvent} from '../../../page-editor/event/outgoing/manipulation/PageReloadRequestedEvent';
import {WizardWidgetRenderingHandler} from '../WizardWidgetRenderingHandler';
import {SessionStorageHelper} from '../../util/SessionStorageHelper';
import {IframeEventBus} from '@enonic/lib-admin-ui/event/IframeEventBus';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {CookieHelper} from '@enonic/lib-admin-ui/util/CookieHelper';
import {PartComponentType} from '../../page/region/PartComponentType';
import {LayoutComponentType} from '../../page/region/LayoutComponentType';
import {TextComponentType} from '../../page/region/TextComponentType';
import {LoadComponentFailedEvent} from '../../../page-editor/event/outgoing/manipulation/LoadComponentFailedEvent';
import {FragmentComponentType} from '../../page/region/FragmentComponentType';

// This class is responsible for communication between the live edit iframe and the main iframe
export class LiveEditPageProxy
    implements PageNavigationHandler {

    private liveEditModel?: LiveEditModel;

    private liveEditIFrame?: IFrameEl;

    // private liveEditWindow: Window;

    private isFrameLoaded: boolean = false;

    // private livejq: JQueryStatic;

    private dragMask: DragMask;

    private static debug: boolean = false;

    private modifyPermissions: boolean;

    private isPageLocked: boolean;

    constructor(model: LiveEditModel) {

        this.setModel(model);

        this.initElements();
        this.initListeners();
    }

    private initListeners(): void {
        PageNavigationMediator.get().addPageNavigationHandler(this);

        WindowDOM.get().onUnload(() => {
            const contentId = this.liveEditModel.getContent().getContentId().toString();
            SessionStorageHelper.removeSelectedPathInStorage(contentId);
            SessionStorageHelper.removeSelectedTextCursorPosInStorage(contentId);
        });

        this.listenToMainFrameEvents();
    }

    private createLiveEditIFrame(): IFrameEl {
        let liveEditIFrame = new IFrameEl('live-edit-frame');

        IframeEventBus.get().setId('studio-bus');

        // Register events coming from iframe here to be able to revive them in CS
        IframeEventBus.get().registerClass('IframeEvent', IframeEvent);
        IframeEventBus.get().registerClass('LiveEditPageViewReadyEvent', LiveEditPageViewReadyEvent);
        IframeEventBus.get().registerClass('SelectComponentEvent', SelectComponentEvent);
        IframeEventBus.get().registerClass('AddComponentEvent', AddComponentEvent);
        IframeEventBus.get().registerClass('RemoveComponentRequest', RemoveComponentRequest);
        IframeEventBus.get().registerClass('DuplicateComponentEvent', DuplicateComponentEvent);
        IframeEventBus.get().registerClass('PartComponentType', PartComponentType);
        IframeEventBus.get().registerClass('LayoutComponentType', LayoutComponentType);
        IframeEventBus.get().registerClass('TextComponentType', TextComponentType);
        IframeEventBus.get().registerClass('FragmentComponentType', FragmentComponentType);
        IframeEventBus.get().registerClass('ComponentPath', ComponentPath);
        IframeEventBus.get().registerClass('ComponentViewDragStartedEvent', ComponentViewDragStartedEvent);
        IframeEventBus.get().registerClass('ComponentViewDragStoppedEvent', ComponentViewDragStoppedEvent);
        IframeEventBus.get().registerClass('ComponentViewDragDroppedEvent', ComponentViewDragDroppedEvent);
        IframeEventBus.get().registerClass('SetComponentDescriptorEvent', SetComponentDescriptorEvent);
        IframeEventBus.get().registerClass('ComponentLoadedEvent', ComponentLoadedEvent);
        IframeEventBus.get().registerClass('LoadComponentFailedEvent', LoadComponentFailedEvent);
        IframeEventBus.get().registerClass('TypeError', TypeError);
        IframeEventBus.get().registerClass('DeselectComponentEvent', DeselectComponentEvent);
        IframeEventBus.get().registerClass('ResetComponentEvent', ResetComponentEvent);
        IframeEventBus.get().registerClass('MoveComponentEvent', MoveComponentEvent);
        IframeEventBus.get().registerClass('TextEditModeChangedEvent', TextEditModeChangedEvent);
        IframeEventBus.get().registerClass('UpdateTextComponentEvent', UpdateTextComponentEvent);
        IframeEventBus.get().registerClass('ComponentInspectedEvent', ComponentInspectedEvent);
        IframeEventBus.get().registerClass('PageLockedEvent', PageLockedEvent);
        IframeEventBus.get().registerClass('PageUnlockedEvent', PageUnlockedEvent);
        IframeEventBus.get().registerClass('SetFragmentComponentEvent', SetFragmentComponentEvent);
        IframeEventBus.get().registerClass('CreateFragmentEvent', CreateFragmentEvent);


        IframeEventBus.get().onEvent('editor-iframe-loaded', (event) => {
            this.handleIFrameLoadedEvent();
        });

        IframeEventBus.get().onEvent('editor-modifier-pressed', (event) => {
            const data = event.getData();
            // Simulating iframe modifier event to allow shortcuts work when iframe is focused
            $(document).simulate(data['type'] as string, data['config']);
        });

        return liveEditIFrame;
    }

    public setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;

        if (this.isFrameLoaded) {
            new SetModifyAllowedEvent(modifyPermissions).fire();
        }
    }

    public getWidth(): number {
        return this.liveEditIFrame.getEl().getWidth();
    }

    public getHeight(): number {
        return this.liveEditIFrame.getEl().getHeight();
    }

    public getIFrame(): IFrameEl {
        return this.liveEditIFrame;
    }

    public createDraggable(data: { type: string }) {
        if (this.isFrameLoaded) {
            new CreateOrDestroyDraggableEvent(data.type, true).fire();
        }
    }

    public destroyDraggable(data: { type: string }) {
        if (this.isFrameLoaded) {
            new CreateOrDestroyDraggableEvent(data.type, false).fire();
        }
    }

    public getDragMask(): DragMask {
        return this.dragMask;
    }

    public remove() {
        this.dragMask.remove();
    }

    public load(widgetRenderingHelper: WizardWidgetRenderingHandler, viewWidget: Widget): Promise<boolean> {

        PageEventsManager.get().notifyBeforeLoad();

        // load the page
        return widgetRenderingHelper.render(this.liveEditModel.getContent(), viewWidget);
    }

    public unload(): void {
        this.liveEditIFrame?.getEl().removeAttribute('src');
        this.isPageLocked = false;

        if (this.isFrameLoaded) {
            this.stopListening();
            this.isFrameLoaded = false;
        }
    }

    public skipNextReloadConfirmation(skip: boolean) {
        if (this.isFrameLoaded) {
            new SkipLiveEditReloadConfirmationEvent(skip).fire();
        }
    }

    private handleIFrameLoadedEvent() {
        if (LiveEditPageProxy.debug) {
            console.debug('LiveEditPageProxy.handleIframeLoadedEvent at ' + new Date().toISOString());
        }

        const liveEditWindow = (this.liveEditIFrame.getHTMLElement() as HTMLIFrameElement).contentWindow;

        // now that iframe is loaded, add it as a receiver to the IframeEventBus
        IframeEventBus.get().addReceiver(liveEditWindow);

        this.isFrameLoaded = true;

        if (liveEditWindow) {
            this.isPageLocked = false;

            this.stopListening();

            this.listenToLivePageEvents();

            if (this.isLiveEditAllowed()) {
                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.hanldeIframeLoadedEvent: initialize live edit at ' + new Date().toISOString());
                }

                const jsessionid = CookieHelper.getCookie('JSESSIONID');
                new InitializeLiveEditEvent(this.createLiveEditParams())
                    .setContent(this.liveEditModel.getContentSummaryAndCompareStatus())
                    .setPrincipals()
                    .setConfig()
                    .setProjectJson()
                    .setPageJson()
                    .setUser()
                    .setJsessionId(jsessionid)
                    .setHostDomain(`${window.location.protocol}//${window.location.host}`)
                    .fire();

            } else {
                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.handleIframeLoadedEvent: notify live edit ready at ' + new Date().toISOString());
                }

                PageEventsManager.get().notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
            }
        }

        // Notify loaded no matter the result
        PageEventsManager.get().notifyLoaded();
    }

    private createLiveEditParams(): LiveEditParams {

        return LiveEditParams.fromLiveEditModel(this.liveEditModel, this.resolveApplicationKeys(), this.modifyPermissions);
    }

    private resolveApplicationKeys(): string[] {
        // if is site or within site then get application keys from site
        if (this.liveEditModel.getSiteModel()?.getSite()) {
            return this.liveEditModel.getSiteModel().getSite().getApplicationKeys().map((key) => key.toString()) || [];
        }

        // if is root non-site content then get application keys from project, e.g. headless content items
        return ProjectContext.get().getProject()?.getSiteConfigs()?.map((config) => config.getApplicationKey().toString()) || [];
    }

    isLocked(): boolean {
        return this.isPageLocked;
    }

    setLocked(locked: boolean): void {
        if (this.isFrameLoaded) {
            new SetPageLockStateEvent(locked).fire();
        }
    }

    public loadComponent(path: ComponentPath, uri: string, isExisting = false): void {
        new LoadComponentViewEvent(path, uri, isExisting).fire();
    }

    public stopListening() {
        ComponentViewDragStartedEvent.un(null);

        ComponentViewDragStoppedEvent.un(null);

        ComponentViewDragCanceledEvent.un(null);

        ComponentViewDragDroppedEvent.un(null);

        PageLockedEvent.un(null);

        PageUnlockedEvent.un(null);

        SelectComponentEvent.un(null);

        DeselectComponentEvent.un(null);

        ComponentInspectedEvent.un(null);

        FragmentComponentReloadRequiredEvent.un(null);

        ShowWarningLiveEditEvent.un(null);

        ComponentLoadedEvent.un(null);

        LiveEditPageViewReadyEvent.un(null);

        LiveEditPageInitializationErrorEvent.un(null);

        CreateHtmlAreaDialogEvent.un(null);

        UpdateTextComponentEvent.un(null);

        CustomizePageEvent.un(null);

        SetComponentDescriptorEvent.un(null);

        AddComponentEvent.un(null);

        RemoveComponentRequest.un(null);

        PageResetEvent.un(null);

        DuplicateComponentEvent.un(null);

        SetFragmentComponentEvent.un(null);

        MoveComponentEvent.un(null);

        CreateFragmentEvent.un(null);

        DetachFragmentEvent.un(null);

        ResetComponentEvent.un(null);
    }

    public listenToLivePageEvents() {
        const eventsManager: PageEventsManager = PageEventsManager.get();

        ComponentViewDragStartedEvent.on((event: ComponentViewDragStartedEvent) => {
            eventsManager.notifyComponentDragStarted(event.getPath());
        });

        ComponentViewDragStoppedEvent.on((event: ComponentViewDragStoppedEvent) => {
            eventsManager.notifyComponentDragStopped(event.getPath());
        });

        ComponentViewDragCanceledEvent.on((event: ComponentViewDragCanceledEvent) => {
            eventsManager.notifyComponentViewDragCanceled(event);
        });

        ComponentViewDragDroppedEvent.on((event: ComponentViewDragDroppedEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            eventsManager.notifyComponentViewDragDropped(path);
        });

        PageLockedEvent.on((event: PageLockedEvent) => {
            this.isPageLocked = true;
            eventsManager.notifyPageLocked(event);
        });

        PageUnlockedEvent.on((event: PageUnlockedEvent) => {
            this.isPageLocked = false;
            eventsManager.notifyPageUnlocked(event);
        });

        SelectComponentEvent.on((event: SelectComponentEvent) => {
            const pathAsString: string = event.getPath()?.toString();
            const path: ComponentPath = ComponentPath.fromString(pathAsString);
            const eventData = new PageNavigationEventData(path, PageNavigationEventSource.EDITOR);

            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, eventData), this);
        });

        DeselectComponentEvent.on(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.DESELECT, new PageNavigationEventData()), this);
        });

        ComponentInspectedEvent.on((event: ComponentInspectedEvent) => {

            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT,
                    new PageNavigationEventData(event.getComponentPath())));
        });

        ShowWarningLiveEditEvent.on((event: ShowWarningLiveEditEvent) => {
            eventsManager.notifyShowWarning(event);
        });

        ComponentLoadedEvent.on((event: ComponentLoadedEvent) => {
            eventsManager.notifyComponentLoaded(event.getPath());
        });

        LiveEditPageViewReadyEvent.on((event: LiveEditPageViewReadyEvent) => {
            eventsManager.notifyLiveEditPageViewReady(event);
        });

        LiveEditPageInitializationErrorEvent.on((event: LiveEditPageInitializationErrorEvent) => {
            eventsManager.notifyLiveEditPageInitializationError(event);
        });

        CreateHtmlAreaDialogEvent.on((event: CreateHtmlAreaDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        });

        CreateHtmlAreaMacroDialogEvent.on((event: CreateHtmlAreaMacroDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        });

        CreateHtmlAreaContentDialogEvent.on((event: CreateHtmlAreaContentDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        });

        SaveAsTemplateEvent.on(() => {
            eventsManager.notifyPageSaveAsTemplate();
        });

        CreateFragmentEvent.on((event: CreateFragmentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentCreateFragmentRequested(path);
        });

        PageResetEvent.on(() => {
            PageEventsManager.get().notifyPageResetRequested();
        });

        // Remove page placeholder from live edit and use one entry point (LiveEditPagePlaceholder) in liveformpanel
        SelectPageDescriptorEvent.on((event: SelectPageDescriptorEvent) => {
            PageEventsManager.get().notifyPageControllerSetRequested(DescriptorKey.fromString(event.getDescriptor()));
        });

        AddComponentEvent.on((event: AddComponentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const type: ComponentType = ComponentType.byShortName(event.getComponentType().getShortName());

            // if an item is added on a locked non-customized page, we need to customize it first, and then add a new item
            if (this.isPageLocked) {
                // in future might perform some validation here, access rights check etc
                this.addItemOnPageCustomized(path, type);
                PageEventsManager.get().notifyCustomizePageRequested();
            } else {
                PageEventsManager.get().notifyComponentAddRequested(path, type);
            }
        });

        RemoveComponentRequest.on((event: RemoveComponentRequest) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentRemoveRequested(path);
        });

        LoadComponentFailedEvent.on((event: LoadComponentFailedEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentLoadFailed(path, event.getError());
        });

        DuplicateComponentEvent.on((event: DuplicateComponentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentDuplicateRequested(path);
        });

        SetFragmentComponentEvent.on((event: SetFragmentComponentEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifySetFragmentComponentRequested(path, event.getContentId());
        });

        SetComponentDescriptorEvent.on((event: SetComponentDescriptorEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentDescriptorSetRequested(path, DescriptorKey.fromString(event.getDescriptor()));
        });

        UpdateTextComponentEvent.on((event: UpdateTextComponentEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyTextComponentUpdateRequested(path, event.getText(), event.getOrigin());
        });

        CustomizePageEvent.on((event: CustomizePageEvent): void => {
            PageEventsManager.get().notifyCustomizePageRequested();
        });

        MoveComponentEvent.on((event: MoveComponentEvent): void => {
            const from: ComponentPath = ComponentPath.fromString(event.getFrom().toString());
            const to: ComponentPath = ComponentPath.fromString(event.getTo().toString());

            PageEventsManager.get().notifyComponentMoveRequested(from, to);
        });

        DetachFragmentEvent.on((event: DetachFragmentEvent): void => {
            const from: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentDetachFragmentRequested(from);
        });

        ResetComponentEvent.on((event: ResetComponentEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentResetRequested(path);
        });

        TextEditModeChangedEvent.on((event: TextEditModeChangedEvent): void => {
            PageEventsManager.get().notifyTextComponentEditModeChanged(event.isEditMode());
        });

        EditContentFromComponentViewEvent.on((event: EditContentFromComponentViewEvent): void => {
            ContentUrlHelper.openEditContentTab(new ContentId(event.getId()));
        });

        PageReloadRequestedEvent.on((event: PageReloadRequestedEvent): void => {
            PageEventsManager.get().notifyPageReloadRequested();
        });
    }

    private listenToMainFrameEvents() {

        PageEventsManager.get().onDialogCreated((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => {
            if (this.isFrameLoaded) {
                new LiveEditPageDialogCreatedEvent(modalDialog, config).fire();
            }
        });

        PageState.getEvents().onComponentAdded((event: ComponentAddedEvent): void => {
            if (this.isFrameLoaded) {
                if (event instanceof ComponentDuplicatedEvent) {
                    new DuplicateComponentViewEvent(event.getPath()).fire();
                } else if (event instanceof ComponentMovedEvent) {
                    new MoveComponentViewEvent(event.getFrom(), event.getTo()).fire();
                } else {
                    new AddComponentViewEvent(event.getPath(), event.getComponent().getType()).fire();
                }

                new PageStateEvent(PageState.getState().toJson()).fire();
            }
        });

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            if (this.isFrameLoaded) {
                if (event instanceof ComponentRemovedOnMoveEvent) {
                    // do nothing since component is being moved
                } else {
                    new RemoveComponentViewEvent(event.getPath()).fire();
                    new PageStateEvent(PageState.getState().toJson()).fire();
                }
            }
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            new PageStateEvent(PageState.getState().toJson()).fire();

            if (event instanceof ComponentTextUpdatedEvent && event.getText()) {
                if (this.isFrameLoaded) {
                    new UpdateTextComponentViewEvent(event.getPath(), event.getText(), event.getOrigin()).fire();
                }
            }
        });

        BeforeContentSavedEvent.on(() => {
            if (this.isFrameLoaded) {
                new IframeBeforeContentSavedEvent().fire();
            }
        });

        PageEventsManager.get().onTextComponentEditRequested((path: ComponentPath) => {
            if (this.isFrameLoaded) {
                new EditTextComponentViewEvent(path.toString()).fire();
            }
        });

        PageEventsManager.get().onSetComponentState((path: ComponentPath, processing: boolean) => {
            if (this.isFrameLoaded) {
                new SetComponentStateEvent(path.toString(), processing).fire();
            }
        });
    }

    resetComponent(path: ComponentPath): void {
        if (this.isFrameLoaded) {
            new ResetComponentViewEvent(path).fire();
        }
    }

    handle(event: PageNavigationEvent): void {
        if (event.getType() === PageNavigationEventType.SELECT) {
            new SelectComponentViewEvent(event.getData().getPath()?.toString()).fire();
            return;
        }

        if (event.getType() === PageNavigationEventType.DESELECT) {
            new DeselectComponentViewEvent(event.getData().getPath()?.toString()).fire();
            return;
        }
    }

    private addItemOnPageCustomized(path: ComponentPath, type: ComponentType): void {
        const listener = (event: PageUpdatedEvent): void => {
            if (event instanceof PageControllerCustomizedEvent) {
                PageState.getEvents().unPageUpdated(listener);

                PageEventsManager.get().notifyComponentAddRequested(path, type);
            }
        };

        PageState.getEvents().onPageUpdated(listener);
    }

    private isLiveEditAllowed(): boolean {
        // if content is rendered, but has no controller nor template, we should not allow live edit

        return this.liveEditModel ? this.liveEditModel.getContent().isPageTemplate() ||
                                    PageState.getState()?.hasController() ||
                                    this.liveEditModel.getContent().getType().isFragment() ||
                                    this.liveEditModel.getDefaultModels()?.hasDefaultPageTemplate() : false;
    }

    private initElements() {
        this.liveEditIFrame = this.createLiveEditIFrame();
        this.dragMask = new DragMask(this.liveEditIFrame);
    }
}
