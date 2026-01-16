import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {PageView, PageViewBuilder} from './PageView';
import {InitializeLiveEditEvent} from './InitializeLiveEditEvent';
import {PageViewController} from './PageViewController';
import {SkipLiveEditReloadConfirmationEvent} from './SkipLiveEditReloadConfirmationEvent';
import {ComponentLoadedEvent} from './ComponentLoadedEvent';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {LiveEditPageInitializationErrorEvent} from './LiveEditPageInitializationErrorEvent';
import {DragAndDrop} from './DragAndDrop';
import {LiveEditPageViewReadyEvent} from './LiveEditPageViewReadyEvent';
import {Highlighter} from './Highlighter';
import {SelectedHighlighter} from './SelectedHighlighter';
import {Shader} from './Shader';
import {Cursor} from './Cursor';
import {ComponentViewDragStartedEvent} from './ComponentViewDragStartedEvent';
import {ComponentViewDragStoppedEvent} from './ComponentViewDraggingStoppedEvent';
import {DefaultItemViewFactory, ItemViewFactory} from './ItemViewFactory';
import {Exception} from '@enonic/lib-admin-ui/Exception';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {Project} from '../app/settings/data/project/Project';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {SelectComponentViewEvent} from './event/incoming/navigation/SelectComponentViewEvent';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {ItemView} from './ItemView';
import {DeselectComponentViewEvent} from './event/incoming/navigation/DeselectComponentViewEvent';
import {EditTextComponentViewEvent} from './event/incoming/manipulation/EditTextComponentViewEvent';
import {TextComponentView} from './text/TextComponentView';
import {AddComponentViewEvent} from './event/incoming/manipulation/AddComponentViewEvent';
import {ComponentType} from '../app/page/region/ComponentType';
import {RegionView} from './RegionView';
import {ItemType} from './ItemType';
import {RemoveComponentViewEvent} from './event/incoming/manipulation/RemoveComponentViewEvent';
import {ComponentView} from './ComponentView';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {ComponentItemType} from './ComponentItemType';
import {FragmentItemType} from './fragment/FragmentItemType';
import DOMPurify from 'dompurify';
import {HTMLAreaHelper} from '../app/inputtype/ui/text/HTMLAreaHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LoadComponentViewEvent} from './event/incoming/manipulation/LoadComponentViewEvent';
import {LoadComponentFailedEvent} from './event/outgoing/manipulation/LoadComponentFailedEvent';
import {DuplicateComponentViewEvent} from './event/incoming/manipulation/DuplicateComponentViewEvent';
import {MoveComponentViewEvent} from './event/incoming/manipulation/MoveComponentViewEvent';
import {IframeBeforeContentSavedEvent} from '../app/event/IframeBeforeContentSavedEvent';
import {ContentContext} from '../app/wizard/ContentContext';
import {SetPageLockStateEvent} from './event/incoming/manipulation/SetPageLockStateEvent';
import {SetModifyAllowedEvent} from './event/incoming/manipulation/SetModifyAllowedEvent';
import {CreateOrDestroyDraggableEvent} from './event/incoming/manipulation/CreateOrDestroyDraggableEvent';
import {ResetComponentViewEvent} from './event/incoming/manipulation/ResetComponentViewEvent';
import {PageStateEvent} from './event/incoming/common/PageStateEvent';
import {PageState} from '../app/wizard/page/PageState';
import {PageBuilder} from '../app/page/Page';
import {Messages} from '@enonic/lib-admin-ui/util/Messages';
import {UpdateTextComponentViewEvent} from './event/incoming/manipulation/UpdateTextComponentViewEvent';
import {SetComponentStateEvent} from './event/incoming/manipulation/SetComponentStateEvent';
import {PageReloadRequestedEvent} from './event/outgoing/manipulation/PageReloadRequestedEvent';
import {PageHelper} from '../app/util/PageHelper';
import {DescriptorBasedComponent} from '../app/page/region/DescriptorBasedComponent';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {SessionStorageHelper} from '../app/util/SessionStorageHelper';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {Request} from '@enonic/lib-admin-ui/rest/Request';

export class LiveEditPage {

    private pageView: PageView;

    private skipNextReloadConfirmation: boolean = false;

    private initializeListener: (event: InitializeLiveEditEvent) => void;

    private skipConfirmationListener: (event: SkipLiveEditReloadConfirmationEvent) => void;

    private unloadListener: (event: UIEvent) => void;

    private dragStartedListener: () => void;

    private dragStoppedListener: () => void;

    private selectComponentRequestedListener: (event: SelectComponentViewEvent) => void;

    private deselectComponentRequestedListener: (event: DeselectComponentViewEvent) => void;

    private editTextComponentRequestedListener: (event: EditTextComponentViewEvent) => void;

    private setComponentStateEventListener: (event: SetComponentStateEvent) => void;

    private addItemViewRequestListener: (event: AddComponentViewEvent) => void;

    private removeItemViewRequestListener: (event: RemoveComponentViewEvent) => void;

    private loadComponentRequestListener: (event: LoadComponentViewEvent) => void;

    private duplicateComponentViewRequestedListener: (event: DuplicateComponentViewEvent) => void;

    private moveComponentViewRequestedListener: (event: MoveComponentViewEvent) => void;

    private beforeContentSavedListener: () => void;

    private setPageLockStateListener: (event: SetPageLockStateEvent) => void;

    private setModifyAllowedListener: (event: SetModifyAllowedEvent) => void;

    private createOrDestroyDraggableListener: (event: CreateOrDestroyDraggableEvent) => void;

    private resetComponentViewRequestListener: (event: ResetComponentViewEvent) => void;

    private pageStateListener: (event: PageStateEvent) => void;

    private updateTextComponentViewListener: (event: UpdateTextComponentViewEvent) => void;

    private static debug: boolean = true;

    constructor() {
        this.skipConfirmationListener = (event: SkipLiveEditReloadConfirmationEvent) => {
            this.skipNextReloadConfirmation = event.isSkip();
        };

        SkipLiveEditReloadConfirmationEvent.on(this.skipConfirmationListener);

        this.initializeListener = this.init.bind(this);

        InitializeLiveEditEvent.on(this.initializeListener);
    }

    private init(event: InitializeLiveEditEvent): void {
        let startTime = Date.now();
        if (LiveEditPage.debug) {
            console.debug('LiveEditPage: starting live edit initialization', event);
        }
        // Setting up parent-like environment inside iframe
        UriHelper.setDomain(event.getHostDomain());
        if (event.getJsessionId()?.length) {
            Request.setHeader('Cookie', `JSESSIONID=${event.getJsessionId()}`);
        }

        CONFIG.setConfig(event.getConfig());
        Messages.addMessages(JSON.parse(CONFIG.getString('phrasesAsJson')) as object);
        AuthContext.init(Principal.fromJson(event.getUserJson()), event.getPrincipalsJson().map(Principal.fromJson));

        ProjectContext.get().setProject(Project.fromJson(event.getProjectJson()));
        PageState.setState(event.getPageJson() ? new PageBuilder().fromJson(event.getPageJson()).build() : null);

        ContentContext.get().setContent(event.getContent());

        console.info('LiveEditPage: ContentContext.setContent', event.getContent());

        const body = Body.get().loadExistingChildren();
        try {
            this.pageView = new PageViewBuilder()
                .setItemViewIdProducer(new ItemViewIdProducer())
                .setItemViewFactory(new DefaultItemViewFactory())
                .setLiveEditParams(event.getParams())
                .setElement(body).build();
        } catch (error) {
            if (LiveEditPage.debug) {
                console.error('LiveEditPage: error initializing live edit in ' + (Date.now() - startTime) + 'ms');
            }
            if (ObjectHelper.iFrameSafeInstanceOf(error, Exception)) {
                new LiveEditPageInitializationErrorEvent('The Live edit page could not be initialized. ' +
                                                         error.getMessage()).fire();
            } else {
                new LiveEditPageInitializationErrorEvent('The Live edit page could not be initialized. ' +
                                                         error).fire();
            }
            return;
        }

        DragAndDrop.init(this.pageView);
        console.info('LiveEditPage: DragAndDrop initialized');

        Tooltip.allowMultipleInstances(false);

        this.registerGlobalListeners();

        this.restoreSelection(event.getParams().contentId);

        if (LiveEditPage.debug) {
            console.debug('LiveEditPage: done live edit initializing in ' + (Date.now() - startTime) + 'ms');
        }

        new LiveEditPageViewReadyEvent().fire();
    }

    private restoreSelection(contentId: string): void {
        const selectedItemViewPath: ComponentPath = SessionStorageHelper.getSelectedPathFromStorage(contentId);

        const selected: ItemView = selectedItemViewPath && this.pageView.getComponentViewByPath(selectedItemViewPath);

        if (selected) {
            selected.selectWithoutMenu();
            selected.scrollComponentIntoView();
        }
    }

    public destroy(win: Window = window): void {
        if (LiveEditPage.debug) {
            console.debug('LiveEditPage.destroy', win);
        }

        SkipLiveEditReloadConfirmationEvent.un(this.skipConfirmationListener, win);

        InitializeLiveEditEvent.un(this.initializeListener, win);

        this.unregisterGlobalListeners();
    }

    private registerGlobalListeners(): void {
        this.unloadListener = () => {
            if (!this.skipNextReloadConfirmation) {
                // do remove to trigger model unbinding
            } else {
                this.skipNextReloadConfirmation = false;
            }
            this.pageView.remove();
        };

        WindowDOM.get().onUnload(this.unloadListener);

        this.dragStartedListener = () => {
            Highlighter.get().hide();
            SelectedHighlighter.get().hide();
            Shader.get().hide();
            Cursor.get().hide();

            // dragging anything should exit the text edit mode
            //this.exitTextEditModeIfNeeded();
        };

        ComponentViewDragStartedEvent.on(this.dragStartedListener);

        this.dragStoppedListener = () => {
            Cursor.get().reset();

            if (this.pageView.isLocked()) {
                Highlighter.get().hide();
                Shader.get().shade(this.pageView);
            }
        };

        ComponentViewDragStoppedEvent.on(this.dragStoppedListener);

        this.selectComponentRequestedListener = (event: SelectComponentViewEvent): void => {
            if (!event.getPath()) {
                return;
            }

            const path: ComponentPath = ComponentPath.fromString(event.getPath());
            const itemView: ItemView = this.getItemViewByPath(path);

            if (itemView && !itemView.isSelected()) {
                itemView.select(null, ItemViewContextMenuPosition.NONE, event.isSilent());
                itemView.scrollComponentIntoView();
            }
        };

        SelectComponentViewEvent.on(this.selectComponentRequestedListener);

        this.deselectComponentRequestedListener = (event: DeselectComponentViewEvent): void => {
            const path: ComponentPath = event.getPath() ? ComponentPath.fromString(event.getPath()) : null;

            if (path) {
                const itemView = this.getItemViewByPath(path);

                if (itemView && !itemView.isSelected()) {
                    itemView.deselect(true);
                }
            } else {
                this.pageView.getSelectedView()?.deselect(true);
            }
        };

        DeselectComponentViewEvent.on(this.deselectComponentRequestedListener);

        this.editTextComponentRequestedListener = (event: EditTextComponentViewEvent): void => {
            const path: ComponentPath = event.getPath() ? ComponentPath.fromString(event.getPath()) : null;

            if (path) {
                const itemView: ItemView = this.getItemViewByPath(path);

                if (itemView?.isText()) {
                    (itemView as TextComponentView).setEditMode(true);
                    itemView.giveFocus();
                }
            }
        };

        EditTextComponentViewEvent.on(this.editTextComponentRequestedListener);

        this.setComponentStateEventListener = (event: SetComponentStateEvent): void => {
            const path: ComponentPath = event.getPath() ? ComponentPath.fromString(event.getPath()) : null;
            const itemView: ItemView = path ? this.getItemViewByPath(path) : null;

            if (itemView?.isText()) {
                if (event.isProcessing()) {
                    itemView.showLoadingSpinner();
                } else {
                    itemView.hideLoadingSpinner();
                }
            }
        };

        SetComponentStateEvent.on(this.setComponentStateEventListener);

        this.addItemViewRequestListener = (event: AddComponentViewEvent) => {
            console.info('LiveEditPage: AddComponentViewEvent received', event);
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const type: ComponentType = ComponentType.byShortName(event.getComponentType().getShortName());
            const viewType: ItemType = ItemType.fromComponentType(type);
            const parentView: ItemView = this.getItemViewByPath(path.getParentPath());

            if (parentView) {
                parentView.addComponentView(parentView.createView(viewType), path.getPath() as number, true);
            }
        };

        AddComponentViewEvent.on(this.addItemViewRequestListener);

        this.removeItemViewRequestListener = (event: RemoveComponentViewEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const view: ItemView = this.getItemViewByPath(path);

            if (view) {
                if (view.isSelected()) {
                    view.deselect(true);
                }

                view.remove();
            }
        };

        RemoveComponentViewEvent.on(this.removeItemViewRequestListener);

        this.loadComponentRequestListener = (event: LoadComponentViewEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const view: ItemView = this.getItemViewByPath(path);

            if (view instanceof ComponentView) {
                this.loadComponent(view, event.getURI(), event.isExisting()).catch((reason) => {
                    console.warn(`LiveEditPage: loadComponent at [${path}] failed:`, reason);
                    new LoadComponentFailedEvent(path, reason).fire();
                });
            }
        };

        LoadComponentViewEvent.on(this.loadComponentRequestListener);

        this.duplicateComponentViewRequestedListener = (event: DuplicateComponentViewEvent) => {
            const newItemPath: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const sourceItemPath: ComponentPath = new ComponentPath(newItemPath.getPath() as number - 1, newItemPath.getParentPath());
            const view: ItemView = this.getItemViewByPath(sourceItemPath);

            if (view instanceof ComponentView) {
                view.duplicate();
            }
        };

        DuplicateComponentViewEvent.on(this.duplicateComponentViewRequestedListener);

        this.moveComponentViewRequestedListener = (event: MoveComponentViewEvent) => {
            const from: ComponentPath = ComponentPath.fromString(event.getFrom().toString());
            const to: ComponentPath = ComponentPath.fromString(event.getTo().toString());

            const itemToMove: ItemView = this.getItemViewByPath(from);
            const regionViewTo: ItemView = this.getItemViewByPath(to.getParentPath());

            if (itemToMove instanceof ComponentView && regionViewTo instanceof RegionView) {
                itemToMove.moveToRegion(regionViewTo, to.getPath() as number);
            }
        };

        MoveComponentViewEvent.on(this.moveComponentViewRequestedListener);

        const contentId = this.pageView?.getLiveEditParams().contentId;

        this.beforeContentSavedListener = (): void => {
            SessionStorageHelper.removeSelectedPathInStorage(contentId);
            SessionStorageHelper.removeSelectedTextCursorPosInStorage(contentId);

            if (!this.pageView) {
                return;
            }

            const selected: ItemView = this.pageView.getSelectedView();

            if (selected instanceof ComponentView) {
                SessionStorageHelper.updateSelectedPathInStorage(contentId, selected.getPath());

                if (PageViewController.get().isTextEditMode() && selected instanceof TextComponentView) {
                    SessionStorageHelper.updateSelectedTextCursorPosInStorage(contentId, selected.getCursorPosition());
                }
            } else if (selected instanceof RegionView) {
                SessionStorageHelper.updateSelectedPathInStorage(contentId, selected.getPath());
            }
        };

        IframeBeforeContentSavedEvent.on(this.beforeContentSavedListener);

        this.setPageLockStateListener = (event: SetPageLockStateEvent): void => {
            this.pageView?.setLocked(event.isToLock());
        };

        SetPageLockStateEvent.on(this.setPageLockStateListener);

        this.setModifyAllowedListener = (event: SetModifyAllowedEvent): void => {
            this.pageView?.setModifyPermissions(event.isModifyAllowed());
        };

        SetModifyAllowedEvent.on(this.setModifyAllowedListener);

        this.createOrDestroyDraggableListener = (event: CreateOrDestroyDraggableEvent): void => {

            console.debug(`CreateOrDestroyDraggableListener:`, event);

            const item = jQuery(`<div ${'data-' + ItemType.ATTRIBUTE_TYPE}="${event.getType()}"></div>`).appendTo(jQuery('body'));
            if (event.isCreate()) {
                this.pageView?.createDraggable(item);
                // show the helper of the iframe draggable
                // it's a function so call it to get element and wrap in jquery to show
                item.simulate('mousedown').hide();
                jQuery(item.draggable('option', 'helper')()).show();
            } else {
                this.pageView?.destroyDraggable(item);
                item.simulate('mouseup');
                jQuery(item.draggable('option', 'helper')()).hide();
                item.remove();
            }
        };

        // TODO refactor CreateOrDestroyDraggableEvent to IframeEvent: has jQuery dependency !!!
        CreateOrDestroyDraggableEvent.on(this.createOrDestroyDraggableListener);

        this.resetComponentViewRequestListener = (event: ResetComponentViewEvent): void => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const view: ItemView = this.getItemViewByPath(path);

            if (view instanceof ComponentView) {
                view.reset();
            }
        };

        ResetComponentViewEvent.on(this.resetComponentViewRequestListener);

        this.pageStateListener = (event: PageStateEvent): void => {
            PageState.setState(event.getPageJson() ? new PageBuilder().fromJson(event.getPageJson()).build() : null);
        };

        // TODO: Refactor PageStateEvent to IframeEvent
        PageStateEvent.on(this.pageStateListener);

        this.updateTextComponentViewListener = (event: UpdateTextComponentViewEvent): void => {
            if (event.getOrigin() === 'live') {
                return;
            }

            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const view: ItemView = this.getItemViewByPath(path);

            if (view instanceof TextComponentView) {
                view.setText(event.getText());
            }
        };

        UpdateTextComponentViewEvent.on(this.updateTextComponentViewListener);
    }

    private getItemViewByPath(path: ComponentPath): ItemView {
        if (!path) {
            return;
        }

        return this.pageView?.getComponentViewByPath(path);
    }

    private unregisterGlobalListeners(): void {

        WindowDOM.get().unUnload(this.unloadListener);

        ComponentViewDragStartedEvent.un(this.dragStartedListener);

        ComponentViewDragStoppedEvent.un(this.dragStoppedListener);

        SelectComponentViewEvent.un(this.selectComponentRequestedListener);

        DeselectComponentViewEvent.un(this.deselectComponentRequestedListener);

        EditTextComponentViewEvent.un(this.editTextComponentRequestedListener);

        SetComponentStateEvent.un(this.setComponentStateEventListener);

        AddComponentViewEvent.un(this.addItemViewRequestListener);

        RemoveComponentViewEvent.un(this.removeItemViewRequestListener);

        LoadComponentViewEvent.un(this.loadComponentRequestListener);

        DuplicateComponentViewEvent.un(this.duplicateComponentViewRequestedListener);

        MoveComponentViewEvent.un(this.moveComponentViewRequestedListener);

        IframeBeforeContentSavedEvent.un(this.beforeContentSavedListener);

        SetPageLockStateEvent.un(this.setPageLockStateListener);

        SetModifyAllowedEvent.un(this.setModifyAllowedListener);

        // CreateOrDestroyDraggableEvent.un(this.createOrDestroyDraggableListener);

        ResetComponentViewEvent.un(this.resetComponentViewRequestListener);

        // PageStateEvent.un(this.pageStateListener);

        UpdateTextComponentViewEvent.un(this.updateTextComponentViewListener);
    }

    public loadComponent(componentView: ComponentView, componentUrl: string, isExisting: boolean): Promise<void> {
        assertNotNull(componentView, 'componentView cannot be null');
        assertNotNull(componentUrl, 'componentUrl cannot be null');

        componentView.showLoadingSpinner();

        return fetch(componentUrl)
            .then(response => {
                if (!isExisting) {
                    const hasContributions = response.headers.has('X-Has-Contributions');

                    // reloading entire live page if the component has contributions and there are no equal components on the page
                    if (hasContributions && !this.hasSameComponentOnPage(componentView.getPath())) {
                        new PageReloadRequestedEvent().fire();
                        return;
                    }
                }

                return response.text().then(htmlAsString => {
                    this.handleComponentHtml(componentView, htmlAsString);
                })
            });
    }

    private hasSameComponentOnPage(path: ComponentPath): boolean {
        const component = PageState.getComponentByPath(path);

        if (component instanceof DescriptorBasedComponent) {
            const key = component.getDescriptorKey();
            const allPageComponents = PageHelper.flattenPageComponents(PageState.getState());

            return allPageComponents.some(
                (c) => !c.getPath().equals(path) && c instanceof DescriptorBasedComponent && c.getDescriptorKey()?.equals(key));
        }

        return false;
    }

    private handleComponentHtml(componentView: ComponentView, htmlAsString: string): void {
        const newElement: Element = this.wrapLoadedComponentHtml(htmlAsString, componentView.getType());
        const itemViewIdProducer: ItemViewIdProducer = componentView.getItemViewIdProducer();
        const itemViewFactory: ItemViewFactory = componentView.getItemViewFactory();

        const createViewConfig: CreateItemViewConfig<RegionView> = new CreateItemViewConfig<RegionView>()
            .setItemViewIdProducer(itemViewIdProducer)
            .setItemViewFactory(itemViewFactory)
            .setLiveEditParams(this.pageView.getLiveEditParams())
            .setParentView(componentView.getParentItemView())
            .setPositionIndex(componentView.getPath().getPath() as number)
            .setElement(newElement);

        const newComponentView: ComponentView = itemViewFactory.createView(
            componentView.getType(),
            createViewConfig) as ComponentView;

        componentView.replaceWith(newComponentView);

        const parentItemView = newComponentView.getParentItemView();

        if (parentItemView instanceof RegionView) { // PageView for a fragment|
            newComponentView.getParentItemView().registerComponentViewListeners(newComponentView);
        }

        const event: ComponentLoadedEvent = new ComponentLoadedEvent(newComponentView.getPath());
        event.fire();
    }

    private wrapLoadedComponentHtml(htmlAsString: string, componentType: ComponentItemType): Element {
        if (FragmentItemType.get().equals(componentType)) {
            return this.wrapLoadedFragmentHtml(htmlAsString);
        }

        return Element.fromString(htmlAsString);
    }

    private wrapLoadedFragmentHtml(htmlAsString: string): Element {
        const sanitized: string = DOMPurify.sanitize(htmlAsString, {ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp()});
        const sanitizedElement: Element = Element.fromHtml(sanitized);

        const fragmentWrapperEl: Element = new DivEl();
        fragmentWrapperEl.getEl().setAttribute(`data-${ItemType.ATTRIBUTE_TYPE}`, 'fragment');
        fragmentWrapperEl.appendChild(sanitizedElement);

        return fragmentWrapperEl;
    }

    private getComponentErrorText(error) {
        if (!error || !error.message) {
            return '';
        }

        return new DOMParser().parseFromString(error.message, 'text/html').title ?? '';
    }
}
