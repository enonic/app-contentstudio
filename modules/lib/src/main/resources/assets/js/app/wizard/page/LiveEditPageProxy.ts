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
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DragMask} from '@enonic/lib-admin-ui/ui/mask/DragMask';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {ContentUrlHelper} from '../../util/ContentUrlHelper';
import {HTMLAreaHelper} from '../../inputtype/ui/text/HTMLAreaHelper';
import {type Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {type WizardExtensionRenderingHandler} from '../WizardExtensionRenderingHandler';
import {isRoot, type ComponentPath as PEComponentPath, type OutgoingMessage, type PageConfig, type PageController} from '@enonic/page-editor';
import {postToIframe, setIframeWindow, subscribeToIframe} from './iframeChannel';
import {pageStateToDescriptor} from './pageStateToDescriptor';
import {GetPageDescriptorsByApplicationsRequest} from './contextwindow/inspect/page/GetPageDescriptorsByApplicationsRequest';

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

    private unsubscribeIframe?: () => void;

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
        const liveEditIFrame = new IFrameEl('live-edit-frame');

        (liveEditIFrame.getHTMLElement() as HTMLIFrameElement).addEventListener('load', () => {
            this.handleIFrameLoadedEvent();
        });

        return liveEditIFrame;
    }

    public setModel(liveEditModel: LiveEditModel) {
        this.liveEditModel = liveEditModel;
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;
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

        if (this.isFrameLoaded) {
            this.stopListening();
            this.isFrameLoaded = false;
        }
    }

    public skipNextReloadConfirmation(_skip: boolean): void {
        // No-op: v2 has no `beforeunload` confirmation (G8 WONT-FIX).
        // Kept as deprecated no-op for existing callers; remove after audit.
    }

    private handleIFrameLoadedEvent(): void {
        const iframeWin = (this.liveEditIFrame.getHTMLElement() as HTMLIFrameElement).contentWindow;
        setIframeWindow(iframeWin ?? undefined);
        this.isFrameLoaded = true;
        this.isPageLocked = false;

        this.stopListening();
        this.listenToLivePageEvents();

        PageEventsManager.get().notifyLoaded();
    }

    private handleChannelReady(): void {
        if (!this.isLiveEditAllowed()) {
            PageEventsManager.get().notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
            return;
        }

        postToIframe({type: 'init', config: this.buildPageConfig()});
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
            locked: !isPageTemplate && !hasController && !isFragment,
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

    private async sendPageControllers(): Promise<void> {
        try {
            const keys = this.resolveApplicationKeys().map(k => ApplicationKey.fromString(k));
            const descriptors = await new GetPageDescriptorsByApplicationsRequest(keys).sendAndParse();
            const controllers: PageController[] = descriptors.map(d => ({
                descriptorKey: d.getKey().toString(),
                displayName: d.getDisplayName(),
                iconClass: d.getIconCls(),
            }));
            if (this.isFrameLoaded) postToIframe({type: 'page-controllers', controllers});
        } catch (err) {
            console.warn('LiveEditPageProxy.sendPageControllers: failed', err);
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
        return CONFIG.getString('theme') === 'dark' ? 'dark' : 'light';
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
        this.isPageLocked = locked;
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
                    PageNavigationMediator.get().notify(
                        new PageNavigationEvent(
                            PageNavigationEventType.INSPECT,
                            new PageNavigationEventData(ComponentPath.fromString(msg.path)),
                        ),
                    );
                    return;

                case 'add':
                    this.handleAddOutgoing(ComponentPath.fromString(msg.path), msg.componentType);
                    return;

                case 'remove':
                    mgr.notifyComponentRemoveRequested(ComponentPath.fromString(msg.path));
                    return;

                case 'move':
                    mgr.notifyComponentMoveRequested(
                        ComponentPath.fromString(msg.from),
                        ComponentPath.fromString(msg.to),
                    );
                    return;

                case 'drag-dropped':
                    if (msg.from == null) return;
                    mgr.notifyComponentMoveRequested(
                        ComponentPath.fromString(msg.from),
                        ComponentPath.fromString(msg.to),
                    );
                    return;

                case 'drag-started':
                    if (msg.path != null) mgr.notifyComponentDragStarted(ComponentPath.fromString(msg.path));
                    return;

                case 'drag-stopped':
                    if (msg.path != null) mgr.notifyComponentDragStopped(ComponentPath.fromString(msg.path));
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
                    this.simulateKeyboardEvent(msg);
                    return;

                case 'navigate':
                    // TODO: [Task 6/8] route to CS content-preview navigation.
                    return;
            }
        });
    }

    private handleAddOutgoing(path: ComponentPath, componentType: string): void {
        const type = ComponentType.byShortName(componentType);

        if (this.isPageLocked) {
            this.addItemOnPageCustomized(path, type);
            PageEventsManager.get().notifyCustomizePageRequested();
        } else {
            PageEventsManager.get().notifyComponentAddRequested(path, type);
        }
    }

    private listenToMainFrameEvents(): void {
        const pushPageState = (): void => {
            if (!this.isFrameLoaded) return;
            postToIframe({type: 'page-state', page: pageStateToDescriptor(PageState.getState())});
        };

        PageState.getEvents().onComponentAdded(() => pushPageState());

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            if (event instanceof ComponentRemovedOnMoveEvent) return;
            pushPageState();
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            pushPageState();
            if (event instanceof ComponentTextUpdatedEvent) {
                this.pushTextUpdate(event);
            }
        });

        PageEventsManager.get().onSetComponentState((path: ComponentPath, processing: boolean) => {
            if (!this.isFrameLoaded) return;
            postToIframe({type: 'set-component-state', path: path.toString() as PEComponentPath, processing});
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
        const path = event.getData().getPath();
        if (event.getType() === PageNavigationEventType.SELECT && path != null) {
            postToIframe({type: 'select', path: path.toString() as PEComponentPath, silent: false});
            return;
        }
        if (event.getType() === PageNavigationEventType.DESELECT) {
            postToIframe({type: 'deselect', path: path?.toString() as PEComponentPath | undefined});
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
