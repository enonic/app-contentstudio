import {
    createHostBus,
    type ContentInfo,
    type HostBus,
    type InitializePayload,
    type InsertableComponentKind,
} from '@enonic/page-editor/protocol';
import { BeforeContentSavedEvent } from '../../event/BeforeContentSavedEvent';
import { type ComponentAddedEvent } from '../../page/region/ComponentAddedEvent';
import { ComponentDuplicatedEvent } from '../../page/region/ComponentDuplicatedEvent';
import { ComponentMovedEvent } from '../../page/region/ComponentMovedEvent';
import { ComponentPath } from '../../page/region/ComponentPath';
import { type ComponentRemovedEvent } from '../../page/region/ComponentRemovedEvent';
import { ComponentRemovedOnMoveEvent } from '../../page/region/ComponentRemovedOnMoveEvent';
import { ComponentTextUpdatedEvent } from '../../page/region/ComponentTextUpdatedEvent';
import { ComponentType } from '../../page/region/ComponentType';
import { type ComponentUpdatedEvent } from '../../page/region/ComponentUpdatedEvent';
import { ContentId } from '../../content/ContentId';
import { PageEventsManager } from '../PageEventsManager';
import { PageNavigationEvent } from '../PageNavigationEvent';
import { PageNavigationEventData, PageNavigationEventSource } from '../PageNavigationEventData';
import { PageNavigationEventType } from '../PageNavigationEventType';
import { type PageNavigationHandler } from '../PageNavigationHandler';
import { PageNavigationMediator } from '../PageNavigationMediator';
import { PageState } from './PageState';
import { type PageUpdatedEvent } from '../../page/event/PageUpdatedEvent';
import { PageControllerCustomizedEvent } from '../../page/event/PageControllerCustomizedEvent';
import { SessionStorageHelper } from '../../util/SessionStorageHelper';
import { getActiveProject } from '../../../v6/entities/project/activeProject.store';
import { type LiveEditModel } from '../../../page-editor/LiveEditModel';
import { LiveEditParams } from '../../../page-editor/LiveEditParams';
import { PageLockedEvent } from '../../../page-editor/event/outgoing/manipulation/PageLockedEvent';
import { PageUnlockedEvent } from '../../../page-editor/event/outgoing/manipulation/PageUnlockedEvent';
import { LiveEditPageViewReadyEvent } from '../../../page-editor/event/LiveEditPageViewReadyEvent';
import { LiveEditPageInitializationErrorEvent } from '../../../page-editor/event/LiveEditPageInitializationErrorEvent';
import { IFrameEl } from '@enonic/lib-admin-ui/dom/IFrameEl';
import { DragMask } from '@enonic/lib-admin-ui/ui/mask/DragMask';
import { WindowDOM } from '@enonic/lib-admin-ui/dom/WindowDOM';
import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { ContentUrlHelper } from '../../util/ContentUrlHelper';
import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { type WizardExtensionRenderingHandler } from '../WizardExtensionRenderingHandler';
import { setLiveEditDraggableHost } from './LiveEditDraggableHost';
import { type PortalComponentType } from '../../../v6/widgets/inspectors/model/page-editor/drag';

// This class is responsible for communication between the live edit iframe and the main iframe
export class LiveEditPageProxy implements PageNavigationHandler {
    private liveEditModel?: LiveEditModel;

    private liveEditIFrame?: IFrameEl;

    private bus?: HostBus;

    private busCleanups: (() => void)[] = [];

    private isFrameLoaded: boolean = false;

    private dragMask: DragMask;

    private static debug: boolean = false;

    private modifyPermissions: boolean;

    private isPageLocked: boolean;

    private isContentRenderable: boolean = false;

    constructor(model: LiveEditModel) {
        this.setModel(model);

        this.initElements();
        this.initListeners();
    }

    private initListeners(): void {
        PageNavigationMediator.get().addPageNavigationHandler(this);

        setLiveEditDraggableHost({
            createDraggable: (kind: PortalComponentType) => this.createDraggable({ type: kind }),
            destroyDraggable: (kind: PortalComponentType) => this.destroyDraggable({ type: kind }),
            setDraggableVisible: (kind: PortalComponentType, visible: boolean) =>
                this.setDraggableVisible({ type: kind }, visible),
        });

        WindowDOM.get().onUnload(() => {
            const contentId = this.liveEditModel.getContent().getContentId().toString();
            SessionStorageHelper.removeSelectedPathInStorage(contentId);
            SessionStorageHelper.removeSelectedTextCursorPosInStorage(contentId);
        });

        this.listenToMainFrameEvents();
    }

    private createLiveEditIFrame(): IFrameEl {
        const liveEditIFrame = new IFrameEl('live-edit-frame');

        // The editor posts the protocol `editor-loaded` once it has booted. The
        // host bus must already be listening, so it is (re)created on every
        // native iframe load, before the editor announces itself.
        liveEditIFrame.onLoaded(() => {
            this.connect();
        });

        return liveEditIFrame;
    }

    private connect(): void {
        this.disconnect();

        const liveEditWindow = (this.liveEditIFrame.getHTMLElement() as HTMLIFrameElement).contentWindow;

        // NB: iframe may be served from another origin.
        if (!liveEditWindow) {
            this.isFrameLoaded = false;
            return;
        }

        this.bus = createHostBus({ remote: liveEditWindow, remoteOrigin: this.resolveRemoteOrigin() });

        this.busCleanups.push(this.bus.on('editor-loaded', () => this.handleIFrameLoadedEvent()));
        this.listenToPage();
    }

    private disconnect(): void {
        this.busCleanups.forEach((cleanup) => cleanup());
        this.busCleanups = [];
        this.bus?.destroy();
        this.bus = undefined;
    }

    private resolveRemoteOrigin(): string {
        const src = (this.liveEditIFrame.getHTMLElement() as HTMLIFrameElement).src;

        if (src) {
            return new URL(src, window.location.href).origin;
        }

        return window.location.origin;
    }

    public setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;

        if (this.isFrameLoaded) {
            this.bus?.post('set-modify-allowed', { allowed: modifyPermissions });
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
            this.bus?.post('create-or-destroy-draggable', { kind: data.type as InsertableComponentKind, create: true });
        }
    }

    public destroyDraggable(data: { type: string }) {
        if (this.isFrameLoaded) {
            this.bus?.post('create-or-destroy-draggable', {
                kind: data.type as InsertableComponentKind,
                create: false,
            });
        }
    }

    public setDraggableVisible(data: { type: string }, visible: boolean) {
        if (this.isFrameLoaded) {
            this.bus?.post('set-draggable-visible', { kind: data.type as InsertableComponentKind, visible });
        }
    }

    public getDragMask(): DragMask {
        return this.dragMask;
    }

    public remove() {
        this.dragMask.remove();
    }

    public load(widgetRenderingHelper: WizardExtensionRenderingHandler, viewWidget: Extension): Promise<boolean> {
        PageEventsManager.get().notifyBeforeLoad();

        // load the page
        return widgetRenderingHelper.render(this.liveEditModel.getContent(), viewWidget).then((isRenderable) => {
            this.isContentRenderable = !!isRenderable;
            return isRenderable;
        });
    }

    public unload(): void {
        this.liveEditIFrame?.getEl().removeAttribute('src');
        this.isPageLocked = false;
        this.isContentRenderable = false;

        if (this.isFrameLoaded) {
            this.disconnect();
            this.isFrameLoaded = false;
        }
    }

    public skipNextReloadConfirmation(skip: boolean) {
        if (this.isFrameLoaded) {
            this.bus?.post('skip-reload-confirmation', { skip });
        }
    }

    private handleIFrameLoadedEvent() {
        if (LiveEditPageProxy.debug) {
            console.debug('LiveEditPageProxy.handleIframeLoadedEvent at ' + new Date().toISOString());
        }

        this.isFrameLoaded = true;
        this.isPageLocked = false;

        if (this.isLiveEditAllowed()) {
            if (LiveEditPageProxy.debug) {
                console.debug(
                    'LiveEditPageProxy.handleIframeLoadedEvent: initialize live edit at ' + new Date().toISOString(),
                );
            }

            this.bus?.post('initialize', this.createInitializePayload());
        } else {
            if (LiveEditPageProxy.debug) {
                console.debug(
                    'LiveEditPageProxy.handleIframeLoadedEvent: notify live edit ready at ' + new Date().toISOString(),
                );
            }

            PageEventsManager.get().notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
        }

        // Notify loaded no matter the result
        PageEventsManager.get().notifyLoaded();
    }

    private createInitializePayload(): InitializePayload {
        const locale = CONFIG.getLocale();
        const projectName = getActiveProject()?.getName();

        return {
            params: {
                ...LiveEditParams.fromLiveEditModel(
                    this.liveEditModel,
                    this.resolveApplicationKeys(),
                    this.modifyPermissions,
                ),
            },
            page: PageState.getState()?.toJson() ?? undefined,
            phrases: this.resolvePhrases(),
            ...(locale ? { locale } : {}),
            content: this.resolveContentInfo(),
            ...(projectName ? { project: { name: projectName } } : {}),
            hostDomain: `${window.location.protocol}//${window.location.host}`,
        };
    }

    private resolveContentInfo(): ContentInfo {
        const summary = this.liveEditModel.getContentSummaryAndCompareStatus();

        const content: ContentInfo = { id: summary.getId() };

        const path = summary.getPath()?.toString();
        if (path != null) {
            content.path = path;
        }

        const displayName = summary.getDisplayName();
        if (displayName != null) {
            content.displayName = displayName;
        }

        const type = summary.getType()?.toString();
        if (type != null) {
            content.type = type;
        }

        const language = summary.getLanguage();
        if (language != null) {
            content.language = language;
        }

        return content;
    }

    private resolvePhrases(): Record<string, string> {
        try {
            return JSON.parse(CONFIG.getString('phrasesAsJson')) as Record<string, string>;
        } catch (e) {
            return {};
        }
    }

    private resolveApplicationKeys(): string[] {
        // if is site or within site then get application keys from site
        if (this.liveEditModel.getSiteModel()?.getSite()) {
            return (
                this.liveEditModel
                    .getSiteModel()
                    .getSite()
                    .getApplicationKeys()
                    .map((key) => key.toString()) || []
            );
        }

        // if is root non-site content then get application keys from project, e.g. headless content items
        return (
            getActiveProject()
                ?.getSiteConfigs()
                ?.map((config) => config.getApplicationKey().toString()) || []
        );
    }

    isLocked(): boolean {
        return this.isPageLocked;
    }

    setLocked(locked: boolean): void {
        if (this.isFrameLoaded) {
            this.bus?.post('set-page-lock-state', { locked });
        }
    }

    public loadComponent(path: ComponentPath, isExisting = false): void {
        this.bus?.post('load-component', { path: path.toString(), existing: isExisting });
    }

    public listenToPage() {
        const eventsManager: PageEventsManager = PageEventsManager.get();
        const bus = this.bus;

        if (!bus) {
            return;
        }

        const cleanups = this.busCleanups;

        cleanups.push(
            bus.on('drag-started', (payload) => {
                eventsManager.notifyComponentDragStarted(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('drag-stopped', (payload) => {
                eventsManager.notifyComponentDragStopped(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('drag-canceled', (payload) => {
                eventsManager.notifyComponentViewDragCanceled(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('drag-dropped', (payload) => {
                eventsManager.notifyComponentViewDragDropped(
                    ComponentPath.fromString(payload.from),
                    ComponentPath.fromString(payload.to),
                );
            }),
        );

        cleanups.push(
            bus.on('page-locked', () => {
                this.isPageLocked = true;
                eventsManager.notifyPageLocked(new PageLockedEvent());
            }),
        );

        cleanups.push(
            bus.on('page-unlocked', () => {
                this.isPageLocked = false;
                eventsManager.notifyPageUnlocked(new PageUnlockedEvent());
            }),
        );

        cleanups.push(
            bus.on('component-selected', (payload) => {
                const path: ComponentPath = ComponentPath.fromString(payload.path);
                const eventData = new PageNavigationEventData(path, PageNavigationEventSource.EDITOR);

                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(PageNavigationEventType.SELECT, eventData),
                    this,
                );
            }),
        );

        cleanups.push(
            bus.on('component-deselected', () => {
                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(
                        PageNavigationEventType.DESELECT,
                        new PageNavigationEventData(undefined, PageNavigationEventSource.EDITOR),
                    ),
                    this,
                );
            }),
        );

        cleanups.push(
            bus.on('component-inspect-requested', (payload) => {
                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(
                        PageNavigationEventType.INSPECT,
                        new PageNavigationEventData(ComponentPath.fromString(payload.path)),
                    ),
                );
            }),
        );

        cleanups.push(
            bus.on('component-loaded', (payload) => {
                eventsManager.notifyComponentLoaded(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('ready', () => {
                eventsManager.notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
            }),
        );

        cleanups.push(
            bus.on('init-error', (payload) => {
                eventsManager.notifyLiveEditPageInitializationError(
                    new LiveEditPageInitializationErrorEvent(payload.message),
                );
            }),
        );

        cleanups.push(
            bus.on('save-as-template-requested', () => {
                eventsManager.notifyPageSaveAsTemplate();
            }),
        );

        cleanups.push(
            bus.on('create-fragment-requested', (payload) => {
                PageEventsManager.get().notifyComponentCreateFragmentRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('page-reset-requested', () => {
                PageEventsManager.get().notifyPageResetRequested();
            }),
        );

        cleanups.push(
            bus.on('add-component-requested', (payload) => {
                const path: ComponentPath = ComponentPath.fromString(payload.path);
                const type: ComponentType = ComponentType.byShortName(payload.kind);

                // if an item is added on a locked non-customized page, we need to customize it first, and then add a new item
                if (this.isPageLocked) {
                    // in future might perform some validation here, access rights check etc
                    this.addItemOnPageCustomized(path, type);
                    PageEventsManager.get().notifyCustomizePageRequested();
                } else {
                    PageEventsManager.get().notifyComponentAddRequested(path, type);
                }
            }),
        );

        cleanups.push(
            bus.on('remove-component-requested', (payload) => {
                PageEventsManager.get().notifyComponentRemoveRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('component-load-failed', (payload) => {
                PageEventsManager.get().notifyComponentLoadFailed(
                    ComponentPath.fromString(payload.path),
                    new Error(payload.message),
                );
            }),
        );

        cleanups.push(
            bus.on('duplicate-component-requested', (payload) => {
                PageEventsManager.get().notifyComponentDuplicateRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('text-edit-requested', (payload) => {
                PageEventsManager.get().notifyTextComponentEditRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('move-component-requested', (payload) => {
                PageEventsManager.get().notifyComponentMoveRequested(
                    ComponentPath.fromString(payload.from),
                    ComponentPath.fromString(payload.to),
                );
            }),
        );

        cleanups.push(
            bus.on('detach-fragment-requested', (payload) => {
                PageEventsManager.get().notifyComponentDetachFragmentRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('reset-component-requested', (payload) => {
                PageEventsManager.get().notifyComponentResetRequested(ComponentPath.fromString(payload.path));
            }),
        );

        cleanups.push(
            bus.on('edit-content-requested', (payload) => {
                ContentUrlHelper.openEditContentTab(new ContentId(payload.contentId));
            }),
        );

        cleanups.push(
            bus.on('page-reload-requested', () => {
                PageEventsManager.get().notifyPageReloadRequested();
            }),
        );

        // Simulate iframe keyboard event to allow shortcuts work when iframe is focused.
        // The payload carries legacy keyCode/charCode for jquery-simulate.
        cleanups.push(
            bus.on('keyboard-relay', (payload) => {
                $(document).simulate(payload.type, payload.init);
            }),
        );
    }

    private listenToMainFrameEvents() {
        PageState.getEvents().onComponentAdded((event: ComponentAddedEvent): void => {
            if (this.isFrameLoaded) {
                if (event instanceof ComponentDuplicatedEvent) {
                    this.bus?.post('duplicate-component', { path: event.getPath().toString() });
                } else if (event instanceof ComponentMovedEvent) {
                    this.bus?.post('move-component', {
                        from: event.getFrom().toString(),
                        to: event.getTo().toString(),
                    });
                } else {
                    this.bus?.post('add-component', {
                        path: event.getPath().toString(),
                        kind: event.getComponent().getType().getShortName() as InsertableComponentKind,
                    });
                }

                this.postPageState();
            }
        });

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            if (this.isFrameLoaded) {
                if (event instanceof ComponentRemovedOnMoveEvent) {
                    // do nothing since component is being moved
                } else {
                    this.bus?.post('remove-component', { path: event.getPath().toString() });
                    this.postPageState();
                }
            }
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            this.postPageState();

            if (event instanceof ComponentTextUpdatedEvent && event.getText() != null) {
                if (this.isFrameLoaded) {
                    this.bus?.post('update-text-component', {
                        path: event.getPath().toString(),
                        text: event.getText(),
                        origin: event.getOrigin(),
                    });
                }
            }
        });

        BeforeContentSavedEvent.on(() => {
            // The editor no longer clears its stored cursor position on save
            // (selection persistence is continuous), so the host clears it here.
            const contentId = this.liveEditModel?.getContent()?.getContentId()?.toString();
            SessionStorageHelper.removeSelectedTextCursorPosInStorage(contentId);
        });

        PageEventsManager.get().onSetComponentState((path: ComponentPath, processing: boolean) => {
            if (this.isFrameLoaded) {
                this.bus?.post('set-component-state', { path: path.toString(), processing });
            }
        });
    }

    private postPageState(): void {
        if (this.isFrameLoaded) {
            this.bus?.post('page-state', { page: PageState.getState()?.toJson() ?? undefined });
        }
    }

    resetComponent(path: ComponentPath): void {
        if (this.isFrameLoaded) {
            this.bus?.post('reset-component', { path: path.toString() });
        }
    }

    handle(event: PageNavigationEvent): void {
        // Selection-bounce guard: navigation that originated in the editor must
        // not be posted back into the iframe. The editor selects a component and
        // notifies SELECT (source=EDITOR); the host tree view reacts and may
        // re-notify SELECT/DESELECT, which would otherwise echo a deselect into
        // the iframe and kill the fresh editor selection.
        if (event.getData().getSource() === PageNavigationEventSource.EDITOR) {
            return;
        }

        if (event.getType() === PageNavigationEventType.SELECT) {
            const path = event.getData().getPath()?.toString();
            if (path != null) {
                this.bus?.post('select-component', { path });
            }
            return;
        }

        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.bus?.post('deselect-component', { path: event.getData().getPath()?.toString() });
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
        // content rendered without controller or template (e.g. via controller mapping)
        // gets live edit initialized in the locked mode

        return this.liveEditModel
            ? this.liveEditModel.getContent().isPageTemplate() ||
                  PageState.getState()?.hasController() ||
                  this.liveEditModel.getContent().getType().isFragment() ||
                  this.liveEditModel.getDefaultModels()?.hasDefaultPageTemplate() ||
                  this.isContentRenderable
            : false;
    }

    private initElements() {
        this.liveEditIFrame = this.createLiveEditIFrame();
        this.dragMask = new DragMask(this.liveEditIFrame);
    }
}
