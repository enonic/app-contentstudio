import {ComponentViewDragCanceledEvent} from '../../page-editor/ComponentViewDragCanceledEvent';
import {ComponentViewDragDroppedEvent} from '../../page-editor/ComponentViewDragDroppedEventEvent';
import {PageSelectedEvent} from '../../page-editor/PageSelectedEvent';
import {PageLockedEvent} from '../../page-editor/PageLockedEvent';
import {PageUnlockedEvent} from '../../page-editor/PageUnlockedEvent';
import {PageTextModeStartedEvent} from '../../page-editor/PageTextModeStartedEvent';
import {RegionSelectedEvent} from '../../page-editor/RegionSelectedEvent';
import {ItemViewSelectedEvent} from '../../page-editor/ItemViewSelectedEvent';
import {ItemViewDeselectedEvent} from '../../page-editor/ItemViewDeselectedEvent';
import {ComponentAddedEvent} from '../../page-editor/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page-editor/ComponentRemovedEvent';
import {ComponentDuplicatedEvent} from '../../page-editor/ComponentDuplicatedEvent';
import {ComponentInspectedEvent} from '../../page-editor/ComponentInspectedEvent';
import {LiveEditPageViewReadyEvent} from '../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../page-editor/LiveEditPageInitializationErrorEvent';
import {ComponentFragmentCreatedEvent} from '../../page-editor/ComponentFragmentCreatedEvent';
import {ComponentDetachedFromFragmentEvent} from '../../page-editor/ComponentDetachedFromFragmentEvent';
import {ShowWarningLiveEditEvent} from '../../page-editor/ShowWarningLiveEditEvent';
import {EditContentEvent} from '../event/EditContentEvent';
import {CreateHtmlAreaDialogEvent} from '../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ComponentPath} from '../page/region/ComponentPath';
import {Component} from '../page/region/Component';
import {ComponentType} from '../page/region/ComponentType';

export class PageEventsManager {

    private static INSTANCE: PageEventsManager;

    // Drag and drop events
    private componentViewDragStartedListeners: { (path: ComponentPath): void; }[] = [];

    private componentViewDragStoppedListeners: { (path: ComponentPath): void; }[] = [];

    private componentViewDragCanceledListeners: { (event: ComponentViewDragCanceledEvent): void; }[] = [];

    private componentViewDragDroppedListeners: { (event: ComponentViewDragDroppedEvent): void; }[] = [];

    // Page events

    private pageInspectRequestedListeners: { (): void; }[] = [];

    private savePageAsTemplateListeners: { (): void; }[] = [];

    private pageSelectedListeners: { (event: PageSelectedEvent): void; }[] = [];

    private pageLockedListeners: { (event: PageLockedEvent): void; }[] = [];

    private pageUnlockedListeners: { (event: PageUnlockedEvent): void; }[] = [];

    private pageTextModeStartedListeners: { (event: PageTextModeStartedEvent): void; }[] = [];

    // Region events

    private regionSelectedListeners: { (event: RegionSelectedEvent): void; }[] = [];

    // Item events

    private itemViewSelectedListeners: { (event: ItemViewSelectedEvent): void; }[] = [];

    private itemViewDeselectedListeners: { (event: ItemViewDeselectedEvent): void; }[] = [];

    // Component events

    private componentAddedListeners: { (event: ComponentAddedEvent): void; }[] = [];

    private componentRemovedListeners: { (event: ComponentRemovedEvent): void; }[] = [];

    private componentDuplicatedListeners: { (event: ComponentDuplicatedEvent): void; }[] = [];

    private componentInspectedListeners: { (event: ComponentInspectedEvent): void; }[] = [];

    private componentLoadedListeners: { (path: ComponentPath): void; }[] = [];

    private componentResetListeners: { (path: ComponentPath): void; }[] = [];



    private liveEditPageViewReadyListeners: { (event: LiveEditPageViewReadyEvent): void; }[] = [];

    private liveEditPageInitErrorListeners: { (event: LiveEditPageInitializationErrorEvent): void; }[] = [];

    private fragmentCreatedListeners: { (event: ComponentFragmentCreatedEvent): void; }[] = [];

    private fragmentLoadErrorListeners: { (path: ComponentPath): void; }[] = [];

    private componentDetachedListeners: { (event: ComponentDetachedFromFragmentEvent): void; }[] = [];

    private showWarningListeners: { (event: ShowWarningLiveEditEvent): void; }[] = [];

    private editContentListeners: { (event: EditContentEvent): void; }[] = [];

    private createHtmlAreaDialogListeners: { (event: CreateHtmlAreaDialogEvent): void; }[] = [];

    private dialogCreatedListeners: { (modalDialog: ModalDialog, config: any): void; }[] = [];

    private beforeLoadListeners: { (): void; }[] = [];

    private loadedListeners: { (): void; }[] = [];

    // Commands

    private pageResetRequestedListeners: { (): void; }[] = [];

    private componentSelectRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentInspectRequestedListeners: { (component: Component): void; }[] = [];

    private componentResetRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentRemoveRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentDuplicateRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentCreateFragmentRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentDetachFragmentRequestedListeners: { (path: ComponentPath): void; }[] = [];

    private componentInsertRequestedListeners: { (path: ComponentPath, type: ComponentType): void; }[] = [];

    private constructor() {
        //
    }

    static get(): PageEventsManager {
        if (!PageEventsManager.INSTANCE) {
            PageEventsManager.INSTANCE = new PageEventsManager();
        }

        return PageEventsManager.INSTANCE;
    }

    onComponentDragStarted(listener: (path: ComponentPath) => void) {
        this.componentViewDragStartedListeners.push(listener);
    }

    unComponentDragStarted(listener: (path: ComponentPath) => void) {
        this.componentViewDragStartedListeners = this.componentViewDragStartedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDragStarted(path: ComponentPath) {
        this.componentViewDragStartedListeners.forEach((listener) => listener(path));
    }

    onComponentDragStopped(listener: { (path: ComponentPath): void; }) {
        this.componentViewDragStoppedListeners.push(listener);
    }

    unComponentDragStopped(listener: { (path: ComponentPath): void; }) {
        this.componentViewDragStoppedListeners = this.componentViewDragStoppedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDragStopped(path: ComponentPath) {
        this.componentViewDragStoppedListeners.forEach((listener) => listener(path));
    }

    onComponentViewDragCanceled(listener: { (event: ComponentViewDragCanceledEvent): void; }) {
        this.componentViewDragCanceledListeners.push(listener);
    }

    unComponentViewDragCanceled(listener: { (event: ComponentViewDragCanceledEvent): void; }) {
        this.componentViewDragCanceledListeners = this.componentViewDragCanceledListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentViewDragCanceled(event: ComponentViewDragCanceledEvent) {
        this.componentViewDragCanceledListeners.forEach((listener) => listener(event));
    }

    onComponentViewDragDropped(listener: { (event: ComponentViewDragDroppedEvent): void; }) {
        this.componentViewDragDroppedListeners.push(listener);
    }

    unComponentViewDragDropped(listener: { (event: ComponentViewDragDroppedEvent): void; }) {
        this.componentViewDragDroppedListeners = this.componentViewDragDroppedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentViewDragDropped(event: ComponentViewDragDroppedEvent) {
        this.componentViewDragDroppedListeners.forEach((listener) => listener(event));
    }

    onPageSelected(listener: (event: PageSelectedEvent) => void) {
        this.pageSelectedListeners.push(listener);
    }

    unPageSelected(listener: (event: PageSelectedEvent) => void) {
        this.pageSelectedListeners = this.pageSelectedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageSelected(event: PageSelectedEvent) {
        this.pageSelectedListeners.forEach((listener) => listener(event));
    }

    onPageLocked(listener: (event: PageLockedEvent) => void) {
        this.pageLockedListeners.push(listener);
    }

    unPageLocked(listener: (event: PageLockedEvent) => void) {
        this.pageLockedListeners = this.pageLockedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageLocked(event: PageLockedEvent) {
        this.pageLockedListeners.forEach((listener) => listener(event));
    }

    onPageUnlocked(listener: (event: PageUnlockedEvent) => void) {
        this.pageUnlockedListeners.push(listener);
    }

    unPageUnlocked(listener: (event: PageUnlockedEvent) => void) {
        this.pageUnlockedListeners = this.pageUnlockedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageUnlocked(event: PageUnlockedEvent) {
        this.pageUnlockedListeners.forEach((listener) => listener(event));
    }

    onPageTextModeStarted(listener: (event: PageTextModeStartedEvent) => void) {
        this.pageTextModeStartedListeners.push(listener);
    }

    unPageTextModeStarted(listener: (event: PageTextModeStartedEvent) => void) {
        this.pageTextModeStartedListeners = this.pageTextModeStartedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageTextModeStarted(event: PageTextModeStartedEvent) {
        this.pageTextModeStartedListeners.forEach((listener) => listener(event));
    }

    onRegionSelected(listener: { (event: RegionSelectedEvent): void; }) {
        this.regionSelectedListeners.push(listener);
    }

    unRegionSelected(listener: { (event: RegionSelectedEvent): void; }) {
        this.regionSelectedListeners = this.regionSelectedListeners.filter((curr) => (curr !== listener));
    }

    notifyRegionSelected(event: RegionSelectedEvent) {
        this.regionSelectedListeners.forEach((listener) => listener(event));
    }

    onItemViewSelected(listener: { (event: ItemViewSelectedEvent): void; }) {
        this.itemViewSelectedListeners.push(listener);
    }

    unItemViewSelected(listener: { (event: ItemViewSelectedEvent): void; }) {
        this.itemViewSelectedListeners = this.itemViewSelectedListeners.filter((curr) => (curr !== listener));
    }

    notifyItemViewSelected(event: ItemViewSelectedEvent) {
        this.itemViewSelectedListeners.forEach((listener) => listener(event));
    }

    onItemViewDeselected(listener: { (event: ItemViewDeselectedEvent): void; }) {
        this.itemViewDeselectedListeners.push(listener);
    }

    unItemViewDeselected(listener: { (event: ItemViewDeselectedEvent): void; }) {
        this.itemViewDeselectedListeners = this.itemViewDeselectedListeners.filter((curr) => (curr !== listener));
    }

    notifyItemViewDeselected(event: ItemViewDeselectedEvent) {
        this.itemViewDeselectedListeners.forEach((listener) => listener(event));
    }

    onComponentAdded(listener: { (event: ComponentAddedEvent): void; }) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: { (event: ComponentAddedEvent): void; }) {
        this.componentAddedListeners = this.componentAddedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentAdded(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach((listener) => listener(event));
    }

    onComponentRemoved(listener: { (event: ComponentRemovedEvent): void; }) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: { (event: ComponentRemovedEvent): void; }) {
        this.componentRemovedListeners = this.componentRemovedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentRemoved(event: ComponentRemovedEvent) {
        this.componentRemovedListeners.forEach((listener) => listener(event));
    }

    onComponentDuplicated(listener: { (event: ComponentDuplicatedEvent): void; }) {
        this.componentDuplicatedListeners.push(listener);
    }

    unComponentDuplicated(listener: { (event: ComponentDuplicatedEvent): void; }) {
        this.componentDuplicatedListeners = this.componentDuplicatedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDuplicated(event: ComponentDuplicatedEvent) {
        this.componentDuplicatedListeners.forEach((listener) => listener(event));
    }

    onComponentInspected(listener: { (event: ComponentInspectedEvent): void; }) {
        this.componentInspectedListeners.push(listener);
    }

    unComponentInspected(listener: { (event: ComponentInspectedEvent): void; }) {
        this.componentInspectedListeners = this.componentInspectedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentInspected(event: ComponentInspectedEvent) {
        this.componentInspectedListeners.forEach((listener) => listener(event));
    }

    onPageInspectedRequested(listener: { (): void; }) {
        this.pageInspectRequestedListeners.push(listener);
    }

    unPageInspectedRequested(listener: { (): void; }) {
        this.pageInspectRequestedListeners = this.pageInspectRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageInspectedRequested() {
        this.pageInspectRequestedListeners.forEach((listener) => listener());
    }

    onPageResetRequested(listener: { (): void; }) {
        this.pageResetRequestedListeners.push(listener);
    }

    unPageResetRequested(listener: { (): void; }) {
        this.pageResetRequestedListeners = this.pageResetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageResetRequested() {
        this.pageResetRequestedListeners.forEach((listener) => listener());
    }

    onPageSaveAsTemplate(listener: { (): void; }) {
        this.savePageAsTemplateListeners.push(listener);
    }

    unPageSaveAsTemplate(listener: { (): void; }) {
        this.savePageAsTemplateListeners = this.savePageAsTemplateListeners.filter((curr) => (curr !== listener));
    }

    notifyPageSaveAsTemplate() {
        this.savePageAsTemplateListeners.forEach((listener) => listener());
    }

    onComponentLoaded(listener: { (path: ComponentPath): void; }) {
        this.componentLoadedListeners.push(listener);
    }

    unComponentLoaded(listener: { (path: ComponentPath): void; }) {
        this.componentLoadedListeners = this.componentLoadedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentLoaded(path: ComponentPath) {
        this.componentLoadedListeners.forEach((listener) => listener(path));
    }

    onComponentReset(listener: { (path: ComponentPath): void; }) {
        this.componentResetListeners.push(listener);
    }

    unComponentReset(listener: { (path: ComponentPath): void; }) {
        this.componentResetListeners = this.componentResetListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentReset(path: ComponentPath) {
        this.componentResetListeners.forEach((listener) => listener(path));
    }

    onLiveEditPageViewReady(listener: { (event: LiveEditPageViewReadyEvent): void; }) {
        this.liveEditPageViewReadyListeners.push(listener);
    }

    unLiveEditPageViewReady(listener: { (event: LiveEditPageViewReadyEvent): void; }) {
        this.liveEditPageViewReadyListeners = this.liveEditPageViewReadyListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageViewReady(event: LiveEditPageViewReadyEvent) {
        this.liveEditPageViewReadyListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageInitializationError(listener: { (event: LiveEditPageInitializationErrorEvent): void; }) {
        this.liveEditPageInitErrorListeners.push(listener);
    }

    unLiveEditPageInitializationError(listener: { (event: LiveEditPageInitializationErrorEvent): void; }) {
        this.liveEditPageInitErrorListeners = this.liveEditPageInitErrorListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageInitializationError(event: LiveEditPageInitializationErrorEvent) {
        this.liveEditPageInitErrorListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageDialogCreate(listener: { (event: CreateHtmlAreaDialogEvent): void; }) {
        this.createHtmlAreaDialogListeners.push(listener);
    }

    unLiveEditPageDialogCreate(listener: { (event: CreateHtmlAreaDialogEvent): void; }) {
        this.createHtmlAreaDialogListeners = this.createHtmlAreaDialogListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageDialogCreate(event: CreateHtmlAreaDialogEvent) {
        this.createHtmlAreaDialogListeners.forEach((listener) => listener(event));
    }

    onDialogCreated(listener: { (modalDialog: ModalDialog, config: any): void; }) {
        this.dialogCreatedListeners.push(listener);
    }

    unDialogCreated(listener: { (modalDialog: ModalDialog, config: any): void; }) {
        this.dialogCreatedListeners = this.dialogCreatedListeners.filter((curr) => (curr !== listener));
    }

    notifyDialogCreated(modalDialog: ModalDialog, config: any) {
        this.dialogCreatedListeners.forEach((listener) => listener(modalDialog, config));
    }

    onComponentFragmentCreated(listener: { (event: ComponentFragmentCreatedEvent): void; }) {
        this.fragmentCreatedListeners.push(listener);
    }

    unComponentFragmentCreated(listener: { (event: ComponentFragmentCreatedEvent): void; }) {
        this.fragmentCreatedListeners = this.fragmentCreatedListeners.filter((curr) => (curr !== listener));
    }

    notifyFragmentCreated(event: ComponentFragmentCreatedEvent) {
        this.fragmentCreatedListeners.forEach((listener) => listener(event));
    }

    onFragmentLoadError(listener: { (path: ComponentPath): void; }) {
        this.fragmentLoadErrorListeners.push(listener);
    }

    unFragmentLoadError(listener: { (path: ComponentPath): void; }) {
        this.fragmentLoadErrorListeners = this.fragmentLoadErrorListeners.filter((curr) => (curr !== listener));
    }

    notifyFragmentLoadError(path: ComponentPath) {
        this.fragmentLoadErrorListeners.forEach((listener) => listener(path));
    }

    onComponentDetached(listener: { (event: ComponentDetachedFromFragmentEvent): void; }) {
        this.componentDetachedListeners.push(listener);
    }

    unComponentDetached(listener: { (event: ComponentDetachedFromFragmentEvent): void; }) {
        this.componentDetachedListeners = this.componentDetachedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDetached(event: ComponentDetachedFromFragmentEvent) {
        this.componentDetachedListeners.forEach((listener) => listener(event));
    }

    onShowWarning(listener: { (event: ShowWarningLiveEditEvent): void; }) {
        this.showWarningListeners.push(listener);
    }

    unShowWarning(listener: { (event: ShowWarningLiveEditEvent): void; }) {
        this.showWarningListeners = this.showWarningListeners.filter((curr) => (curr !== listener));
    }

    notifyShowWarning(event: ShowWarningLiveEditEvent) {
        this.showWarningListeners.forEach((listener) => listener(event));
    }

    onEditContent(listener: { (event: EditContentEvent): void; }) {
        this.editContentListeners.push(listener);
    }

    unEditContent(listener: { (event: EditContentEvent): void; }) {
        this.editContentListeners = this.editContentListeners.filter((curr) => (curr !== listener));
    }

    notifyEditContent(event: EditContentEvent) {
        this.editContentListeners.forEach((listener) => listener(event));
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

    notifyLoaded() {
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

    notifyBeforeLoad() {
        this.beforeLoadListeners.forEach((listener) => {
            listener();
        });
    }

    onComponentSelectRequested(listener: { (path: ComponentPath): void; }) {
        this.componentSelectRequestedListeners.push(listener);
    }

    unComponentSelectRequested(listener: { (path: ComponentPath): void; }) {
        this.componentSelectRequestedListeners = this.componentSelectRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentSelectRequested(path: ComponentPath) {
        this.componentSelectRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentInspectRequested(listener: { (component: Component): void; }) {
        this.componentInspectRequestedListeners.push(listener);
    }

    unComponentInspectRequested(listener: { (component: Component): void; }) {
        this.componentInspectRequestedListeners = this.componentInspectRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentInspectRequested(component: Component) {
        this.componentInspectRequestedListeners.forEach((listener) => listener(component));
    }

    onComponentResetRequested(listener: { (path: ComponentPath): void; }) {
        this.componentResetRequestedListeners.push(listener);
    }

    unComponentResetRequested(listener: { (path: ComponentPath): void; }) {
        this.componentResetRequestedListeners = this.componentResetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentResetRequested(path: ComponentPath) {
        this.componentResetRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentRemoveRequested(listener: { (path: ComponentPath): void; }) {
        this.componentRemoveRequestedListeners.push(listener);
    }

    unComponentRemoveRequested(listener: { (path: ComponentPath): void; }) {
        this.componentRemoveRequestedListeners = this.componentRemoveRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentRemoveRequested(path: ComponentPath) {
        this.componentRemoveRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentDuplicateRequested(listener: { (path: ComponentPath): void; }) {
        this.componentDuplicateRequestedListeners.push(listener);
    }

    unComponentDuplicateRequested(listener: { (path: ComponentPath): void; }) {
        this.componentDuplicateRequestedListeners = this.componentDuplicateRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDuplicateRequested(path: ComponentPath) {
        this.componentDuplicateRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentCreateFragmentRequested(listener: { (path: ComponentPath): void; }) {
        this.componentCreateFragmentRequestedListeners.push(listener);
    }

    unComponentCreateFragmentRequested(listener: { (path: ComponentPath): void; }) {
        this.componentCreateFragmentRequestedListeners = this.componentCreateFragmentRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentCreateFragmentRequested(path: ComponentPath) {
        this.componentCreateFragmentRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentDetachFragmentRequested(listener: { (path: ComponentPath): void; }) {
        this.componentDetachFragmentRequestedListeners.push(listener);
    }

    unComponentDetachFragmentRequested(listener: { (path: ComponentPath): void; }) {
        this.componentDetachFragmentRequestedListeners = this.componentDetachFragmentRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDetachFragmentRequested(path: ComponentPath) {
        this.componentDetachFragmentRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentInsertRequested(listener: { (path: ComponentPath, type: ComponentType): void; }) {
        this.componentInsertRequestedListeners.push(listener);
    }

    unComponentInsertRequested(listener: { (path: ComponentPath, type: ComponentType): void; }) {
        this.componentInsertRequestedListeners = this.componentInsertRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentInsertRequested(path: ComponentPath, type: ComponentType) {
        this.componentInsertRequestedListeners.forEach((listener) => listener(path, type));
    }

}
