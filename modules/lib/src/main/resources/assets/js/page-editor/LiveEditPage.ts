import {i18nInit} from '@enonic/lib-admin-ui/util/MessagesInitializer';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {PageView, PageViewBuilder} from './PageView';
import {InitializeLiveEditEvent} from './InitializeLiveEditEvent';
import {SkipLiveEditReloadConfirmationEvent} from './SkipLiveEditReloadConfirmationEvent';
import {ComponentLoadedEvent} from './ComponentLoadedEvent';
import {ComponentResetEvent} from './ComponentResetEvent';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {LiveEditPageInitializationErrorEvent} from './LiveEditPageInitializationErrorEvent';
import {DragAndDrop} from './DragAndDrop';
import {LiveEditPageViewReadyEvent} from './LiveEditPageViewReadyEvent';
import {PageUnloadedEvent} from './PageUnloadedEvent';
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
import {Component} from '../app/page/region/Component';
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

export class LiveEditPage {

    private pageView: PageView;

    private skipNextReloadConfirmation: boolean = false;

    private initializeListener: (event: InitializeLiveEditEvent) => void;

    private skipConfirmationListener: (event: SkipLiveEditReloadConfirmationEvent) => void;

    private beforeUnloadListener: (event: UIEvent) => void;

    private unloadListener: (event: UIEvent) => void;

    private componentLoadedListener: (event: ComponentLoadedEvent) => void;

    private componentResetListener: (event: ComponentResetEvent) => void;

    private dragStartedListener: () => void;

    private dragStoppedListener: () => void;

    private selectComponentRequestedListener: (event: SelectComponentViewEvent) => void;

    private deselectComponentRequestedListener: (event: DeselectComponentViewEvent) => void;

    private editTextComponentRequestedListener: (event: EditTextComponentViewEvent) => void;

    private addItemViewRequestListener: (event: AddComponentViewEvent) => void;

    private removeItemViewRequestListener: (event: RemoveComponentViewEvent) => void;

    private loadComponentRequestListener: (event: LoadComponentViewEvent) => void;

    private duplicateComponentRequested: (event: DuplicateComponentViewEvent) => void;

    private static debug: boolean = false;

    constructor() {
        this.skipConfirmationListener = (event: SkipLiveEditReloadConfirmationEvent) => {
            this.skipNextReloadConfirmation = event.isSkip();
        };

        SkipLiveEditReloadConfirmationEvent.on(this.skipConfirmationListener);

        this.initializeListener = this.init.bind(this);

        InitializeLiveEditEvent.on(this.initializeListener);
    }

    private init(event: InitializeLiveEditEvent) {
        let startTime = Date.now();
        if (LiveEditPage.debug) {
            console.debug('LiveEditPage: starting live edit initialization');
        }

        CONFIG.setConfig(event.getConfig());
        ProjectContext.get().setProject(Project.fromJson(event.getProjectJson()));

        i18nInit(CONFIG.getString('services.i18nUrl'), ['i18n/page-editor']).then(() => {
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
            new LiveEditPageViewReadyEvent(this.pageView).fire();
        });
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

        this.beforeUnloadListener = (event) => {
            if (!this.skipNextReloadConfirmation) {
                const message = 'This will close this wizard!';
                const e: {returnValue: boolean|string} = event || window.event || {returnValue: ''};
                e['returnValue'] = message;
                return message;
            }
        };

        WindowDOM.get().onBeforeUnload(this.beforeUnloadListener);

        this.unloadListener = () => {

            if (!this.skipNextReloadConfirmation) {
                new PageUnloadedEvent(this.pageView).fire();
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

        this.componentResetListener = (event: ComponentResetEvent) => {
            DragAndDrop.get().refreshSortable();
        };

        ComponentResetEvent.on(this.componentResetListener);

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
                    (<TextComponentView>itemView).startPageTextEditMode();
                }
            }
        };

        EditTextComponentViewEvent.on(this.editTextComponentRequestedListener);

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
                this.loadComponent(view, event.getURI()).then(() => {

                }).catch((reason) => {
                    new LoadComponentFailedEvent(path, reason).fire();
                });
            }
        };

        LoadComponentViewEvent.on(this.loadComponentRequestListener);

        ReloadFragmentViewEvent.on((event: ReloadFragmentViewEvent) => {
            this.reloadFragment(event);
        });

        this.duplicateComponentRequested = (event: DuplicateComponentViewEvent) => {
            const path: ComponentPath = ComponentPath.fromString(event.getComponentPath().toString());
            const view: ItemView = this.getItemViewByPath(path);

            if (view instanceof ComponentView) {
                view.duplicate();
            }
        };

        DuplicateComponentViewEvent.on(this.duplicateComponentRequested);
    }

    private getItemViewByPath(path: ComponentPath): ItemView {
        if (!path) {
            return;
        }

        return this.pageView?.getPath().equals(path) ? this.pageView : this.pageView?.getComponentViewByPath(path);
    }

    private unregisterGlobalListeners(): void {

        WindowDOM.get().unBeforeUnload(this.beforeUnloadListener);

        WindowDOM.get().unUnload(this.unloadListener);

        ComponentLoadedEvent.un(this.componentLoadedListener);

        ComponentResetEvent.un(this.componentResetListener);

        ComponentViewDragStartedEvent.un(this.dragStartedListener);

        ComponentViewDragStoppedEvent.un(this.dragStoppedListener);

        SelectComponentViewEvent.un(this.selectComponentRequestedListener);

        DeselectComponentViewEvent.un(this.deselectComponentRequestedListener);

        EditTextComponentViewEvent.un(this.editTextComponentRequestedListener);

        AddComponentViewEvent.un(this.addItemViewRequestListener);

        RemoveComponentViewEvent.un(this.removeItemViewRequestListener);

        LoadComponentViewEvent.un(this.loadComponentRequestListener);

        DuplicateComponentViewEvent.un(this.duplicateComponentRequested);
    }

    public loadComponent(componentView: ComponentView<Component>, componentUrl: string,): Q.Promise<string> {
        const deferred = Q.defer<string>();
        assertNotNull(componentView, 'componentView cannot be null');
        assertNotNull(componentUrl, 'componentUrl cannot be null');

        componentView.showLoadingSpinner();

        $.ajax({
            url: componentUrl,
            type: 'GET',
            success: (htmlAsString: string) => {
                const newElement: Element = this.wrapLoadedComponentHtml(htmlAsString, componentView.getType());
                const itemViewIdProducer: ItemViewIdProducer = componentView.getItemViewIdProducer();
                const itemViewFactory: ItemViewFactory = componentView.getItemViewFactory();

                const createViewConfig: CreateItemViewConfig<RegionView, Component> = new CreateItemViewConfig<RegionView, Component>()
                    .setItemViewIdProducer(itemViewIdProducer)
                    .setItemViewFactory(itemViewFactory)
                    .setLiveEditParams(this.pageView.getLiveEditParams())
                    .setParentView(componentView.getParentItemView())
                    .setElement(newElement);

                const newComponentView: ComponentView<Component> = <ComponentView<Component>>itemViewFactory.createView(
                    componentView.getType(),
                    createViewConfig);

                componentView.replaceWith(newComponentView);

                const event: ComponentLoadedEvent = new ComponentLoadedEvent(newComponentView);
                event.fire();

                const config = <ItemViewSelectedEventConfig>{itemView: newComponentView, position: null};
                newComponentView.select(config, null);
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

                componentView.hideLoadingSpinner();
                componentView.showRenderingError(componentUrl, errorMessage);

                deferred.reject(errorMessage);
            }
        });

        return deferred.promise;
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

            this.loadComponent(fragmentView, componentUrl).catch((errorMessage: any) => {
                DefaultErrorHandler.handle(errorMessage);

                fragmentView.hideLoadingSpinner();
                fragmentView.showRenderingError(componentUrl, errorMessage);
            });
        }

    }
}
