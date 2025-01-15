import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {PageView, PageViewBuilder} from './PageView';
import {InitializeLiveEditEvent} from './InitializeLiveEditEvent';
import {SkipLiveEditReloadConfirmationEvent} from './SkipLiveEditReloadConfirmationEvent';
import {ComponentLoadedEvent} from './ComponentLoadedEvent';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {LiveEditPageInitializationErrorEvent} from './LiveEditPageInitializationErrorEvent';
import {DragAndDrop} from './DragAndDrop';
import {LiveEditPageViewReadyEvent} from './LiveEditPageViewReadyEvent';
import {LayoutItemType} from './layout/LayoutItemType';
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
import * as Q from 'q';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import * as $ from 'jquery';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {ItemViewSelectedEventConfig} from './event/outgoing/navigation/SelectComponentEvent';
import {ComponentItemType} from './ComponentItemType';
import {FragmentItemType} from './fragment/FragmentItemType';
import * as DOMPurify from 'dompurify';
import {HTMLAreaHelper} from '../app/inputtype/ui/text/HTMLAreaHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LoadComponentViewEvent} from './event/incoming/manipulation/LoadComponentViewEvent';
import {LoadComponentFailedEvent} from './event/outgoing/manipulation/LoadComponentFailedEvent';
import {UriHelper} from '../app/rendering/UriHelper';
import {RenderingMode} from '../app/rendering/RenderingMode';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ReloadFragmentViewEvent} from './event/incoming/manipulation/ReloadFragmentViewEvent';
import {FragmentComponentView} from './fragment/FragmentComponentView';
import {DuplicateComponentViewEvent} from './event/incoming/manipulation/DuplicateComponentViewEvent';
import {MoveComponentViewEvent} from './event/incoming/manipulation/MoveComponentViewEvent';
import {BeforeContentSavedEvent} from '../app/event/BeforeContentSavedEvent';
import {HtmlEditorCursorPosition} from '../app/inputtype/ui/text/HtmlEditor';
import {ContentSummaryAndCompareStatusFetcher} from '../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ContentId} from '../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../app/content/ContentSummaryAndCompareStatus';
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

export class LiveEditPage {

    public static SELECTED_PATH_STORAGE_KEY: string = 'contentstudio:liveedit:selectedPath';

    public static SELECTED_TEXT_CURSOR_POS_STORAGE_KEY: string = 'contentstudio:liveedit:textCursorPosition';

    private pageView: PageView;

    private skipNextReloadConfirmation: boolean = false;

    private initializeListener: (event: InitializeLiveEditEvent) => void;

    private skipConfirmationListener: (event: SkipLiveEditReloadConfirmationEvent) => void;

    private unloadListener: (event: UIEvent) => void;

    private componentLoadedListener: (event: ComponentLoadedEvent) => void;

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

    private static debug: boolean = false;

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
            console.debug('LiveEditPage: starting live edit initialization');
        }

        CONFIG.setConfig(event.getConfig());
        Messages.addMessages(JSON.parse(CONFIG.getString('phrasesAsJson')) as object);

        ProjectContext.get().setProject(Project.fromJson(event.getProjectJson()));
        PageState.setState(event.getPageJson() ? new PageBuilder().fromJson(event.getPageJson()).build() : null);

        // content is used for text components, but the best thing is to avoid extra server call to fetch entire content
        // could be optimized by: a) Using content id in HtmlArea b) Sending state's Page.toJson() to live edit frame
        const contentPromise: Q.Promise<void> = new ContentSummaryAndCompareStatusFetcher()
            .fetch(new ContentId(event.getParams().contentId))
            .then((content: ContentSummaryAndCompareStatus) => {
                ContentContext.get().setContent(content);
            });

        Q.all([contentPromise]).then(() => {
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

            Tooltip.allowMultipleInstances(false);

            this.registerGlobalListeners();

            if (LiveEditPage.debug) {
                console.debug('LiveEditPage: done live edit initializing in ' + (Date.now() - startTime) + 'ms');
            }

            this.restoreSelection();

            new LiveEditPageViewReadyEvent().fire();
        }).catch(DefaultErrorHandler.handle);
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

        this.componentLoadedListener = (event: ComponentLoadedEvent) => {

            if (LayoutItemType.get().equals(event.getNewComponentView().getType())) {
                DragAndDrop.get().createSortableLayout(event.getNewComponentView());
            } else {
                DragAndDrop.get().refreshSortable();
            }
        };

        ComponentLoadedEvent.on(this.componentLoadedListener);

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
                    (itemView as TextComponentView).startPageTextEditMode();
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
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const type: ComponentType = ComponentType.byShortName(event.getComponentType().getShortName());
            const viewType: ItemType = ItemType.fromComponentType(type);
            const parentView: ItemView = this.getItemViewByPath(path.getParentPath());

            if (parentView) {
                parentView.addComponentView(parentView.createView(viewType), path.getPath() as number);
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
                this.loadComponent(view, event.getURI()).catch((reason) => {
                    new LoadComponentFailedEvent(path, reason).fire();
                });
            }
        };

        LoadComponentViewEvent.on(this.loadComponentRequestListener);

        ReloadFragmentViewEvent.on((event: ReloadFragmentViewEvent) => {
            this.reloadFragment(event);
        });

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

        this.beforeContentSavedListener = (): void => {
            this.updateSelectedPathInStorage(null);
            this.updateSelectedTextCursorPosInStorage(null);

            if (!this.pageView) {
                return;
            }

            const selected: ItemView = this.pageView.getSelectedView();

            if (selected instanceof ComponentView) {
                this.updateSelectedPathInStorage(selected.getPath());

                if (this.pageView.isTextEditMode() && selected instanceof TextComponentView) {
                    this.updateSelectedTextCursorPosInStorage(selected.getCursorPosition());
                }
            } else if (selected instanceof RegionView) {
                this.updateSelectedPathInStorage(selected.getPath());
            }
        };

        BeforeContentSavedEvent.on(this.beforeContentSavedListener);

        this.setPageLockStateListener = (event: SetPageLockStateEvent): void => {
            this.pageView?.setLocked(event.isToLock());
        };

        SetPageLockStateEvent.on(this.setPageLockStateListener);

        this.setModifyAllowedListener = (event: SetModifyAllowedEvent): void => {
            this.pageView?.setModifyPermissions(event.isModifyAllowed());
        };

        SetModifyAllowedEvent.on(this.setModifyAllowedListener);

        this.createOrDestroyDraggableListener = (event: CreateOrDestroyDraggableEvent): void => {
            if (event.isCreate()) {
                this.pageView?.createDraggable(event.getItem());
            } else {
                this.pageView?.destroyDraggable(event.getItem());
            }
        };

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

        ComponentLoadedEvent.un(this.componentLoadedListener);

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

        BeforeContentSavedEvent.un(this.beforeContentSavedListener);

        SetPageLockStateEvent.un(this.setPageLockStateListener);

        SetModifyAllowedEvent.un(this.setModifyAllowedListener);

        CreateOrDestroyDraggableEvent.un(this.createOrDestroyDraggableListener);

        ResetComponentViewEvent.un(this.resetComponentViewRequestListener);

        PageStateEvent.un(this.pageStateListener);

        UpdateTextComponentViewEvent.un(this.updateTextComponentViewListener);
    }

    public loadComponent(componentView: ComponentView, componentUrl: string): Promise<void> {
        assertNotNull(componentView, 'componentView cannot be null');
        assertNotNull(componentUrl, 'componentUrl cannot be null');

        componentView.showLoadingSpinner();

        return fetch(componentUrl)
            .then(response => {
                const hasContributions = response.headers.has('X-Has-Contributions');

                // reloading entire live page if the component has contributions and there are no equal components on the page
                if (hasContributions && !this.hasSameComponentOnPage(componentView.getPath())) {
                    new PageReloadRequestedEvent().fire();
                    return;
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

        const event: ComponentLoadedEvent = new ComponentLoadedEvent(newComponentView);
        event.fire();

        const config = {itemView: newComponentView, position: null} as ItemViewSelectedEventConfig;
        newComponentView.select(config, null);
        newComponentView.hideContextMenu();
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

    private reloadFragment(event: ReloadFragmentViewEvent): void {
        const path = ComponentPath.fromString(event.getPath().toString());
        const fragmentView: ItemView = this.getItemViewByPath(path);

        if (fragmentView instanceof FragmentComponentView) {
            const componentUrl = UriHelper.getComponentUri(event.getContentId(), fragmentView.getPath(),
                RenderingMode.EDIT);

            fragmentView.showLoadingSpinner();

            this.loadComponent(fragmentView, componentUrl).catch((reason) => {
                DefaultErrorHandler.handle(reason);

                fragmentView.hideLoadingSpinner();
                fragmentView.showRenderingError(componentUrl, this.getComponentErrorText(reason));
            });
        }
    }

    private getComponentErrorText(error) {
        if (!error || !error.message) {
            return '';
        }

        return new DOMParser().parseFromString(error.message, 'text/html').title ?? '';
    }

    private restoreSelection(): void {
        const selectedItemViewPath: ComponentPath = this.getSelectedPathFromStorage();

        if (!selectedItemViewPath) {
            return;
        }

        const selected: ItemView = this.pageView.getComponentViewByPath(selectedItemViewPath);

        if (selected) {
            selected.selectWithoutMenu();
            selected.scrollComponentIntoView();

            const textEditorCursorPos: HtmlEditorCursorPosition = this.getSelectedTextCursorPosInStorage();

            if (textEditorCursorPos && selected instanceof TextComponentView) {
                this.setCursorPositionInTextComponent(selected, textEditorCursorPos);
                this.updateSelectedTextCursorPosInStorage(null);
            }
        }
    }

    private setCursorPositionInTextComponent(textComponentView: TextComponentView, textEditorCursorPos: HtmlEditorCursorPosition): void {
        this.pageView.appendContainerForTextToolbar();
        textComponentView.startPageTextEditMode();
        $(textComponentView.getHTMLElement()).simulate('click');

        textComponentView.onEditorReady(() =>
            setTimeout(() => textComponentView.setCursorPosition(textEditorCursorPos), 100)
        );
    }

    private updateSelectedPathInStorage(value: ComponentPath | null): void {
        const contentId: string = this.pageView?.getLiveEditParams().contentId;

        if (!contentId) {
            return;
        }

        if (value) {
            sessionStorage.setItem(`${LiveEditPage.SELECTED_PATH_STORAGE_KEY}:${contentId}`, value.toString());
        } else {
            sessionStorage.removeItem(`${LiveEditPage.SELECTED_PATH_STORAGE_KEY}:${contentId}`);
        }
    }

    private getSelectedPathFromStorage(): ComponentPath | null {
        const contentId: string = this.pageView?.getLiveEditParams().contentId;

        if (!contentId) {
            return;
        }

        const entry: string = sessionStorage.getItem(`${LiveEditPage.SELECTED_PATH_STORAGE_KEY}:${contentId}`);

        return entry ? ComponentPath.fromString(entry) : null;
    }

    private updateSelectedTextCursorPosInStorage(pos: HtmlEditorCursorPosition | null): void {
        const contentId: string = this.pageView?.getLiveEditParams().contentId;

        if (!contentId) {
            return;
        }

        if (pos) {
            sessionStorage.setItem(`${LiveEditPage.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`, JSON.stringify(pos));
        } else {
            sessionStorage.removeItem(`${LiveEditPage.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`);
        }
    }

    private getSelectedTextCursorPosInStorage(): HtmlEditorCursorPosition | null {
        const contentId: string = this.pageView?.getLiveEditParams().contentId;

        if (!contentId) {
            return;
        }

        const entry: string = sessionStorage.getItem(`${LiveEditPage.SELECTED_TEXT_CURSOR_POS_STORAGE_KEY}:${contentId}`);

        return entry ? JSON.parse(entry) : null;
    }
}
