import {ComponentPath} from '../../page/region/ComponentPath';
import {type ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {ComponentRemovedOnMoveEvent} from '../../page/region/ComponentRemovedOnMoveEvent';
import {ComponentTextUpdatedEvent} from '../../page/region/ComponentTextUpdatedEvent';
import {ComponentType} from '../../page/region/ComponentType';
import {type ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {ContentId} from '../../content/ContentId';
import {DescriptorKey} from '../../page/DescriptorKey';
import {PageControllerCustomizedEvent} from '../../page/event/PageControllerCustomizedEvent';
import {PageEventsManager} from '../PageEventsManager';
import {PageNavigationEvent} from '../PageNavigationEvent';
import {PageNavigationEventData, PageNavigationEventSource} from '../PageNavigationEventData';
import {PageNavigationEventType} from '../PageNavigationEventType';
import {type PageNavigationHandler} from '../PageNavigationHandler';
import {PageNavigationMediator} from '../PageNavigationMediator';
import {PageState} from './PageState';
import {type PageUpdatedEvent} from '../../page/event/PageUpdatedEvent';
import {ProjectContext} from '../../project/ProjectContext';
import {SessionStorageHelper} from '../../util/SessionStorageHelper';
import {PageHelper} from '../../util/PageHelper';
import {type LiveEditModel} from '../../../page-editor/LiveEditModel';
import {LiveEditPageViewReadyEvent} from '../../../page-editor/event/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/event/LiveEditPageInitializationErrorEvent';
import {PageLockedEvent} from '../../../page-editor/event/outgoing/manipulation/PageLockedEvent';
import {PageUnlockedEvent} from '../../../page-editor/event/outgoing/manipulation/PageUnlockedEvent';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DragMask} from '@enonic/lib-admin-ui/ui/mask/DragMask';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentUrlHelper} from '../../util/ContentUrlHelper';
import {HTMLAreaHelper} from '../../inputtype/ui/text/HTMLAreaHelper';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {type WizardExtensionRenderingHandler} from '../WizardExtensionRenderingHandler';
import {isRoot, type ComponentPath as PEComponentPath, type OutgoingMessage, type PageConfig, type PageController} from '@enonic/page-editor';
import {postToIframe, setIframeElement, subscribeToIframe} from './iframeChannel';
import {pageStateToDescriptor} from './pageStateToDescriptor';
import {GetPageDescriptorsByApplicationsRequest} from './contextwindow/inspect/page/GetPageDescriptorsByApplicationsRequest';
import {$app, getResolvedTheme} from '../../../v6/features/store/app.store';

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

    private isPageReady: boolean = false;

    // ? True once `init` has been dispatched for the current iframe generation. Does NOT
    // ? gate outbound messages (the iframe adapter's pre-init queue handles ordering).
    // ? Kept for diagnostics and to prevent a double `init` if `ready` is re-emitted.
    private isInitSent: boolean = false;

    private pendingSelect?: {path: PEComponentPath; isInspect: boolean};

    // ? Incremented each time the iframe loads; used to discard responses from a previous iframe.
    private iframeGeneration: number = 0;

    private unsubscribeIframe?: () => void;

    private pageStatePushScheduled: boolean = false;

    // ! G3: `drag-dropped` and `drag-stopped` can both fire for a single drag session
    // ! (drop emits dropped; cancel emits stopped). Without state tracking, a successful
    // ! drop that also emits a trailing stopped notifies the parent draggable twice.
    private dragActive: boolean = false;

    // ! I8: v2's keyboard.ts forwards every EDITOR_COMBO as a `keyboard-event` in
    // ! addition to firing the semantic message (e.g. Delete → `remove` + `keyboard-event`).
    // ! CS's `KeyBindings` document listener on `del` would then double-fire. Suppress the
    // ! next keyboard-event for these keyCodes when v2 already acted on the same keypress.
    private suppressKeyboardEventCodes = new Set<number>();

    private static readonly DELETE_KEY_CODE = 46;

    private static readonly BACKSPACE_KEY_CODE = 8;

    private lastPushedTheme?: 'light' | 'dark';

    private unsubscribeTheme?: () => void;

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

        // ! Subscribe once at construction: v2 sends `ready` synchronously at the end of
        // ! initPageEditor, which can dispatch before the parent's `iframe.onload` task runs.
        // ! Attaching on load would race and drop `ready`, hanging the editor boot.
        this.listenToLivePageEvents();

        this.subscribeToThemeChanges();
    }

    // ! `init` carries the current theme, but CS lets the user switch theme mid-session
    // ! (Light/Dark/System via cycleTheme). Without this subscription the iframe stays
    // ! on the boot-time theme forever. `listen` (vs `subscribe`) skips the initial call,
    // ! so the redundant push on init is avoided.
    private subscribeToThemeChanges(): void {
        this.unsubscribeTheme = $app.listen(() => this.pushThemeIfChanged());
    }

    private pushThemeIfChanged(): void {
        const theme = getResolvedTheme();
        if (theme === this.lastPushedTheme) return;
        this.lastPushedTheme = theme;
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'set-theme', theme});
    }

    private createLiveEditIFrame(): IFrameEl {
        const liveEditIFrame = new IFrameEl('live-edit-frame');
        const iframeEl = liveEditIFrame.getHTMLElement() as HTMLIFrameElement;

        // ? Register the iframe element (not its contentWindow) up front so the message
        // ? listener resolves `contentWindow` lazily and matches even if `ready` arrives
        // ? before the parent's `load` task runs.
        setIframeElement(iframeEl);

        iframeEl.addEventListener('load', () => this.handleIFrameLoadedEvent());
        return liveEditIFrame;
    }

    public setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;
        // ? No `isInitSent` gate: the iframe adapter queues post-load, pre-init messages
        // ? and flushes them once `init` is dispatched. Gating here silently dropped
        // ? mutations whenever LiveFormPanel mounted before `ready` landed.
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'set-modify-allowed', allowed: modifyPermissions});
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

    public createDraggable(data: {type: string}): void {
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'create-draggable', componentType: data.type});
        // ! v2's session starts with visible=false and its mousemove/mouseup guards
        // ! early-return until a `set-draggable-visible` flips it on. Without this,
        // ! the first entry into the iframe shows no placeholder and accepts no drop.
        postToIframe({type: 'set-draggable-visible', visible: true});
    }

    public destroyDraggable(_data: {type: string}): void {
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'destroy-draggable'});
    }

    public setDraggableVisible(_data: {type: string}, visible: boolean): void {
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'set-draggable-visible', visible});
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
        return widgetRenderingHelper.render(this.liveEditModel.getContent(), viewWidget);
    }

    public unload(): void {
        this.liveEditIFrame?.getEl().removeAttribute('src');
        this.isPageLocked = false;
        this.isFrameLoaded = false;
        this.isPageReady = false;
        this.isInitSent = false;
    }

    private handleIFrameLoadedEvent(): void {
        const iframeEl = this.liveEditIFrame.getHTMLElement() as HTMLIFrameElement;
        setIframeElement(iframeEl, this.resolveIframeOrigin(iframeEl));
        this.isFrameLoaded = true;
        this.isPageLocked = false;
        this.isPageReady = false;
        this.isInitSent = false;
        this.iframeGeneration += 1;

        PageEventsManager.get().notifyLoaded();
    }

    private resolveIframeOrigin(iframeEl: HTMLIFrameElement): string | undefined {
        const src = iframeEl.src;
        if (!src) return window.location.origin;
        try {
            return new URL(src, window.location.href).origin;
        } catch {
            return undefined;
        }
    }

    private handleChannelReady(): void {
        // ! Always dispatch `init` even when live-edit is denied: the iframe adapter
        // ! queues every post-load message and only flushes on `init`. Without this,
        // ! messages sent during the denied window (e.g. `setModifyPermissions`) leak
        // ! in the iframe queue forever and subsequent `hasController()` transitions
        // ! can't re-enter because this method only fires on iframe `ready`.
        const allowed = this.isLiveEditAllowed();
        const config = this.buildPageConfig();
        postToIframe({type: 'init', config});
        this.isInitSent = true;
        // ? `init` just carried the theme; remember it so a subsequent `listen` callback
        // ? (triggered by unrelated $app key changes) does not echo the same value.
        this.lastPushedTheme = config.theme;

        if (!allowed) {
            // ? Denied pages render a locked placeholder; the iframe still emits
            // ? `page-ready`, but notify here defensively in case it does not.
            PageEventsManager.get().notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
            return;
        }

        postToIframe({type: 'page-state', page: pageStateToDescriptor(PageState.getState())});
        void this.sendPageControllers();
    }

    private buildPageConfig(): PageConfig {
        const content = this.liveEditModel.getContent();
        const state = PageState.getState();
        const isPageTemplate = content.isPageTemplate();
        const isFragment = content.getType().isFragment();
        const hasController = state?.hasController() ?? false;

        return {
            contentId: content.getId(),
            pageName: content.getDisplayName(),
            pageIconClass: PageHelper.getPageIconClass(state),
            locked: this.computePageLocked(),
            modifyPermissions: this.modifyPermissions,
            pageEmpty: isPageTemplate && !hasController,
            pageTemplate: isPageTemplate,
            fragment: isFragment,
            fragmentAllowed: this.liveEditModel.isFragmentAllowed(),
            resetEnabled: hasController,
            phrases: this.getPhrasesForEditor(),
            theme: this.getCurrentTheme(),
            langDirection: this.getLangDirection(content.getLanguage()),
        };
    }

    // ? Locked = content has no live-edit surface: not a template, no controller, not a
    // ? fragment. Derived from PageState on demand so callers never see a stale flag
    // ? (the `isPageLocked` field is a notification cache, not the source of truth).
    private computePageLocked(): boolean {
        const content = this.liveEditModel?.getContent();
        if (content == null) return true;
        if (content.isPageTemplate() || content.getType().isFragment()) return false;
        return !(PageState.getState()?.hasController() ?? false);
    }

    // ! Legacy fired `PageLockedEvent`/`PageUnlockedEvent` from the iframe; v2 does not.
    // ! Without a state→event bridge, `$pageEditorLifecycle.isPageLocked`, the save-as-
    // ! template action, and the context window chrome all stay at init-time values when
    // ! the user picks a controller or resets the page. Routing through `setLocked` keeps
    // ! one notification source (the edge-detect in setLocked debounces idempotent calls).
    private syncDerivedLock(): void {
        this.setLocked(this.computePageLocked());
    }

    private async sendPageControllers(): Promise<void> {
        const generation = this.iframeGeneration;
        try {
            const keys = this.resolveApplicationKeys().map(k => ApplicationKey.fromString(k));
            const descriptors = await new GetPageDescriptorsByApplicationsRequest(keys).sendAndParse();
            // ! Discard response if the iframe swapped while the request was in flight —
            // ! a stale controller list would otherwise land on the newly-loaded iframe.
            if (generation !== this.iframeGeneration || !this.isFrameLoaded) return;
            const controllers: PageController[] = descriptors.map(d => ({
                descriptorKey: d.getKey().toString(),
                displayName: d.getDisplayName(),
                iconClass: d.getIconCls(),
            }));
            postToIframe({type: 'page-controllers', controllers});
        } catch (err) {
            if (generation !== this.iframeGeneration) return;
            const message = err instanceof Error ? err.message : String(err);
            PageEventsManager.get().notifyLiveEditPageInitializationError(
                new LiveEditPageInitializationErrorEvent(`Failed to load page controllers: ${message}`),
            );
        }
    }

    private getPhrasesForEditor(): Record<string, string> {
        const keys = [
            'field.page', 'field.region', 'field.text', 'field.part', 'field.layout', 'field.fragment',
            'field.pageController', 'field.pageController.empty', 'field.pageController.placeholder',
            'field.region.empty',
            'field.drag.release', 'field.drag.notAllowed', 'field.drag.self',
            'field.drag.layoutNested', 'field.drag.fragmentLayout', 'field.drag.cellOccupied',
            'field.component.renderError',
            'action.insert', 'action.inspect', 'action.reset', 'action.remove', 'action.duplicate',
            'action.edit', 'action.selectParent', 'action.createFragment', 'action.detachFragment',
            'action.saveAsTemplate', 'action.pageSettings',
        ];
        const out: Record<string, string> = {};
        for (const key of keys) {
            const value = i18n(key);
            if (value && value !== key) out[key] = value;
        }
        return out;
    }

    private getCurrentTheme(): 'light' | 'dark' {
        // ? Pull from the v6 app store (single source of truth for Light/Dark/System).
        // ? `CONFIG.getString('theme')` is the server-rendered default and does not
        // ? update when the user cycles themes after load.
        return getResolvedTheme();
    }

    private getLangDirection(lang: string | undefined): 'ltr' | 'rtl' {
        return lang != null && Locale.supportsRtl(lang) ? 'rtl' : 'ltr';
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
        // ? Edge-detect: the legacy path was implicitly debounced by the iframe round-trip.
        // ? Without this guard, consumers fire spurious re-notifications on repeated calls.
        if (this.isPageLocked === locked) return;

        this.isPageLocked = locked;
        const mgr = PageEventsManager.get();
        if (locked) {
            mgr.notifyPageLocked(new PageLockedEvent());
        } else {
            mgr.notifyPageUnlocked(new PageUnlockedEvent());
        }
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'set-lock', locked});
    }

    public loadComponent(path: ComponentPath, isExisting = false): void {
        if (!this.isFrameLoaded) return;
        postToIframe({type: 'load', path: path.toString() as PEComponentPath, existing: isExisting});
    }

    public stopListening(): void {
        this.unsubscribeIframe?.();
        this.unsubscribeIframe = undefined;
        this.unsubscribeTheme?.();
        this.unsubscribeTheme = undefined;
    }

    public listenToLivePageEvents(): void {
        const mgr = PageEventsManager.get();

        this.unsubscribeIframe = subscribeToIframe((msg: OutgoingMessage) => {
            switch (msg.type) {
                case 'ready':
                    this.handleChannelReady();
                    return;

                case 'iframe-loaded':
                    // Informational — `iframe.onload` already triggered `handleIFrameLoadedEvent`.
                    return;

                case 'page-ready':
                    this.isPageReady = true;
                    this.flushPendingSelect();
                    mgr.notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
                    return;

                case 'error':
                    mgr.notifyLiveEditPageInitializationError(
                        new LiveEditPageInitializationErrorEvent(`[${msg.phase}] ${msg.message}`),
                    );
                    return;

                case 'select': {
                    const path = ComponentPath.fromString(msg.path);
                    PageNavigationMediator.get().notify(
                        new PageNavigationEvent(
                            PageNavigationEventType.SELECT,
                            new PageNavigationEventData(path, PageNavigationEventSource.EDITOR),
                        ),
                        this,
                    );
                    return;
                }

                case 'deselect':
                    PageNavigationMediator.get().notify(
                        new PageNavigationEvent(PageNavigationEventType.DESELECT, new PageNavigationEventData()),
                        this,
                    );
                    return;

                case 'inspect':
                    // ! Pass `this` as sender so the mediator skips our own handler during
                    // ! fan-out. Without it, `handle()` receives the INSPECT it originated,
                    // ! reifies it into `{type:'select'}` to the iframe, and the iframe
                    // ! re-echoes the selection — a two-bounce echo loop on every inspect.
                    PageNavigationMediator.get().notify(
                        new PageNavigationEvent(
                            PageNavigationEventType.INSPECT,
                            new PageNavigationEventData(ComponentPath.fromString(msg.path)),
                        ),
                        this,
                    );
                    return;

                case 'add':
                    this.handleAddOutgoing(ComponentPath.fromString(msg.path), msg.componentType);
                    return;

                case 'remove':
                    this.suppressNextKeyboardFor(
                        LiveEditPageProxy.DELETE_KEY_CODE,
                        LiveEditPageProxy.BACKSPACE_KEY_CODE,
                    );
                    mgr.notifyComponentRemoveRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'move':
                    mgr.notifyComponentMoveRequested(
                        ComponentPath.fromString(msg.from),
                        ComponentPath.fromString(msg.to),
                    );
                    return;

                case 'drag-dropped':
                    // ! Re-publish current PageState after the iframe's drag ends. The push fired
                    // ! from `move` / `add` (via `listenToMainFrameEvents`) races the iframe's
                    // ! internal `isDragging()` guard in `reconcilePage`; a second idempotent push
                    // ! here lands once drag state has cleared so reconcile actually applies.
                    this.schedulePageStatePush();
                    // ! v2 does not emit `drag-stopped` on successful drop, only on cancel.
                    // ! InsertablesPanel's parent jQuery-UI draggable only releases when this
                    // ! notification fires (triggering `simulate('mouseup')`); without it the
                    // ! parent drag stays stuck after every sidebar-to-iframe drop.
                    this.fireDragStopped(mgr);
                    return;

                case 'drag-started':
                    this.dragActive = true;
                    mgr.notifyComponentDragStarted(msg.path != null ? ComponentPath.fromString(msg.path) : undefined);
                    return;

                case 'drag-stopped':
                    // ! Route through `fireDragStopped` so a `drag-dropped`+`drag-stopped`
                    // ! sequence (some paths emit both) only notifies once per session.
                    this.fireDragStopped(mgr, msg.path != null ? ComponentPath.fromString(msg.path) : undefined);
                    return;

                case 'duplicate':
                    mgr.notifyComponentDuplicateRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'reset':
                    if (isRoot(msg.path)) {
                        mgr.notifyPageResetRequested();
                    } else {
                        mgr.notifyComponentResetRequested(ComponentPath.fromString(msg.path));
                    }
                    return;

                case 'create-fragment':
                    mgr.notifyComponentCreateFragmentRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'detach-fragment':
                    mgr.notifyComponentDetachFragmentRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'edit-text':
                    mgr.notifyTextComponentEditRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'edit-content':
                    ContentUrlHelper.openEditContentTab(new ContentId(msg.contentId));
                    return;

                case 'select-page-descriptor':
                    mgr.notifyPageControllerSetRequested(DescriptorKey.fromString(msg.descriptorKey));
                    return;

                case 'save-as-template':
                    mgr.notifyPageSaveAsTemplate();
                    return;

                case 'page-reload-request':
                    mgr.notifyPageReloadRequested();
                    return;

                case 'component-loaded':
                    mgr.notifyComponentLoaded(ComponentPath.fromString(msg.path));
                    return;

                case 'component-load-failed':
                    mgr.notifyComponentLoadFailed(
                        ComponentPath.fromString(msg.path),
                        new Error(msg.reason),
                    );
                    return;

                case 'keyboard-event':
                    if (this.suppressKeyboardEventCodes.delete(msg.keyCode)) return;
                    this.simulateKeyboardEvent(msg);
                    return;

                case 'navigate':
                    // Edit iframe has no content-preview routing; ContentItemPreviewPanel
                    // owns navigate handling for the preview pane.
                    return;
            }
        });
    }

    private handleAddOutgoing(path: ComponentPath, componentType: string): void {
        const type = ComponentType.byShortName(componentType);

        // ! Derive on demand: the iframe never emits PageLockedEvent/PageUnlockedEvent in
        // ! v2, so `isPageLocked` only tracks init-time state. A `hasController()`
        // ! transition mid-session would otherwise route unlocked adds through the
        // ! customize branch.
        if (this.computePageLocked()) {
            this.addItemOnPageCustomized(path, type);
            PageEventsManager.get().notifyCustomizePageRequested();
        } else {
            PageEventsManager.get().notifyComponentAddRequested(path, type);
        }
    }

    private listenToMainFrameEvents(): void {
        PageState.getEvents().onComponentAdded(() => this.schedulePageStatePush());

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            if (event instanceof ComponentRemovedOnMoveEvent) return;
            this.schedulePageStatePush();
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            // ! Text updates have their own dedicated `update-text-component` path that
            // ! targets a single element innerHTML. A full page-state reconcile on the
            // ! same keystroke doubles work and can tear selection/caret state inside
            // ! the iframe's contenteditable.
            if (event instanceof ComponentTextUpdatedEvent) {
                this.pushTextUpdate(event);
                return;
            }
            this.schedulePageStatePush();
        });

        // ! Config edits mutate PageState but never fire component* events; without this
        // ! subscription the iframe never re-renders and the "edits lost until save"
        // ! symptom is permanent. Push page-state so the iframe reconciles on config change.
        PageState.getEvents().onPageConfigUpdated(() => this.schedulePageStatePush());

        // ! Controller/template/customize transitions reshape PageState at the root.
        // ! ContentWizardPanel handles Controller/Template via saveChanges → loadPage,
        // ! which cleanly replaces the iframe. Pushing page-state beforehand fans out
        // ! `load(existing:true)` requests against the pre-reload DOM (spec I3) — skip
        // ! the push and let the reload re-init everything. Customize is the exception:
        // ! it never saves/reloads, just flips the lock, so the iframe needs the new
        // ! descriptor tree delivered explicitly.
        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            if (event instanceof PageControllerCustomizedEvent) {
                this.schedulePageStatePush();
            }
            this.syncDerivedLock();
        });

        // ! Page reset nulls PageState without firing onComponentRemoved per path. Push an
        // ! empty descriptor snapshot so the iframe drops its tracked components. The
        // ! subsequent saveChanges → loadPage in ContentWizardPanel replaces the iframe
        // ! src, but this intermediate push prevents stale descriptors until that lands.
        PageState.getEvents().onPageReset(() => {
            this.schedulePageStatePush();
            this.syncDerivedLock();
        });

        PageEventsManager.get().onSetComponentState((path: ComponentPath, processing: boolean) => {
            if (!this.isFrameLoaded) return;
            postToIframe({type: 'set-component-state', path: path.toString() as PEComponentPath, processing});
        });
    }

    // ? Microtask-coalesce page-state pushes — bulk mutations (e.g. reset + re-add)
    // ? otherwise send N descriptor maps per frame and can cause intermediate reconcile
    // ? states that flicker selection.
    // ? Intentionally NOT gated on `isInitSent`: the iframe adapter queues pre-init messages
    // ? (see npm-page-editor/src/transport/adapter.ts handleMessage queue), so a push that
    // ? arrives before `init` is dispatched in order once init lands. Gating on `isInitSent`
    // ? silently dropped mutations whenever ready/init raced the user's first interaction.
    private schedulePageStatePush(): void {
        if (!this.isFrameLoaded || this.pageStatePushScheduled) return;
        this.pageStatePushScheduled = true;
        // ! Capture generation at schedule time: if the iframe reloads between this tick
        // ! and the microtask, the push would land on the new contentWindow carrying stale
        // ! descriptors from before the reload. Discarding is safer — the new iframe's
        // ! `handleChannelReady` re-sends a fresh page-state after `init`.
        const generation = this.iframeGeneration;
        queueMicrotask(() => {
            this.pageStatePushScheduled = false;
            if (!this.isFrameLoaded || generation !== this.iframeGeneration) return;
            postToIframe({type: 'page-state', page: pageStateToDescriptor(PageState.getState())});
        });
    }

    private simulateKeyboardEvent(msg: Extract<OutgoingMessage, {type: 'keyboard-event'}>): void {
        const {eventType, keyCode, modifiers} = msg;
        $(document).simulate(eventType, {
            bubbles: true,
            cancelable: true,
            ctrlKey: modifiers.ctrl,
            altKey: modifiers.alt,
            shiftKey: modifiers.shift,
            metaKey: modifiers.meta,
            keyCode,
            charCode: 0,
        });
    }

    private pushTextUpdate(event: ComponentTextUpdatedEvent): void {
        if (!this.isFrameLoaded) return;
        // ? Skip 'live' origin to guard against echo if a legacy in-iframe editor is still wired up.
        if (event.getOrigin() === 'live') return;

        const contentId = this.liveEditModel.getContent().getId();
        const previewHtml = HTMLAreaHelper.convertRenderSrcToPreviewSrc(
            event.getText(),
            contentId,
            ProjectContext.get().getProject(),
        );

        postToIframe({
            type: 'update-text-component',
            path: event.getPath().toString() as PEComponentPath,
            html: previewHtml,
        });
    }

    resetComponent(_path: ComponentPath): void {
        // No-op: reset is driven entirely by CS mutating `PageState` parent-side;
        // the `pushPageState` subscription reflects the new descriptor map to the iframe.
    }

    handle(event: PageNavigationEvent): void {
        if (!this.isFrameLoaded) return;
        const type = event.getType();
        const path = event.getData().getPath();

        // INSPECT is the component-tree's click signal; mirror it as a selection in the iframe
        // so the overlay highlights the same component. v2 exposes a single selection concept.
        if ((type === PageNavigationEventType.SELECT || type === PageNavigationEventType.INSPECT) && path != null) {
            // ! v2 restores its own selection before emitting `page-ready`. Firing earlier would
            // ! race the restore and cause a double-select flicker at boot.
            if (!this.isPageReady) {
                // ! Preserve the SELECT vs INSPECT distinction across the pre-ready window —
                // ! a components-tree INSPECT before boot otherwise collapses into a plain
                // ! SELECT on flush, dropping the "open inspect panel" intent.
                this.pendingSelect = {
                    path: path.toString() as PEComponentPath,
                    isInspect: type === PageNavigationEventType.INSPECT,
                };
                return;
            }
            postToIframe({type: 'select', path: path.toString() as PEComponentPath, silent: false});
            return;
        }
        if (type === PageNavigationEventType.DESELECT) {
            this.pendingSelect = undefined;
            postToIframe({type: 'deselect', path: path?.toString() as PEComponentPath | undefined});
            return;
        }
    }

    private fireDragStopped(mgr: PageEventsManager, path?: ComponentPath): void {
        if (!this.dragActive) return;
        this.dragActive = false;
        mgr.notifyComponentDragStopped(path);
    }

    // ! The iframe emits the semantic message (e.g. `remove`) and the raw `keyboard-event`
    // ! in the same tick for a single keypress. Marking the codes here lets the next
    // ! matching `keyboard-event` skip simulation; the set auto-clears on consumption.
    // ! A microtask clears unmatched codes to prevent stale suppression if the iframe
    // ! ever fires `remove` without a follow-up keyboard-event.
    private suppressNextKeyboardFor(...keyCodes: number[]): void {
        for (const code of keyCodes) this.suppressKeyboardEventCodes.add(code);
        const snapshot = keyCodes;
        queueMicrotask(() => {
            for (const code of snapshot) this.suppressKeyboardEventCodes.delete(code);
        });
    }

    private flushPendingSelect(): void {
        const pending = this.pendingSelect;
        this.pendingSelect = undefined;
        if (pending == null) return;
        // ? InspectPanel handled the INSPECT navigation at notify-time — only the iframe
        // ? highlight needs replaying. `isInspect` is preserved on the pending record so
        // ? that a future protocol revision (spec I7: `openInspect` on `select`) can
        // ? forward the panel-open intent without retouching the pre-ready buffer.
        postToIframe({type: 'select', path: pending.path, silent: false});
    }

    // ! Customize is user-cancelable (confirmation dialog). Without a cleanup path the
    // ! one-shot PageUpdated listener accumulates silently: every `add` on a locked page
    // ! that the user cancels leaves a dead subscription. A 30s timeout bounds the leak
    // ! window and matches typical customize-dialog dwell time.
    private static readonly CUSTOMIZE_ADD_TIMEOUT_MS = 30_000;

    private addItemOnPageCustomized(path: ComponentPath, type: ComponentType): void {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const unsubscribe = (): void => {
            PageState.getEvents().unPageUpdated(listener);
            if (timer != null) clearTimeout(timer);
        };

        const listener = (event: PageUpdatedEvent): void => {
            if (event instanceof PageControllerCustomizedEvent) {
                unsubscribe();
                PageEventsManager.get().notifyComponentAddRequested(path, type);
            }
        };

        PageState.getEvents().onPageUpdated(listener);
        timer = setTimeout(unsubscribe, LiveEditPageProxy.CUSTOMIZE_ADD_TIMEOUT_MS);
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
