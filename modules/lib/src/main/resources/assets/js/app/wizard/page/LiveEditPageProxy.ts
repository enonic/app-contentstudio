import {Event} from '@enonic/lib-admin-ui/event/Event';
import {LiveEditModel} from '../../../page-editor/LiveEditModel';
import {PageView} from '../../../page-editor/PageView';
import {ComponentViewDragStartedEvent} from '../../../page-editor/ComponentViewDragStartedEvent';
import {ComponentViewDragStoppedEvent} from '../../../page-editor/ComponentViewDraggingStoppedEvent';
import {ComponentViewDragCanceledEvent} from '../../../page-editor/ComponentViewDragCanceledEvent';
import {ComponentViewDragDroppedEvent} from '../../../page-editor/ComponentViewDragDroppedEventEvent';
import {PageSelectedEvent} from '../../../page-editor/PageSelectedEvent';
import {PageLockedEvent} from '../../../page-editor/PageLockedEvent';
import {PageUnlockedEvent} from '../../../page-editor/PageUnlockedEvent';
import {PageUnloadedEvent} from '../../../page-editor/PageUnloadedEvent';
import {PageTextModeStartedEvent} from '../../../page-editor/PageTextModeStartedEvent';
import {SelectComponentEvent} from '../../../page-editor/event/outgoing/navigation/SelectComponentEvent';
import {DeselectComponentEvent} from '../../../page-editor/event/outgoing/navigation/DeselectComponentEvent';
import {ComponentInspectedEvent} from '../../../page-editor/ComponentInspectedEvent';
import {ComponentLoadedEvent} from '../../../page-editor/ComponentLoadedEvent';
import {ComponentResetEvent} from '../../../page-editor/ComponentResetEvent';
import {LiveEditPageViewReadyEvent} from '../../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/LiveEditPageInitializationErrorEvent';
import {FragmentComponentReloadRequiredEvent} from '../../../page-editor/FragmentComponentReloadRequiredEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {InitializeLiveEditEvent} from '../../../page-editor/InitializeLiveEditEvent';
import {SkipLiveEditReloadConfirmationEvent} from '../../../page-editor/SkipLiveEditReloadConfirmationEvent';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogConfig} from '../../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {UriHelper} from '../../rendering/UriHelper';
import {RenderingMode} from '../../rendering/RenderingMode';
import {EditContentEvent} from '../../event/EditContentEvent';
import {EmulatedEvent} from '../../event/EmulatedEvent';
import {MinimizeWizardPanelEvent} from '@enonic/lib-admin-ui/app/wizard/MinimizeWizardPanelEvent';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DragMask} from '@enonic/lib-admin-ui/ui/mask/DragMask';
import {GLOBAL, GlobalLibAdmin, Store} from '@enonic/lib-admin-ui/store/Store';
import {ContentId} from '../../content/ContentId';
import {CreateHtmlAreaMacroDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaMacroDialogEvent';
import {CreateHtmlAreaContentDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaContentDialogEvent';
import {ComponentPath} from '../../page/region/ComponentPath';
import {PageEventsManager} from '../PageEventsManager';
import {LiveEditPageDialogCreatedEvent} from '../../../page-editor/LiveEditPageDialogCreatedEvent';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {SaveAsTemplateEvent} from '../../../page-editor/SaveAsTemplateEvent';
import {FragmentLoadErrorEvent} from '../../../page-editor/FragmentLoadErrorEvent';
import {PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationEvent} from '../PageNavigationEvent';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {PageNavigationEventType} from '../PageNavigationEventType';
import {PageNavigationEventData} from '../PageNavigationEventData';
import {BeforeContentSavedEvent} from '../../event/BeforeContentSavedEvent';
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
import {LoadComponentFailedEvent} from '../../../page-editor/event/outgoing/manipulation/LoadComponentFailedEvent';
import {LoadComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/LoadComponentViewEvent';
import {DuplicateComponentEvent} from '../../../page-editor/event/outgoing/manipulation/DuplicateComponentEvent';
import {SetFragmentComponentEvent} from '../../../page-editor/event/outgoing/manipulation/SetFragmentComponentEvent';
import {DescriptorKey} from '../../page/DescriptorKey';
import {SetComponentDescriptorEvent} from '../../../page-editor/event/outgoing/manipulation/SetComponentDescriptorEvent';
import {UpdateTextComponentEvent} from '../../../page-editor/event/outgoing/manipulation/UpdateTextComponentEvent';
import {DuplicateComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/DuplicateComponentViewEvent';
import {CustomizePageEvent} from '../../../page-editor/event/outgoing/manipulation/CustomizePageEvent';
import {PageHelper} from '../../util/PageHelper';
import {MoveComponentEvent} from '../../../page-editor/event/outgoing/manipulation/MoveComponentEvent';
import {MoveComponentViewEvent} from '../../../page-editor/event/incoming/manipulation/MoveComponentViewEvent';
import {DetachFragmentEvent} from '../../../page-editor/event/outgoing/manipulation/DetachFragmentEvent';
import {ComponentDuplicatedEvent} from '../../page/region/ComponentDuplicatedEvent';
import {ComponentMovedEvent} from '../../page/region/ComponentMovedEvent';
import {ComponentRemovedOnMoveEvent} from '../../page/region/ComponentRemovedOnMoveEvent';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {LiveEditPage} from '../../../page-editor/LiveEditPage';

// This class is responsible for communication between the live edit iframe and the main iframe
export class LiveEditPageProxy
    implements PageNavigationHandler {

    private liveEditModel?: LiveEditModel;

    private pageView?: PageView;

    private liveEditIFrame?: IFrameEl;

    private contentId: ContentId;

    private liveEditWindow: Window;

    private livejq: JQueryStatic;

    private dragMask: DragMask;

    private static debug: boolean = false;

    private modifyPermissions: boolean;

    constructor(contentId: ContentId) {
        this.contentId = contentId;

        this.initListeners();
    }

    private initListeners(): void {
        PageNavigationMediator.get().addPageNavigationHandler(this);

        PageEventsManager.get().onLiveEditPageViewReady((event: LiveEditPageViewReadyEvent) => {
            if (LiveEditPageProxy.debug) {
                console.debug('LiveEditPageProxy.onLiveEditPageViewReady at ' + new Date().toISOString());
            }

            this.pageView = event.getPageView();
        });

        EmulatedEvent.on((event: EmulatedEvent) => {
            if (!this.pageView) {
                return;
            }

            this.setWidth(event.getWidthWithUnits());
            this.setHeight(event.getHeightWithUnits());

            if (event.isFullscreen()) {
                this.resetParentHeight();
            } else {
                this.updateLiveEditFrameContainerHeight(event.getDevice().getHeight());
            }
        });

        WindowDOM.get().onUnload(() => {
           sessionStorage.removeItem(`${LiveEditPage.SELECTED_PATH_STORAGE_KEY}:${this.contentId.toString()}`);
           sessionStorage.removeItem(`${LiveEditPage.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${this.contentId.toString()}`);
        });

        this.listenToMainFrameEvents();
    }

    private createLiveEditIFrame(): IFrameEl {
        let liveEditIFrame = new IFrameEl('live-edit-frame');
        liveEditIFrame.onLoaded(() => this.handleIFrameLoadedEvent());

        return liveEditIFrame;
    }

    // this helps to put horizontal scrollbar in the bottom of live edit frame
    private updateLiveEditFrameContainerHeight(height: number) {
        let body = document.body;
        let html = document.documentElement;

        let pageHeight = Math.max(body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight);

        let frameParent = this.getIFrame().getHTMLElement().parentElement;
        if (height > pageHeight) {
            frameParent.style.height = '';
            frameParent.classList.add('overflow');
        } else {
            frameParent.style.height = `${height + LiveEditPageProxy.getScrollbarWidth()}px`;
            frameParent.classList.remove('overflow');
        }
    }

    private resetParentHeight() {
        const frameParent = this.getIFrame().getHTMLElement().parentElement;
        frameParent.style.height = '';
        frameParent.classList.remove('overflow');
    }

    private static getScrollbarWidth(): number {
        let outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.width = '100px';

        document.body.appendChild(outer);

        let widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = 'scroll';

        // add inner div
        let inner = document.createElement('div');
        inner.style.width = '100%';
        outer.appendChild(inner);

        let widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    }

    public setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    public getModel(): LiveEditModel {
        return this.liveEditModel;
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;
        this.pageView?.setModifyPermissions(modifyPermissions);
    }

    public setWidth(value: string) {
        this.liveEditIFrame.getEl().setWidth(value);
    }

    public setWidthPx(value: number) {
        this.liveEditIFrame.getEl().setWidthPx(value);
    }

    public setHeight(value: string) {
        this.liveEditIFrame.getEl().setHeight(value);
    }

    public setHeightPx(value: number) {
        this.liveEditIFrame.getEl().setHeightPx(value);
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

    public getJQuery(): JQueryStatic {
        return this.livejq;
    }

    public createDraggable(item: JQuery) {
        this.pageView.createDraggable(item);
        //this.liveEditWindow.DragAndDrop.get().createDraggable(item);
    }

    public destroyDraggable(item: JQuery) {
        this.pageView.destroyDraggable(item);
        //this.liveEditWindow.DragAndDrop.get().destroyDraggable(item);
    }

    public getDragMask(): DragMask {
        return this.dragMask;
    }

    public remove() {
        this.dragMask.remove();
    }

    private scrollIFrameToSavedPosition(scrollTop: number, timer?: number) {
        if (!scrollTop) {
            return;
        }

        if (!this.liveEditWindow.document.body) {
            timer = window.setTimeout(() => this.scrollIFrameToSavedPosition(scrollTop, timer), 10);
            return;
        }

        this.livejq(this.liveEditWindow.document).scrollTop(scrollTop);
        clearTimeout(timer);
    }

    public load() {
        if (!this.liveEditIFrame) {
            this.liveEditIFrame = this.createLiveEditIFrame();
            this.dragMask = new DragMask(this.liveEditIFrame);
        }

        PageEventsManager.get().notifyBeforeLoad();

        let scrollTop;
        if (this.pageView) {

            if (this.livejq && this.liveEditWindow) {
                // Store vertical scroll position inside the iFrame
                // to be able to scroll to it after reload
                scrollTop = this.livejq(this.liveEditWindow).scrollTop();
            }

            // do this to unregister all dependencies of current page view
            this.pageView.remove();
            this.pageView = null;
        }
        let contentId = this.contentId.toString();
        let pageUrl = UriHelper.getPortalUri(contentId, RenderingMode.EDIT);

        if (!this.liveEditWindow) {
            this.liveEditIFrame.setSrc(pageUrl);
        } else {
            this.liveEditWindow.document.location.href = pageUrl; // This is a faster way to reload the iframe
            if (scrollTop) {
                this.livejq(this.liveEditWindow.document).ready(() => this.scrollIFrameToSavedPosition(scrollTop));
            }
        }

        if (this.liveEditModel) {
            if (this.liveEditModel.isRenderableContent()) {
                if (LiveEditPageProxy.debug) {
                    console.log(`LiveEditPageProxy.load loading page from '${pageUrl}' at ${new Date().toISOString()}`);
                }

                this.liveEditIFrame.show();
            } else {

                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.load: no reason to load page, showing blank placeholder');
                }

                this.liveEditIFrame.hide();
            }
        }
    }

    public unload(): void {
        this.pageView?.remove();
        this.pageView = null;

        this.liveEditIFrame?.getEl().removeAttribute('src');
        this.liveEditIFrame?.remove();
        this.dragMask?.remove();

        if (this.liveEditWindow) {
            this.stopListening(this.liveEditWindow);
            this.liveEditWindow = null;
        }
    }

    public skipNextReloadConfirmation(skip: boolean) {
        if (this.liveEditWindow) {
            new SkipLiveEditReloadConfirmationEvent(skip).fire(this.liveEditWindow);
        }
    }

    public propagateEvent(event: Event) {
        if (this.liveEditWindow) {
            event.fire(this.liveEditWindow);
        }
    }

    private handleIFrameLoadedEvent() {
        let liveEditWindow: Window = this.liveEditIFrame.getHTMLElement()['contentWindow'];

        if (LiveEditPageProxy.debug) {
            console.debug('LiveEditPageProxy.handleIframeLoadedEvent at ' + new Date().toISOString());
        }

        if (liveEditWindow) {

            if (this.liveEditWindow) {
                this.stopListening(this.liveEditWindow);
            }

            this.liveEditWindow = liveEditWindow;
            const liveEditGlobal: GlobalLibAdmin = liveEditWindow[GLOBAL];
            const liveEditStore: Store = liveEditGlobal ? liveEditGlobal.store : null;
            const livejq = (liveEditStore && liveEditStore.has('$')) ? liveEditStore.get('$') : liveEditWindow['$'];
            if (livejq) {

                this.livejq = livejq as JQueryStatic;

                this.listenToLivePageEvents(this.liveEditWindow);

                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.hanldeIframeLoadedEvent: initialize live edit at ' + new Date().toISOString());
                }

                if (this.liveEditModel) {
                    new InitializeLiveEditEvent(this.createLiveEditParams()).fire(this.liveEditWindow);
                }
            } else {
                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.handleIframeLoadedEvent: notify live edit ready at ' + new Date().toISOString());
                }

                if (this.liveEditModel) {
                    PageEventsManager.get().notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
                }
            }
        }

        // Notify loaded no matter the result
        PageEventsManager.get().notifyLoaded();
    }

    private createLiveEditParams(): LiveEditParams {
        const isFragment = this.liveEditModel.getContent().getType().isFragment();
        const displayName = this.liveEditModel.getContent().getDisplayName();
        const locked = !this.liveEditModel.getContent().isPageTemplate() && !PageState.getState()?.hasController() && !isFragment;
        const isFragmentAllowed = this.liveEditModel.isFragmentAllowed();
        const isResetEnabled =  PageState.getState()?.hasController();
        const pageName = displayName;
        const pageIconClass = PageHelper.getPageIconClass(PageState.getState());
        const isPageEmpty = this.liveEditModel.getContent().isPageTemplate() && !PageState.getState()?.hasController();
        const applicationKeys = this.liveEditModel.getSiteModel().getSite().getApplicationKeys().map((key) => key.toString());
        const contentId = this.liveEditModel.getContent().getId();
        const language = this.liveEditModel.getContent()?.getLanguage();
        const contentType = this.liveEditModel.getContent().getType()?.toString();
        const sitePath: string = this.liveEditModel.getSiteModel().getSite().getPath().toString();
        const modifyPermissions: boolean = this.modifyPermissions;

        return {
            isFragment,
            displayName,
            locked,
            isFragmentAllowed,
            isResetEnabled,
            pageName,
            pageIconClass,
            isPageEmpty,
            applicationKeys,
            contentId,
            language,
            contentType,
            sitePath,
            modifyPermissions,
        };
    }

    isLocked(): boolean {
        return this.pageView?.isLocked();
    }

    setLocked(locked: boolean): void {
        this.pageView?.setLocked(locked);
    }

    public loadComponent(path: ComponentPath, uri: string): void {
        new LoadComponentViewEvent(path, uri).fire(this.liveEditWindow);
    }

    public stopListening(contextWindow: Window) {
        ComponentViewDragStartedEvent.un(null, contextWindow);

        ComponentViewDragStoppedEvent.un(null, contextWindow);

        ComponentViewDragCanceledEvent.un(null, contextWindow);

        ComponentViewDragDroppedEvent.un(null, contextWindow);

        PageSelectedEvent.un(null, contextWindow);

        PageLockedEvent.un(null, contextWindow);

        PageUnlockedEvent.un(null, contextWindow);

        PageUnloadedEvent.un(null, contextWindow);

        PageTextModeStartedEvent.un(null, contextWindow);

        SelectComponentEvent.un(null, contextWindow);

        DeselectComponentEvent.un(null, contextWindow);

        ComponentInspectedEvent.un(null, contextWindow);

        FragmentComponentReloadRequiredEvent.un(null, contextWindow);

        ShowWarningLiveEditEvent.un(null, contextWindow);

        ComponentLoadedEvent.un(null, contextWindow);

        ComponentResetEvent.un(null, contextWindow);

        LiveEditPageViewReadyEvent.un(null, contextWindow);

        LiveEditPageInitializationErrorEvent.un(null, contextWindow);

        CreateHtmlAreaDialogEvent.un(null, contextWindow);

        UpdateTextComponentEvent.un(null, contextWindow);

        CustomizePageEvent.un(null, contextWindow);

        SetComponentDescriptorEvent.un(null, contextWindow);

        AddComponentEvent.un(null, contextWindow);

        RemoveComponentRequest.un(null, contextWindow);

        PageResetEvent.un(null, contextWindow);

        DuplicateComponentEvent.un(null, contextWindow);

        SetFragmentComponentEvent.un(null, contextWindow);

        MoveComponentEvent.un(null, contextWindow);

        CreateFragmentEvent.un(null, contextWindow);

        DetachFragmentEvent.un(null, contextWindow);
    }

    public listenToLivePageEvents(contextWindow: Window) {
        const eventsManager: PageEventsManager = PageEventsManager.get();

        MinimizeWizardPanelEvent.on(() => {
            new MinimizeWizardPanelEvent().fire(contextWindow);
        });

        ComponentViewDragStartedEvent.on((event: ComponentViewDragStartedEvent) => {
            eventsManager.notifyComponentDragStarted(event.getPath());
        }, contextWindow);

        ComponentViewDragStoppedEvent.on((event: ComponentViewDragStoppedEvent) => {
            eventsManager.notifyComponentDragStopped(event.getPath());
        }, contextWindow);

        ComponentViewDragCanceledEvent.on((event: ComponentViewDragCanceledEvent) => {
            eventsManager.notifyComponentViewDragCanceled(event);
        }, contextWindow);

        ComponentViewDragDroppedEvent.on((event: ComponentViewDragDroppedEvent) => {
            eventsManager.notifyComponentViewDragDropped(event);
        }, contextWindow);

        PageSelectedEvent.on((event: PageSelectedEvent) => {
            eventsManager.notifyPageSelected(event);
        }, contextWindow);

        PageLockedEvent.on((event: PageLockedEvent) => {
            eventsManager.notifyPageLocked(event);
        }, contextWindow);

        PageUnlockedEvent.on((event: PageUnlockedEvent) => {
            eventsManager.notifyPageUnlocked(event);
        }, contextWindow);

        PageTextModeStartedEvent.on((event: PageTextModeStartedEvent) => {
            eventsManager.notifyPageTextModeStarted(event);
        }, contextWindow);

        SelectComponentEvent.on((event: SelectComponentEvent) => {
            const pathAsString: string = event.getComponentPathAsString();
            const path: ComponentPath = ComponentPath.fromString(pathAsString);

            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)), this);
        }, contextWindow);

        DeselectComponentEvent.on(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.DESELECT, new PageNavigationEventData()), this);
        }, contextWindow);

        ComponentInspectedEvent.on((event: ComponentInspectedEvent) => {
            const pathAsString: string = event.getComponentPathAsString();
            const path: ComponentPath = ComponentPath.fromString(pathAsString);

            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(path)));
        }, contextWindow);

        ShowWarningLiveEditEvent.on((event: ShowWarningLiveEditEvent) => {
            eventsManager.notifyShowWarning(event);
        }, contextWindow);

        EditContentEvent.on((event: EditContentEvent) => {
            eventsManager.notifyEditContent(event);
        }, contextWindow);

        ComponentLoadedEvent.on((event: ComponentLoadedEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getPath().toString());
            eventsManager.notifyComponentLoaded(path);
        }, contextWindow);

        ComponentResetEvent.on((event: ComponentResetEvent) => {
            eventsManager.notifyComponentReset(event.getPath());
        }, contextWindow);

        LiveEditPageViewReadyEvent.on((event: LiveEditPageViewReadyEvent) => {
            eventsManager.notifyLiveEditPageViewReady(event);
        }, contextWindow);

        LiveEditPageInitializationErrorEvent.on((event: LiveEditPageInitializationErrorEvent) => {
            eventsManager.notifyLiveEditPageInitializationError(event);
        }, contextWindow);

        CreateHtmlAreaDialogEvent.on((event: CreateHtmlAreaDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        }, contextWindow);

        CreateHtmlAreaMacroDialogEvent.on((event: CreateHtmlAreaMacroDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        }, contextWindow);

        CreateHtmlAreaContentDialogEvent.on((event: CreateHtmlAreaContentDialogEvent) => {
            eventsManager.notifyLiveEditPageDialogCreate(event);
        }, contextWindow);

        eventsManager.onDialogCreated((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => {
            new LiveEditPageDialogCreatedEvent(modalDialog, config).fire(this.liveEditWindow);
        });

        SaveAsTemplateEvent.on(() => {
            eventsManager.notifyPageSaveAsTemplate();
        }, contextWindow);

        FragmentLoadErrorEvent.on((event: FragmentLoadErrorEvent) => {
            eventsManager.notifyFragmentLoadError(event.getFragmentComponentView().getPath());
        }, contextWindow);

        CreateFragmentEvent.on((event: CreateFragmentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentCreateFragmentRequested(path);
        }, contextWindow);

        PageResetEvent.on(() => {
            PageEventsManager.get().notifyPageResetRequested();
        }, contextWindow);

        // Remove page placeholder from live edit and use one entry point (LiveEditPagePlaceholder) in liveformpanel
        SelectPageDescriptorEvent.on((event: SelectPageDescriptorEvent) => {
            PageEventsManager.get().notifyPageControllerSetRequested(DescriptorKey.fromString(event.getDescriptor()));
        }, contextWindow);

        AddComponentEvent.on((event: AddComponentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const type: ComponentType = ComponentType.byShortName(event.getComponentType().getShortName());

            PageEventsManager.get().notifyComponentAddRequested(path, type);
        }, contextWindow);

        RemoveComponentRequest.on((event: RemoveComponentRequest) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentRemoveRequested(path);
        }, contextWindow);

        LoadComponentFailedEvent.on((event: LoadComponentFailedEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentLoadFailed(path, event.getError());
        });

        DuplicateComponentEvent.on((event: DuplicateComponentEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentDuplicateRequested(path);
        }, contextWindow);

        SetFragmentComponentEvent.on((event: SetFragmentComponentEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifySetFragmentComponentRequested(path, event.getContentId());
        }, contextWindow);

        SetComponentDescriptorEvent.on((event: SetComponentDescriptorEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            PageEventsManager.get().notifyComponentDescriptorSetRequested(path, DescriptorKey.fromString(event.getDescriptor()));
        }, contextWindow);

        UpdateTextComponentEvent.on((event: UpdateTextComponentEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyTextComponentUpdateRequested(path, event.getText());
        }, contextWindow);

        CustomizePageEvent.on((event: CustomizePageEvent): void => {
            PageEventsManager.get().notifyCustomizePageRequested();
        }, contextWindow);

        MoveComponentEvent.on((event: MoveComponentEvent): void => {
            const from: ComponentPath = ComponentPath.fromString(event.getFrom().toString());
            const to: ComponentPath = ComponentPath.fromString(event.getTo().toString());

            PageEventsManager.get().notifyComponentMoveRequested(from, to);
        }, contextWindow);

        DetachFragmentEvent.on((event: DetachFragmentEvent): void => {
            const from: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());

            PageEventsManager.get().notifyComponentDetachFragmentRequested(from);
        });
    }

    private listenToMainFrameEvents() {
        PageEventsManager.get().onDialogCreated((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => {
            if (this.liveEditWindow) {
                new LiveEditPageDialogCreatedEvent(modalDialog, config).fire(this.liveEditWindow);
            }
        });

        PageState.getEvents().onComponentAdded((event: ComponentAddedEvent): void => {
            if (this.liveEditWindow) {
                if (event instanceof ComponentDuplicatedEvent) {
                    new DuplicateComponentViewEvent(event.getPath()).fire(this.liveEditWindow);
                } else if (event instanceof ComponentMovedEvent) {
                    new MoveComponentViewEvent(event.getFrom(), event.getTo()).fire(this.liveEditWindow);
                } else {
                    new AddComponentViewEvent(event.getPath(), event.getComponent().getType()).fire(this.liveEditWindow);
                }
            }
        });

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            if (this.liveEditWindow) {
                if (event instanceof ComponentRemovedOnMoveEvent) {
                    // do nothing since component is being moved
                } else {
                    new RemoveComponentViewEvent(event.getPath()).fire(this.liveEditWindow);
                }
            }
        });

        BeforeContentSavedEvent.on(() => {
            if (this.liveEditWindow) {
                new BeforeContentSavedEvent().fire(this.liveEditWindow);
            }
        });

        EditTextComponentViewEvent.on((event: EditTextComponentViewEvent) => {
            if (this.liveEditWindow) {
                new EditTextComponentViewEvent(event.getPath()).fire(this.liveEditWindow);
            }
        });
    }

    handle(event: PageNavigationEvent): void {
        if (event.getType() === PageNavigationEventType.SELECT) {
            new SelectComponentViewEvent(event.getData().getPath()?.toString()).fire(this.liveEditWindow);
            return;
        }

        if (event.getType() === PageNavigationEventType.DESELECT) {
            new DeselectComponentViewEvent(event.getData().getPath()?.toString()).fire(this.liveEditWindow);
            return;
        }
    }
}
