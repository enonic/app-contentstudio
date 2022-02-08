import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Body} from 'lib-admin-ui/dom/Body';
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
import {Exception} from 'lib-admin-ui/Exception';
import {Tooltip} from 'lib-admin-ui/ui/Tooltip';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {ProjectContext} from '../app/project/ProjectContext';
import {CONFIG} from 'lib-admin-ui/util/Config';

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
        ProjectContext.get().setProject(event.getProject());
        i18nInit(CONFIG.getString('services.i18nUrl'), ['i18n/page-editor']).then(() => {
            const liveEditModel = event.getLiveEditModel();
            const modifyPermissions = event.hasModifyPermissions();

            let body = Body.get().loadExistingChildren();
            try {
                this.pageView = new PageViewBuilder()
                    .setItemViewIdProducer(new ItemViewIdProducer())
                    .setItemViewFactory(new DefaultItemViewFactory())
                    .setLiveEditModel(liveEditModel)
                    .setModifyPermissions(modifyPermissions)
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

    }

    private unregisterGlobalListeners(): void {

        WindowDOM.get().unBeforeUnload(this.beforeUnloadListener);

        WindowDOM.get().unUnload(this.unloadListener);

        ComponentLoadedEvent.un(this.componentLoadedListener);

        ComponentResetEvent.un(this.componentResetListener);

        ComponentViewDragStartedEvent.un(this.dragStartedListener);

        ComponentViewDragStoppedEvent.un(this.dragStoppedListener);

    }

}
