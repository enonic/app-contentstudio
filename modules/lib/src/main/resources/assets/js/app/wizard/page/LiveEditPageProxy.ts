import * as $ from 'jquery';
import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
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
import {RegionSelectedEvent} from '../../../page-editor/RegionSelectedEvent';
import {ItemViewSelectedEvent} from '../../../page-editor/ItemViewSelectedEvent';
import {ItemViewDeselectedEvent} from '../../../page-editor/ItemViewDeselectedEvent';
import {ComponentAddedEvent} from '../../../page-editor/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../../page-editor/ComponentRemovedEvent';
import {ComponentDuplicatedEvent} from '../../../page-editor/ComponentDuplicatedEvent';
import {ComponentInspectedEvent} from '../../../page-editor/ComponentInspectedEvent';
import {PageInspectedEvent} from '../../../page-editor/PageInspectedEvent';
import {ComponentLoadedEvent} from '../../../page-editor/ComponentLoadedEvent';
import {ComponentResetEvent} from '../../../page-editor/ComponentResetEvent';
import {LiveEditPageViewReadyEvent} from '../../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../../page-editor/LiveEditPageInitializationErrorEvent';
import {ComponentFragmentCreatedEvent} from '../../../page-editor/ComponentFragmentCreatedEvent';
import {FragmentComponentReloadRequiredEvent} from '../../../page-editor/FragmentComponentReloadRequiredEvent';
import {ShowWarningLiveEditEvent} from '../../../page-editor/ShowWarningLiveEditEvent';
import {InitializeLiveEditEvent} from '../../../page-editor/InitializeLiveEditEvent';
import {ComponentView} from '../../../page-editor/ComponentView';
import {RegionView} from '../../../page-editor/RegionView';
import {CreateItemViewConfig} from '../../../page-editor/CreateItemViewConfig';
import {SkipLiveEditReloadConfirmationEvent} from '../../../page-editor/SkipLiveEditReloadConfirmationEvent';
import {LiveEditPageDialogCreatedEvent} from '../../../page-editor/LiveEditPageDialogCreatedEvent';
import {ComponentDetachedFromFragmentEvent} from '../../../page-editor/ComponentDetachedFromFragmentEvent';
import {CreateHtmlAreaDialogEvent} from '../../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {UriHelper} from '../../rendering/UriHelper';
import {RenderingMode} from '../../rendering/RenderingMode';
import {EditContentEvent} from '../../event/EditContentEvent';
import {Component} from '../../page/region/Component';
import {EmulatedEvent} from '../../event/EmulatedEvent';
import {Regions} from '../../page/region/Regions';
import {MinimizeWizardPanelEvent} from '@enonic/lib-admin-ui/app/wizard/MinimizeWizardPanelEvent';
import {IFrameEl} from '@enonic/lib-admin-ui/dom/IFrameEl';
import {DragMask} from '@enonic/lib-admin-ui/ui/mask/DragMask';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {GLOBAL, GlobalLibAdmin, Store} from '@enonic/lib-admin-ui/store/Store';
import {IEObjectHolder} from './IEObjectHolder';
import {ItemViewIdProducer} from '../../../page-editor/ItemViewIdProducer';
import {ItemViewFactory} from '../../../page-editor/ItemViewFactory';
import {Descriptor} from '../../page/Descriptor';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LiveEditPagePlaceholder} from './LiveEditPagePlaceholder';

export class LiveEditPageProxy {

    private liveEditModel: LiveEditModel;

    private pageView: PageView;

    private liveEditIFrame: IFrameEl;

    private placeholderEl: LiveEditPagePlaceholder;

    private liveEditWindow: any;

    private livejq: JQueryStatic;

    private dragMask: DragMask;

    private beforeLoadListeners: { (): void; }[] = [];

    private loadedListeners: { (): void; }[] = [];

    private componentViewDragStartedListeners: { (event: ComponentViewDragStartedEvent): void; }[] = [];

    private componentViewDragStoppedListeners: { (event: ComponentViewDragStoppedEvent): void; }[] = [];

    private componentViewDragCanceledListeners: { (event: ComponentViewDragCanceledEvent): void; }[] = [];

    private componentViewDragDroppedListeners: { (event: ComponentViewDragDroppedEvent): void; }[] = [];

    private pageSelectedListeners: { (event: PageSelectedEvent): void; }[] = [];

    private pageLockedListeners: { (event: PageLockedEvent): void; }[] = [];

    private pageUnlockedListeners: { (event: PageUnlockedEvent): void; }[] = [];

    private pageUnloadedListeners: { (event: PageUnloadedEvent): void; }[] = [];

    private pageTextModeStartedListeners: { (event: PageTextModeStartedEvent): void; }[] = [];

    private regionSelectedListeners: { (event: RegionSelectedEvent): void; }[] = [];

    private itemViewSelectedListeners: { (event: ItemViewSelectedEvent): void; }[] = [];

    private itemViewDeselectedListeners: { (event: ItemViewDeselectedEvent): void; }[] = [];

    private componentAddedListeners: { (event: ComponentAddedEvent): void; }[] = [];

    private componentRemovedListeners: { (event: ComponentRemovedEvent): void; }[] = [];

    private componentDuplicatedListeners: { (event: ComponentDuplicatedEvent): void; }[] = [];

    private componentInspectedListeners: { (event: ComponentInspectedEvent): void; }[] = [];

    private pageInspectedListeners: { (event: PageInspectedEvent): void; }[] = [];

    private componentLoadedListeners: { (event: ComponentLoadedEvent): void; }[] = [];

    private componentResetListeners: { (event: ComponentResetEvent): void; }[] = [];

    private liveEditPageViewReadyListeners: { (event: LiveEditPageViewReadyEvent): void; }[] = [];

    private liveEditPageInitErrorListeners: { (event: LiveEditPageInitializationErrorEvent): void; }[] = [];

    private fragmentCreatedListeners: { (event: ComponentFragmentCreatedEvent): void; }[] = [];

    private componentDetachedListeners: { (event: ComponentDetachedFromFragmentEvent): void; }[] = [];

    private fragmentLoadedListeners: { (event: FragmentComponentReloadRequiredEvent): void; }[] = [];

    private showWarningListeners: { (event: ShowWarningLiveEditEvent): void; }[] = [];

    private editContentListeners: { (event: EditContentEvent): void; }[] = [];

    private createHtmlAreaDialogListeners: { (event: CreateHtmlAreaDialogEvent): void; }[] = [];

    private static debug: boolean = false;

    private ieObjectHolder: IEObjectHolder;

    private modifyPermissions: boolean = false;

    constructor() {

        this.liveEditIFrame = this.createLiveEditIFrame();
        this.placeholderEl = this.createPlaceholderEl();

        this.dragMask = new DragMask(this.liveEditIFrame);

        this.onLiveEditPageViewReady((event: LiveEditPageViewReadyEvent) => {
            if (LiveEditPageProxy.debug) {
                console.debug('LiveEditPageProxy.onLiveEditPageViewReady at ' + new Date().toISOString());
            }
            this.pageView = event.getPageView();
        });

        EmulatedEvent.on((event: EmulatedEvent) => {
            this.setWidth(event.getWidthWithUnits());
            this.setHeight(event.getHeightWithUnits());

            if (event.isFullscreen()) {
                this.resetParentHeight();
            } else {
                this.updateLiveEditFrameContainerHeight(event.getDevice().getHeight());
            }
        });
    }

    private createLiveEditIFrame(): IFrameEl {
        let liveEditIFrame = new IFrameEl('live-edit-frame');
        liveEditIFrame.onLoaded(() => this.handleIFrameLoadedEvent());

        return liveEditIFrame;
    }

    private createPlaceholderEl(): DivEl {
        const placeholderEl = new LiveEditPagePlaceholder();

        placeholderEl.onAdded(() => {
            if (this.liveEditModel && this.liveEditModel.getSiteModel()) {
                this.liveEditModel.getSiteModel().onApplicationAdded(() => {
                    this.hidePlaceholderAndShowEditor();
                });
            }
        });

        return placeholderEl;
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

    public setModifyPermissions(modifyPermissions: boolean): boolean {
        this.modifyPermissions = modifyPermissions;
        return this.modifyPermissions;
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

    public getPlaceholderEl(): DivEl {
        return this.placeholderEl;
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
            timer = setTimeout(() => this.scrollIFrameToSavedPosition(scrollTop, timer), 10);
            return;
        }

        this.livejq(this.liveEditWindow.document).scrollTop(scrollTop);
        clearTimeout(timer);
    }

    public load() {
        this.notifyBeforeLoad();

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
        let contentId = this.liveEditModel.getContent().getContentId().toString();
        let pageUrl = UriHelper.getPortalUri(contentId, RenderingMode.EDIT);

        if (BrowserHelper.isIE()) {
            this.copyObjectsBeforeFrameReloadForIE();
        }

        if (!this.liveEditWindow) {
            this.liveEditIFrame.setSrc(pageUrl);
        } else {
            this.liveEditWindow.document.location.href = pageUrl; // This is a faster way to reload the iframe
            if (scrollTop) {
                this.livejq(this.liveEditWindow.document).ready(() => this.scrollIFrameToSavedPosition(scrollTop));
            }
        }
        if (this.liveEditModel.isRenderableContent()) {
            if (LiveEditPageProxy.debug) {
                console.log(`LiveEditPageProxy.load loading page from '${pageUrl}' at ${new Date().toISOString()}`);
            }
            this.hidePlaceholderAndShowEditor();
        } else {

            if (LiveEditPageProxy.debug) {
                console.debug('LiveEditPageProxy.load: no reason to load page, showing blank placeholder');
            }

            this.hideEditorAndShowPlaceholder();

        }
    }

    public isPlaceholderVisible(): boolean {
        return this.placeholderEl.isVisible();
    }

    private hideEditorAndShowPlaceholder() {
        this.liveEditIFrame.hide();
        this.placeholderEl.show();
    }

    private hidePlaceholderAndShowEditor() {
        this.placeholderEl.hide();
        this.liveEditIFrame.show();
    }

    public skipNextReloadConfirmation(skip: boolean) {
        new SkipLiveEditReloadConfirmationEvent(skip).fire(this.liveEditWindow);
    }

    public propagateEvent(event: Event) {
        event.fire(this.liveEditWindow);
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

                this.livejq = <JQueryStatic>livejq;

                this.listenToPage(this.liveEditWindow);

                if (BrowserHelper.isIE()) {
                    this.resetObjectsAfterFrameReloadForIE();
                    this.disableLinksInLiveEditForIE();
                }
                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.hanldeIframeLoadedEvent: initialize live edit at ' + new Date().toISOString());
                }
                new InitializeLiveEditEvent(this.liveEditModel, this.modifyPermissions).fire(this.liveEditWindow);
            } else {
                if (LiveEditPageProxy.debug) {
                    console.debug('LiveEditPageProxy.handleIframeLoadedEvent: notify live edit ready at ' + new Date().toISOString());
                }
                this.notifyLiveEditPageViewReady(new LiveEditPageViewReadyEvent());
            }
        }

        // Notify loaded no matter the result
        this.notifyLoaded();
    }

    private handlePlaceholderIFrameLoadedEvent(iframe: IFrameEl) {
        let window = iframe.getHTMLElement()['contentWindow'];

        $(window.document.body).find('.page-placeholder-info-line1').text(i18n('text.nocontrollers'));
        $(window.document.body).find('.page-placeholder-info-line2').text(i18n('text.addapplications'));
    }

    public loadComponent(componentView: ComponentView<Component>, componentUrl: string): Q.Promise<string> {
        const deferred = Q.defer<string>();
        assertNotNull(componentView, 'componentView cannot be null');
        assertNotNull(componentUrl, 'componentUrl cannot be null');

        $.ajax({
            url: componentUrl,
            type: 'GET',
            success: (htmlAsString: string) => {
                const newElement: Element = Element.fromString(htmlAsString);
                const itemViewIdProducer: ItemViewIdProducer = componentView.getItemViewIdProducer();
                const itemViewFactory: ItemViewFactory = componentView.getItemViewFactory();

                const createViewConfig: CreateItemViewConfig<RegionView, Component> = new CreateItemViewConfig<RegionView, Component>()
                    .setItemViewIdProducer(itemViewIdProducer)
                    .setItemViewFactory(itemViewFactory)
                    .setParentView(componentView.getParentItemView())
                    .setData(componentView.getComponent())
                    .setElement(newElement);

                const newComponentView: ComponentView<Component> = <ComponentView<Component>>itemViewFactory.createView(
                    componentView.getType(),
                    createViewConfig);

                componentView.replaceWith(newComponentView);

                const event: ComponentLoadedEvent = new ComponentLoadedEvent(newComponentView, componentView);
                event.fire(this.liveEditWindow);

                newComponentView.select();
                newComponentView.hideContextMenu();

                deferred.resolve('');
            },
            error: (jqXHR: JQueryXHR, textStatus: string, errorThrow: string) => {
                const responseHtml = $.parseHTML(jqXHR.responseText);
                let errorMessage = '';
                responseHtml.forEach((el: HTMLElement, i) => {
                    if (el.tagName && el.tagName.toLowerCase() === 'title') {
                        errorMessage = el.innerHTML;
                    }
                });
                deferred.reject(errorMessage);
            }
        });

        return deferred.promise;
    }

    public stopListening(contextWindow: any) {

        ComponentViewDragStartedEvent.un(null, contextWindow);

        ComponentViewDragStoppedEvent.un(null, contextWindow);

        ComponentViewDragCanceledEvent.un(null, contextWindow);

        ComponentViewDragDroppedEvent.un(null, contextWindow);

        PageSelectedEvent.un(null, contextWindow);

        PageLockedEvent.un(null, contextWindow);

        PageUnlockedEvent.un(null, contextWindow);

        PageUnloadedEvent.un(null, contextWindow);

        PageTextModeStartedEvent.un(null, contextWindow);

        RegionSelectedEvent.un(null, contextWindow);

        ItemViewSelectedEvent.un(null, contextWindow);

        ItemViewDeselectedEvent.un(null, contextWindow);

        ComponentAddedEvent.un(null, contextWindow);

        ComponentRemovedEvent.un(null, contextWindow);

        ComponentDuplicatedEvent.un(null, contextWindow);

        ComponentInspectedEvent.un(null, contextWindow);

        PageInspectedEvent.un(null, contextWindow);

        ComponentFragmentCreatedEvent.un(null, contextWindow);

        FragmentComponentReloadRequiredEvent.un(null, contextWindow);

        ShowWarningLiveEditEvent.un(null, contextWindow);

        ComponentLoadedEvent.un(null, contextWindow);

        ComponentResetEvent.un(null, contextWindow);

        LiveEditPageViewReadyEvent.un(null, contextWindow);

        LiveEditPageInitializationErrorEvent.un(null, contextWindow);

        CreateHtmlAreaDialogEvent.un(null, contextWindow);
    }

    public listenToPage(contextWindow: any) {

        MinimizeWizardPanelEvent.on(() => {
            new MinimizeWizardPanelEvent().fire(contextWindow);
        });

        ComponentViewDragStartedEvent.on(this.notifyComponentViewDragStarted.bind(this), contextWindow);

        ComponentViewDragStoppedEvent.on(this.notifyComponentViewDragStopped.bind(this), contextWindow);

        ComponentViewDragCanceledEvent.on(this.notifyComponentViewDragCanceled.bind(this), contextWindow);

        ComponentViewDragDroppedEvent.on(this.notifyComponentViewDragDropped.bind(this), contextWindow);

        PageSelectedEvent.on(this.notifyPageSelected.bind(this), contextWindow);

        PageLockedEvent.on(this.notifyPageLocked.bind(this), contextWindow);

        PageUnlockedEvent.on(this.notifyPageUnlocked.bind(this), contextWindow);

        PageUnloadedEvent.on(this.notifyPageUnloaded.bind(this), contextWindow);

        PageTextModeStartedEvent.on(this.notifyPageTextModeStarted.bind(this), contextWindow);

        RegionSelectedEvent.on(this.notifyRegionSelected.bind(this), contextWindow);

        ItemViewSelectedEvent.on(this.notifyItemViewSelected.bind(this), contextWindow);

        ItemViewDeselectedEvent.on(this.notifyItemViewDeselected.bind(this), contextWindow);

        ComponentAddedEvent.on(this.notifyComponentAdded.bind(this), contextWindow);

        ComponentRemovedEvent.on(this.notifyComponentRemoved.bind(this), contextWindow);

        ComponentDuplicatedEvent.on(this.notifyComponentDuplicated.bind(this), contextWindow);

        ComponentInspectedEvent.on(this.notifyComponentInspected.bind(this), contextWindow);

        PageInspectedEvent.on(this.notifyPageInspected.bind(this), contextWindow);

        ComponentFragmentCreatedEvent.on(this.notifyFragmentCreated.bind(this), contextWindow);

        ComponentDetachedFromFragmentEvent.on(this.notifyComponentDetached.bind(this), contextWindow);

        FragmentComponentReloadRequiredEvent.on(this.notifyFragmentReloadRequired.bind(this), contextWindow);

        ShowWarningLiveEditEvent.on(this.notifyShowWarning.bind(this), contextWindow);

        EditContentEvent.on(this.notifyEditContent.bind(this), contextWindow);

        ComponentLoadedEvent.on(this.notifyComponentLoaded.bind(this), contextWindow);

        ComponentResetEvent.on(this.notifyComponentReset.bind(this), contextWindow);

        LiveEditPageViewReadyEvent.on(this.notifyLiveEditPageViewReady.bind(this), contextWindow);

        LiveEditPageInitializationErrorEvent.on(this.notifyLiveEditPageInitializationError.bind(this), contextWindow);

        CreateHtmlAreaDialogEvent.on(this.notifyLiveEditPageDialogCreate.bind(this), contextWindow);
    }

    onLoaded(listener: { (): void; }) {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: { (): void; }) {
        this.loadedListeners = this.loadedListeners
            .filter(function (curr: { (): void; }) {
                return curr !== listener;
            });
    }

    private notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }

    onBeforeLoad(listener: { (): void; }) {
        this.beforeLoadListeners.push(listener);
    }

    unBeforeLoad(listener: { (): void; }) {
        this.beforeLoadListeners = this.beforeLoadListeners
            .filter(function (curr: { (): void; }) {
                return curr !== listener;
            });
    }

    private notifyBeforeLoad() {
        this.beforeLoadListeners.forEach((listener) => {
            listener();
        });
    }

    onComponentViewDragStarted(listener: (event: ComponentViewDragStartedEvent) => void) {
        this.componentViewDragStartedListeners.push(listener);
    }

    unComponentViewDragStarted(listener: (event: ComponentViewDragStartedEvent) => void) {
        this.componentViewDragStartedListeners = this.componentViewDragStartedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentViewDragStarted(event: ComponentViewDragStartedEvent) {
        this.componentViewDragStartedListeners.forEach((listener) => listener(event));
    }

    onComponentViewDragStopped(listener: { (event: ComponentViewDragStoppedEvent): void; }) {
        this.componentViewDragStoppedListeners.push(listener);
    }

    unComponentViewDragStopped(listener: { (event: ComponentViewDragStoppedEvent): void; }) {
        this.componentViewDragStoppedListeners = this.componentViewDragStoppedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentViewDragStopped(event: ComponentViewDragStoppedEvent) {
        this.componentViewDragStoppedListeners.forEach((listener) => listener(event));
    }

    onComponentViewDragCanceled(listener: { (event: ComponentViewDragCanceledEvent): void; }) {
        this.componentViewDragCanceledListeners.push(listener);
    }

    unComponentViewDragCanceled(listener: { (event: ComponentViewDragCanceledEvent): void; }) {
        this.componentViewDragCanceledListeners = this.componentViewDragCanceledListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentViewDragCanceled(event: ComponentViewDragCanceledEvent) {
        this.componentViewDragCanceledListeners.forEach((listener) => listener(event));
    }

    onComponentViewDragDropped(listener: { (event: ComponentViewDragDroppedEvent): void; }) {
        this.componentViewDragDroppedListeners.push(listener);
    }

    unComponentViewDragDropped(listener: { (event: ComponentViewDragDroppedEvent): void; }) {
        this.componentViewDragDroppedListeners = this.componentViewDragDroppedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentViewDragDropped(event: ComponentViewDragDroppedEvent) {
        this.componentViewDragDroppedListeners.forEach((listener) => listener(event));
    }

    onPageSelected(listener: (event: PageSelectedEvent) => void) {
        this.pageSelectedListeners.push(listener);
    }

    unPageSelected(listener: (event: PageSelectedEvent) => void) {
        this.pageSelectedListeners = this.pageSelectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageSelected(event: PageSelectedEvent) {
        this.pageSelectedListeners.forEach((listener) => listener(event));
    }

    onPageLocked(listener: (event: PageLockedEvent) => void) {
        this.pageLockedListeners.push(listener);
    }

    unPageLocked(listener: (event: PageLockedEvent) => void) {
        this.pageLockedListeners = this.pageLockedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageLocked(event: PageLockedEvent) {
        this.pageLockedListeners.forEach((listener) => listener(event));
    }

    onPageUnlocked(listener: (event: PageUnlockedEvent) => void) {
        this.pageUnlockedListeners.push(listener);
    }

    unPageUnlocked(listener: (event: PageUnlockedEvent) => void) {
        this.pageUnlockedListeners = this.pageUnlockedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageUnlocked(event: PageUnlockedEvent) {
        this.pageUnlockedListeners.forEach((listener) => listener(event));
    }

    onPageUnloaded(listener: (event: PageUnloadedEvent) => void) {
        this.pageUnloadedListeners.push(listener);
    }

    unPageUnloaded(listener: (event: PageUnloadedEvent) => void) {
        this.pageUnloadedListeners = this.pageUnloadedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageUnloaded(event: PageUnloadedEvent) {
        this.pageUnloadedListeners.forEach((listener) => listener(event));
    }

    onPageTextModeStarted(listener: (event: PageTextModeStartedEvent) => void) {
        this.pageTextModeStartedListeners.push(listener);
    }

    unPageTextModeStarted(listener: (event: PageTextModeStartedEvent) => void) {
        this.pageTextModeStartedListeners = this.pageTextModeStartedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageTextModeStarted(event: PageTextModeStartedEvent) {
        this.pageTextModeStartedListeners.forEach((listener) => listener(event));
    }

    onRegionSelected(listener: { (event: RegionSelectedEvent): void; }) {
        this.regionSelectedListeners.push(listener);
    }

    unRegionSelected(listener: { (event: RegionSelectedEvent): void; }) {
        this.regionSelectedListeners = this.regionSelectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyRegionSelected(event: RegionSelectedEvent) {
        this.regionSelectedListeners.forEach((listener) => listener(event));
    }

    onItemViewSelected(listener: { (event: ItemViewSelectedEvent): void; }) {
        this.itemViewSelectedListeners.push(listener);
    }

    unItemViewSelected(listener: { (event: ItemViewSelectedEvent): void; }) {
        this.itemViewSelectedListeners = this.itemViewSelectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyItemViewSelected(event: ItemViewSelectedEvent) {
        this.itemViewSelectedListeners.forEach((listener) => listener(event));
    }

    onItemViewDeselected(listener: { (event: ItemViewDeselectedEvent): void; }) {
        this.itemViewDeselectedListeners.push(listener);
    }

    unItemViewDeselected(listener: { (event: ItemViewDeselectedEvent): void; }) {
        this.itemViewDeselectedListeners = this.itemViewDeselectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyItemViewDeselected(event: ItemViewDeselectedEvent) {
        this.itemViewDeselectedListeners.forEach((listener) => listener(event));
    }

    onComponentAdded(listener: { (event: ComponentAddedEvent): void; }) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: { (event: ComponentAddedEvent): void; }) {
        this.componentAddedListeners = this.componentAddedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentAdded(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach((listener) => listener(event));
    }

    onComponentRemoved(listener: { (event: ComponentRemovedEvent): void; }) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: { (event: ComponentRemovedEvent): void; }) {
        this.componentRemovedListeners = this.componentRemovedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentRemoved(event: ComponentRemovedEvent) {
        this.componentRemovedListeners.forEach((listener) => listener(event));
    }

    onComponentDuplicated(listener: { (event: ComponentDuplicatedEvent): void; }) {
        this.componentDuplicatedListeners.push(listener);
    }

    unComponentDuplicated(listener: { (event: ComponentDuplicatedEvent): void; }) {
        this.componentDuplicatedListeners = this.componentDuplicatedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentDuplicated(event: ComponentDuplicatedEvent) {
        this.componentDuplicatedListeners.forEach((listener) => listener(event));
    }

    onComponentInspected(listener: { (event: ComponentInspectedEvent): void; }) {
        this.componentInspectedListeners.push(listener);
    }

    unComponentInspected(listener: { (event: ComponentInspectedEvent): void; }) {
        this.componentInspectedListeners = this.componentInspectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentInspected(event: ComponentInspectedEvent) {
        this.componentInspectedListeners.forEach((listener) => listener(event));
    }

    onPageInspected(listener: { (event: PageInspectedEvent): void; }) {
        this.pageInspectedListeners.push(listener);
    }

    unPageInspected(listener: { (event: PageInspectedEvent): void; }) {
        this.pageInspectedListeners = this.pageInspectedListeners.filter((curr) => (curr !== listener));
    }

    private notifyPageInspected(event: PageInspectedEvent) {
        this.pageInspectedListeners.forEach((listener) => listener(event));
    }

    onComponentLoaded(listener: { (event: ComponentLoadedEvent): void; }) {
        this.componentLoadedListeners.push(listener);
    }

    unComponentLoaded(listener: { (event: ComponentLoadedEvent): void; }) {
        this.componentLoadedListeners = this.componentLoadedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentLoaded(event: ComponentLoadedEvent) {
        this.componentLoadedListeners.forEach((listener) => listener(event));
    }

    onComponentReset(listener: { (event: ComponentResetEvent): void; }) {
        this.componentResetListeners.push(listener);
    }

    unComponentReset(listener: { (event: ComponentResetEvent): void; }) {
        this.componentResetListeners = this.componentResetListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentReset(event: ComponentResetEvent) {
        this.componentResetListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageViewReady(listener: { (event: LiveEditPageViewReadyEvent): void; }) {
        this.liveEditPageViewReadyListeners.push(listener);
    }

    unLiveEditPageViewReady(listener: { (event: LiveEditPageViewReadyEvent): void; }) {
        this.liveEditPageViewReadyListeners = this.liveEditPageViewReadyListeners.filter((curr) => (curr !== listener));
    }

    private notifyLiveEditPageViewReady(event: LiveEditPageViewReadyEvent) {
        this.liveEditPageViewReadyListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageInitializationError(listener: { (event: LiveEditPageInitializationErrorEvent): void; }) {
        this.liveEditPageInitErrorListeners.push(listener);
    }

    unLiveEditPageInitializationError(listener: { (event: LiveEditPageInitializationErrorEvent): void; }) {
        this.liveEditPageInitErrorListeners = this.liveEditPageInitErrorListeners.filter((curr) => (curr !== listener));
    }

    private notifyLiveEditPageInitializationError(event: LiveEditPageInitializationErrorEvent) {
        this.liveEditPageInitErrorListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageDialogCreate(listener: { (event: CreateHtmlAreaDialogEvent): void; }) {
        this.createHtmlAreaDialogListeners.push(listener);
    }

    unLiveEditPageDialogCreate(listener: { (event: CreateHtmlAreaDialogEvent): void; }) {
        this.createHtmlAreaDialogListeners = this.createHtmlAreaDialogListeners.filter((curr) => (curr !== listener));
    }

    private notifyLiveEditPageDialogCreate(event: CreateHtmlAreaDialogEvent) {
        this.createHtmlAreaDialogListeners.forEach((listener) => listener(event));
    }

    notifyLiveEditPageDialogCreated(modalDialog: ModalDialog, config: any) {
        new LiveEditPageDialogCreatedEvent(modalDialog, config).fire(this.liveEditWindow);
    }

    onComponentFragmentCreated(listener: { (event: ComponentFragmentCreatedEvent): void; }) {
        this.fragmentCreatedListeners.push(listener);
    }

    unComponentFragmentCreated(listener: { (event: ComponentFragmentCreatedEvent): void; }) {
        this.fragmentCreatedListeners = this.fragmentCreatedListeners.filter((curr) => (curr !== listener));
    }

    private notifyFragmentCreated(event: ComponentFragmentCreatedEvent) {
        this.fragmentCreatedListeners.forEach((listener) => listener(event));
    }

    onComponentDetached(listener: { (event: ComponentDetachedFromFragmentEvent): void; }) {
        this.componentDetachedListeners.push(listener);
    }

    unComponentDetached(listener: { (event: ComponentDetachedFromFragmentEvent): void; }) {
        this.componentDetachedListeners = this.componentDetachedListeners.filter((curr) => (curr !== listener));
    }

    private notifyComponentDetached(event: ComponentDetachedFromFragmentEvent) {
        this.componentDetachedListeners.forEach((listener) => listener(event));
    }

    onFragmentReloadRequired(listener: { (event: FragmentComponentReloadRequiredEvent): void; }) {
        this.fragmentLoadedListeners.push(listener);
    }

    unFragmentReloadRequired(listener: { (event: FragmentComponentReloadRequiredEvent): void; }) {
        this.fragmentLoadedListeners = this.fragmentLoadedListeners.filter((curr) => (curr !== listener));
    }

    private notifyFragmentReloadRequired(event: FragmentComponentReloadRequiredEvent) {
        this.fragmentLoadedListeners.forEach((listener) => listener(event));
    }

    onShowWarning(listener: { (event: ShowWarningLiveEditEvent): void; }) {
        this.showWarningListeners.push(listener);
    }

    unShowWarning(listener: { (event: ShowWarningLiveEditEvent): void; }) {
        this.showWarningListeners = this.showWarningListeners.filter((curr) => (curr !== listener));
    }

    private notifyShowWarning(event: ShowWarningLiveEditEvent) {
        this.showWarningListeners.forEach((listener) => listener(event));
    }

    onEditContent(listener: { (event: EditContentEvent): void; }) {
        this.editContentListeners.push(listener);
    }

    unEditContent(listener: { (event: EditContentEvent): void; }) {
        this.editContentListeners = this.editContentListeners.filter((curr) => (curr !== listener));
    }

    private notifyEditContent(event: EditContentEvent) {
        this.editContentListeners.forEach((listener) => listener(event));
    }

    private copyObjectsBeforeFrameReloadForIE() {
        const controller: Descriptor = this.liveEditModel.getPageModel().getController();
        const regions: Regions = this.liveEditModel.getPageModel().getRegions();

        this.ieObjectHolder = new IEObjectHolder();
        this.ieObjectHolder.setController(controller);
        this.ieObjectHolder.setRegions(regions);
    }

    private resetObjectsAfterFrameReloadForIE() {
        this.resetControllerForIE();
        this.resetRegionsForIE();
        this.ieObjectHolder.reset();
    }

    private resetControllerForIE() {
        if (this.ieObjectHolder.hasController()) {
            this.liveEditModel.getPageModel().setControllerDescriptor(this.ieObjectHolder.getPageDescriptorCopy());
        }
    }

    private resetRegionsForIE() {
        if (this.ieObjectHolder.hasRegionsCopy()) {
            this.liveEditModel.getPageModel().setRegions(this.ieObjectHolder.getRegionsCopy());
        }
    }

    private disableLinksInLiveEditForIE() {
        if (this.livejq) {
            this.livejq('a').attr('disabled', 'disabled'); // this works only in IE
        }
    }

}
