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
import {DefaultItemViewFactory} from './ItemViewFactory';
import {Exception} from '@enonic/lib-admin-ui/Exception';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {SaveAsTemplateAction} from '../app/wizard/action/SaveAsTemplateAction';
import {Project} from '../app/settings/data/project/Project';
import {CreateComponentFragmentRequestedEvent} from './event/CreateComponentFragmentRequestedEvent';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {SelectComponentRequestedEvent} from './event/SelectComponentRequestedEvent';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {ItemView} from './ItemView';
import {DeselectComponentRequestedEvent} from './event/DeselectComponentRequestedEvent';
import {EditTextComponentRequested} from './event/EditTextComponentRequested';
import {TextComponentView} from './text/TextComponentView';
import {AddItemViewRequest} from './event/AddItemViewRequest';
import {ComponentType} from '../app/page/region/ComponentType';
import {RegionView} from './RegionView';
import {ItemType} from './ItemType';

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

    private selectComponentRequestedListener: (event: SelectComponentRequestedEvent) => void;

    private deselectComponentRequestedListener: (event: DeselectComponentRequestedEvent) => void;

    private editTextComponentRequestedListener: (event: EditTextComponentRequested) => void;

    private addItemViewRequestListener: (event: AddItemViewRequest) => void;

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

        this.selectComponentRequestedListener = (event: SelectComponentRequestedEvent): void => {
            if (!event.getPath()) {
                return;
            }

            const path: ComponentPath = ComponentPath.fromString(event.getPath());
            const itemView: ItemView = this.getItemViewByPath(path);

            if (itemView && !itemView.isSelected()) {
                itemView.select(null, ItemViewContextMenuPosition.NONE, event.isSilent());
            }
        };

        SelectComponentRequestedEvent.on(this.selectComponentRequestedListener);

        this.deselectComponentRequestedListener = (event: DeselectComponentRequestedEvent): void => {
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

        DeselectComponentRequestedEvent.on(this.deselectComponentRequestedListener);

        this.editTextComponentRequestedListener = (event: EditTextComponentRequested): void => {
            const path: ComponentPath = event.getPath() ? ComponentPath.fromString(event.getPath()) : null;

            if (path) {
                const itemView: ItemView = this.getItemViewByPath(path);

                if (itemView?.isText()) {
                    (<TextComponentView>itemView).startPageTextEditMode();
                }
            }
        };

        EditTextComponentRequested.on(this.editTextComponentRequestedListener);

        this.addItemViewRequestListener = (event: AddItemViewRequest) => {
            const path = ComponentPath.fromString(event.getComponentPath().toString());
            const type: ComponentType = ComponentType.byShortName(event.getComponentType().getShortName());
            const viewType = ItemType.fromComponentType(type);
            const parentView: ItemView = this.getItemViewByPath(path.getParentPath());

            if (parentView) {
                parentView.addComponentView(parentView.createView(viewType), path.getPath() as number);
            }
        };

        AddItemViewRequest.on(this.addItemViewRequestListener);
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

        SelectComponentRequestedEvent.un(this.selectComponentRequestedListener);

        DeselectComponentRequestedEvent.un(this.deselectComponentRequestedListener);

        EditTextComponentRequested.un(this.editTextComponentRequestedListener);

        AddItemViewRequest.un(this.addItemViewRequestListener);
    }

}
