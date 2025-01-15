import {ComponentViewDragCanceledEvent} from '../../page-editor/ComponentViewDragCanceledEvent';
import {PageLockedEvent} from '../../page-editor/event/outgoing/manipulation/PageLockedEvent';
import {PageUnlockedEvent} from '../../page-editor/event/outgoing/manipulation/PageUnlockedEvent';
import {LiveEditPageViewReadyEvent} from '../../page-editor/LiveEditPageViewReadyEvent';
import {LiveEditPageInitializationErrorEvent} from '../../page-editor/LiveEditPageInitializationErrorEvent';
import {ShowWarningLiveEditEvent} from '../../page-editor/ShowWarningLiveEditEvent';
import {EditContentEvent} from '../event/EditContentEvent';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogConfig} from '../inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {ComponentPath} from '../page/region/ComponentPath';
import {ComponentType} from '../page/region/ComponentType';
import {PageTemplateKey} from '../page/PageTemplateKey';
import {PageControllerSetHandler, PageResetHandler, PageTemplateSetHandler} from '../page/Page';
import {DescriptorKey} from '../page/DescriptorKey';
import {PageTemplate} from '../content/PageTemplate';
import {ComponentTextUpdatedOrigin} from '../page/region/ComponentTextUpdatedOrigin';


export class PageEventsManager {

    private static INSTANCE: PageEventsManager;

    // Drag and drop events
    private componentViewDragStartedListeners: ((path: ComponentPath) => void)[] = [];

    private componentViewDragStoppedListeners: ((path: ComponentPath) => void)[] = [];

    private componentViewDragCanceledListeners: ((event: ComponentViewDragCanceledEvent) => void)[] = [];

    private componentDragDroppedListeners: ((path: ComponentPath) => void)[] = [];

    // Page events

    private savePageAsTemplateListeners: (() => void)[] = [];

    private pageLockedListeners: ((event: PageLockedEvent) => void)[] = [];

    private pageUnlockedListeners: ((event: PageUnlockedEvent) => void)[] = [];

    // Region events

    // Component events

    private componentLoadedListeners: ((path: ComponentPath) => void)[] = [];

    private componentLoadFailedListeners: ((path: ComponentPath, error: unknown) => void)[] = [];

    private liveEditPageViewReadyListeners: ((event: LiveEditPageViewReadyEvent) => void)[] = [];

    private liveEditPageInitErrorListeners: ((event: LiveEditPageInitializationErrorEvent) => void)[] = [];

    private fragmentLoadErrorListeners: ((path: ComponentPath) => void)[] = [];

    private showWarningListeners: ((event: ShowWarningLiveEditEvent) => void)[] = [];

    private editContentListeners: ((event: EditContentEvent) => void)[] = [];

    private createHtmlAreaDialogListeners: ((event: CreateHtmlAreaDialogEvent) => void)[] = [];

    private dialogCreatedListeners: ((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => void)[] = [];

    private beforeLoadListeners: (() => void)[] = [];

    private loadedListeners: (() => void)[] = [];

    // Commands

    private pageResetRequestedListeners: PageResetHandler[] = [];

    private pageReloadRequestedListeners: (() => void)[] = [];

    private customizePageRequestedListeners: (() => void)[] = [];

    private setCustomizedPageRequestedListeners: ((template: PageTemplate) => void)[] = [];

    private pageTemplateSetRequestedListeners: PageTemplateSetHandler[] = [];

    private pageControllerSetRequestedListeners: PageControllerSetHandler[] = [];

    private componentResetRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private componentRemoveRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private componentDescriptorSetRequestedListeners: ((path: ComponentPath, descriptorKey: DescriptorKey) => void)[] = [];

    private componentDuplicateRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private componentMoveRequestedListeners: ((from: ComponentPath, to: ComponentPath) => void)[] = [];

    private componentCreateFragmentRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private componentDetachFragmentRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private componentAddRequestedListeners: ((path: ComponentPath, type: ComponentType) => void)[] = [];

    private setFragmentComponentRequestedListeners: ((path: ComponentPath, id: string) => void)[] = [];

    private textComponentUpdateRequestedListeners: ((path: ComponentPath, value: string, origin?: ComponentTextUpdatedOrigin) => void)[] = [];

    private textComponentEditRequestedListeners: ((path: ComponentPath) => void)[] = [];

    private setComponentStateListeners: ((path: ComponentPath, processing: boolean) => void)[] = [];

    private textComponentEditModeListeners: ((value: boolean) => void)[] = [];

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

    onComponentDragStopped(listener: ((path: ComponentPath) => void)): void {
        this.componentViewDragStoppedListeners.push(listener);
    }

    unComponentDragStopped(listener: ((path: ComponentPath) => void)): void {
        this.componentViewDragStoppedListeners = this.componentViewDragStoppedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDragStopped(path: ComponentPath) {
        this.componentViewDragStoppedListeners.forEach((listener) => listener(path));
    }

    onComponentViewDragCanceled(listener: ((event: ComponentViewDragCanceledEvent) => void)): void {
        this.componentViewDragCanceledListeners.push(listener);
    }

    unComponentViewDragCanceled(listener: ((event: ComponentViewDragCanceledEvent) => void)): void {
        this.componentViewDragCanceledListeners = this.componentViewDragCanceledListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentViewDragCanceled(event: ComponentViewDragCanceledEvent) {
        this.componentViewDragCanceledListeners.forEach((listener) => listener(event));
    }

    onComponentDragDropped(listener: ((path: ComponentPath) => void)): void {
        this.componentDragDroppedListeners.push(listener);
    }

    unComponentViewDragDropped(listener: ((path: ComponentPath) => void)): void {
        this.componentDragDroppedListeners = this.componentDragDroppedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentViewDragDropped(path: ComponentPath) {
        this.componentDragDroppedListeners.forEach((listener) => listener(path));
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

    onPageResetRequested(listener: PageResetHandler) {
        this.pageResetRequestedListeners.push(listener);
    }

    unPageResetRequested(listener: PageResetHandler) {
        this.pageResetRequestedListeners = this.pageResetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageResetRequested() {
        this.pageResetRequestedListeners.forEach((listener) => listener());
    }

    onPageSaveAsTemplate(listener: (() => void)) {
        this.savePageAsTemplateListeners.push(listener);
    }

    unPageSaveAsTemplate(listener: (() => void)) {
        this.savePageAsTemplateListeners = this.savePageAsTemplateListeners.filter((curr) => (curr !== listener));
    }

    notifyPageSaveAsTemplate() {
        this.savePageAsTemplateListeners.forEach((listener) => listener());
    }

    onComponentLoaded(listener: ((path: ComponentPath) => void)) {
        this.componentLoadedListeners.push(listener);
    }

    unComponentLoaded(listener: ((path: ComponentPath) => void)) {
        this.componentLoadedListeners = this.componentLoadedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentLoaded(path: ComponentPath) {
        this.componentLoadedListeners.forEach((listener) => listener(path));
    }

    onComponentLoadFailed(listener: ((path: ComponentPath, error: unknown) => void)) {
        this.componentLoadFailedListeners.push(listener);
    }

    unComponentLoadFailed(listener: ((path: ComponentPath, error: unknown) => void)) {
        this.componentLoadFailedListeners = this.componentLoadFailedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentLoadFailed(path: ComponentPath, error: unknown) {
        this.componentLoadFailedListeners.forEach((listener) => listener(path, error));
    }

    onLiveEditPageViewReady(listener: ((event: LiveEditPageViewReadyEvent) => void)) {
        this.liveEditPageViewReadyListeners.push(listener);
    }

    unLiveEditPageViewReady(listener: ((event: LiveEditPageViewReadyEvent) => void)) {
        this.liveEditPageViewReadyListeners = this.liveEditPageViewReadyListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageViewReady(event: LiveEditPageViewReadyEvent) {
        this.liveEditPageViewReadyListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageInitializationError(listener: ((event: LiveEditPageInitializationErrorEvent) => void)) {
        this.liveEditPageInitErrorListeners.push(listener);
    }

    unLiveEditPageInitializationError(listener: ((event: LiveEditPageInitializationErrorEvent) => void)) {
        this.liveEditPageInitErrorListeners = this.liveEditPageInitErrorListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageInitializationError(event: LiveEditPageInitializationErrorEvent) {
        this.liveEditPageInitErrorListeners.forEach((listener) => listener(event));
    }

    onLiveEditPageDialogCreate(listener: ((event: CreateHtmlAreaDialogEvent) => void)) {
        this.createHtmlAreaDialogListeners.push(listener);
    }

    unLiveEditPageDialogCreate(listener: ((event: CreateHtmlAreaDialogEvent) => void)) {
        this.createHtmlAreaDialogListeners = this.createHtmlAreaDialogListeners.filter((curr) => (curr !== listener));
    }

    notifyLiveEditPageDialogCreate(event: CreateHtmlAreaDialogEvent) {
        this.createHtmlAreaDialogListeners.forEach((listener) => listener(event));
    }

    onDialogCreated(listener: ((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => void)) {
        this.dialogCreatedListeners.push(listener);
    }

    unDialogCreated(listener:  ((modalDialog: ModalDialog, config: HtmlAreaDialogConfig) => void)) {
        this.dialogCreatedListeners = this.dialogCreatedListeners.filter((curr) => (curr !== listener));
    }

    notifyDialogCreated(modalDialog: ModalDialog, config: HtmlAreaDialogConfig) {
        this.dialogCreatedListeners.forEach((listener) => listener(modalDialog, config));
    }

    onFragmentLoadError(listener: ((path: ComponentPath) => void)) {
        this.fragmentLoadErrorListeners.push(listener);
    }

    unFragmentLoadError(listener: ((path: ComponentPath) => void)) {
        this.fragmentLoadErrorListeners = this.fragmentLoadErrorListeners.filter((curr) => (curr !== listener));
    }

    notifyFragmentLoadError(path: ComponentPath) {
        this.fragmentLoadErrorListeners.forEach((listener) => listener(path));
    }

    onShowWarning(listener: ((event: ShowWarningLiveEditEvent) => void)) {
        this.showWarningListeners.push(listener);
    }

    unShowWarning(listener: ((event: ShowWarningLiveEditEvent) => void)) {
        this.showWarningListeners = this.showWarningListeners.filter((curr) => (curr !== listener));
    }

    notifyShowWarning(event: ShowWarningLiveEditEvent) {
        this.showWarningListeners.forEach((listener) => listener(event));
    }

    onEditContent(listener: ((event: EditContentEvent) => void)): void {
        this.editContentListeners.push(listener);
    }

    unEditContent(listener: ((event: EditContentEvent) => void)): void {
        this.editContentListeners = this.editContentListeners.filter((curr) => (curr !== listener));
    }

    notifyEditContent(event: EditContentEvent) {
        this.editContentListeners.forEach((listener) => listener(event));
    }

    onLoaded(listener: (() => void)): void {
        this.loadedListeners.push(listener);
    }

    unLoaded(listener: (() => void)): void {
        this.loadedListeners = this.loadedListeners
            .filter(function (curr: (() => void)) {
                return curr !== listener;
            });
    }

    notifyLoaded() {
        this.loadedListeners.forEach((listener) => {
            listener();
        });
    }

    onBeforeLoad(listener: (() => void)): void {
        this.beforeLoadListeners.push(listener);
    }

    unBeforeLoad(listener: (() => void)): void {
        this.beforeLoadListeners = this.beforeLoadListeners
            .filter(function (curr: (() => void)) {
                return curr !== listener;
            });
    }

    notifyBeforeLoad() {
        this.beforeLoadListeners.forEach((listener) => {
            listener();
        });
    }

    onComponentResetRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentResetRequestedListeners.push(listener);
    }

    unComponentResetRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentResetRequestedListeners = this.componentResetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentResetRequested(path: ComponentPath) {
        this.componentResetRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentRemoveRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentRemoveRequestedListeners.push(listener);
    }

    unComponentRemoveRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentRemoveRequestedListeners = this.componentRemoveRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentRemoveRequested(path: ComponentPath) {
        this.componentRemoveRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentDuplicateRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentDuplicateRequestedListeners.push(listener);
    }

    unComponentDuplicateRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentDuplicateRequestedListeners = this.componentDuplicateRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDuplicateRequested(path: ComponentPath) {
        this.componentDuplicateRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentCreateFragmentRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentCreateFragmentRequestedListeners.push(listener);
    }

    unComponentCreateFragmentRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentCreateFragmentRequestedListeners = this.componentCreateFragmentRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentCreateFragmentRequested(path: ComponentPath) {
        this.componentCreateFragmentRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentDetachFragmentRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentDetachFragmentRequestedListeners.push(listener);
    }

    unComponentDetachFragmentRequested(listener: ((path: ComponentPath) => void)): void {
        this.componentDetachFragmentRequestedListeners = this.componentDetachFragmentRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDetachFragmentRequested(path: ComponentPath) {
        this.componentDetachFragmentRequestedListeners.forEach((listener) => listener(path));
    }

    onComponentAddRequested(listener: ((path: ComponentPath, type: ComponentType) => void)): void {
        this.componentAddRequestedListeners.push(listener);
    }

    unComponentAddRequested(listener: ((path: ComponentPath, type: ComponentType) => void)): void {
        this.componentAddRequestedListeners = this.componentAddRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentAddRequested(path: ComponentPath, type: ComponentType) {
        this.componentAddRequestedListeners.forEach((listener) => listener(path, type));
    }

    onPageTemplateSetRequested(listener: PageTemplateSetHandler): void {
        this.pageTemplateSetRequestedListeners.push(listener);
    }

    unPageTemplateSetRequested(listener: PageTemplateSetHandler): void {
        this.pageTemplateSetRequestedListeners = this.pageTemplateSetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageTemplateSetRequested(pageTemplate: PageTemplateKey): void {
        this.pageTemplateSetRequestedListeners.forEach((listener) => listener(pageTemplate));
    }

    onPageControllerSetRequested(listener: PageControllerSetHandler): void {
        this.pageControllerSetRequestedListeners.push(listener);
    }

    unPageControllerSetRequested(listener: PageControllerSetHandler): void {
        this.pageControllerSetRequestedListeners = this.pageControllerSetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageControllerSetRequested(controller: DescriptorKey): void {
        this.pageControllerSetRequestedListeners.forEach((listener) => listener(controller));
    }

    onSetFragmentComponentRequested(listener: ((parentPath: ComponentPath, id: string) => void)): void {
        this.setFragmentComponentRequestedListeners.push(listener);
    }

    unSetFragmentComponentRequested(listener: ((parentPath: ComponentPath, id: string) => void)): void {
        this.setFragmentComponentRequestedListeners = this.setFragmentComponentRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifySetFragmentComponentRequested(parentPath: ComponentPath, id: string) {
        this.setFragmentComponentRequestedListeners.forEach((listener) => listener(parentPath, id));
    }

    onComponentDescriptorSetRequested(listener: ((path: ComponentPath, descriptorKey: DescriptorKey) => void)): void {
        this.componentDescriptorSetRequestedListeners.push(listener);
    }

    unComponentDescriptorSetRequested(listener: ((path: ComponentPath, descriptorKey: DescriptorKey) => void)): void {
        this.componentDescriptorSetRequestedListeners = this.componentDescriptorSetRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentDescriptorSetRequested(path: ComponentPath, descriptorKey: DescriptorKey): void {
        this.componentDescriptorSetRequestedListeners.forEach((listener) => listener(path, descriptorKey));
    }

    onTextComponentUpdateRequested(listener: ((path: ComponentPath, value: string, origin?: ComponentTextUpdatedOrigin) => void)): void {
        this.textComponentUpdateRequestedListeners.push(listener);
    }

    untTextComponentUpdateRequested(listener: ((path: ComponentPath, value: string, origin?: ComponentTextUpdatedOrigin) => void)): void {
        this.textComponentUpdateRequestedListeners = this.textComponentUpdateRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyTextComponentUpdateRequested(path: ComponentPath, value: string, origin?: ComponentTextUpdatedOrigin): void {
        this.textComponentUpdateRequestedListeners.forEach((listener) => listener(path, value, origin));
    }

    onSetComponentState(listener: ((path: ComponentPath, processing: boolean) => void)): void {
        this.setComponentStateListeners.push(listener);
    }

    unSetComponentState(listener: ((path: ComponentPath, processing: boolean) => void)): void {
        this.setComponentStateListeners = this.setComponentStateListeners.filter((curr) => (curr !== listener));
    }

    notifySetComponentState(path: ComponentPath, processing: boolean): void {
        this.setComponentStateListeners.forEach((listener) => listener(path, processing));
    }

    onTextComponentEditRequested(listener: ((path: ComponentPath) => void)): void {
        this.textComponentEditRequestedListeners.push(listener);
    }

    untTextComponentEditRequested(listener: ((path: ComponentPath) => void)): void {
        this.textComponentEditRequestedListeners = this.textComponentEditRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyTextComponentEditRequested(path: ComponentPath): void {
        this.textComponentEditRequestedListeners.forEach((listener) => listener(path));
    }

    onTextComponentEditModeChanged(listener: ((value: boolean) => void)): void {
        this.textComponentEditModeListeners.push(listener);
    }

    untTextComponentEditModeChanged(listener: ((value: boolean) => void)): void {
        this.textComponentEditModeListeners = this.textComponentEditModeListeners.filter((curr) => (curr !== listener));
    }

    notifyTextComponentEditModeChanged(value: boolean): void {
        this.textComponentEditModeListeners.forEach((listener) => listener(value));
    }

    onCustomizePageRequested(listener: () => void) {
        this.customizePageRequestedListeners.push(listener);
    }

    unCustomizePageRequested(listener: () => void) {
        this.customizePageRequestedListeners = this.customizePageRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyCustomizePageRequested() {
        this.customizePageRequestedListeners.forEach((listener) => listener());
    }

    onSetCustomizedPageRequested(listener: (template: PageTemplate) => void) {
        this.setCustomizedPageRequestedListeners.push(listener);
    }

    unSetCustomizedPageRequested(listener: (template: PageTemplate) => void) {
        this.setCustomizedPageRequestedListeners = this.setCustomizedPageRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifySetCustomizedPageRequested(template: PageTemplate) {
        this.setCustomizedPageRequestedListeners.forEach((listener) => listener(template));
    }

    onComponentMoveRequested(listener: ((from: ComponentPath, to: ComponentPath) => void)): void {
        this.componentMoveRequestedListeners.push(listener);
    }

    unComponentMoveRequested(listener: ((from: ComponentPath, to: ComponentPath) => void)): void {
        this.componentMoveRequestedListeners = this.componentMoveRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyComponentMoveRequested(from: ComponentPath, to: ComponentPath) {
        this.componentMoveRequestedListeners.forEach((listener) => listener(from, to));
    }

    onPageReloadRequested(listener: () => void): void {
        this.pageReloadRequestedListeners.push(listener);
    }

    unPageReloadRequested(listener: () => void): void {
        this.pageReloadRequestedListeners = this.pageReloadRequestedListeners.filter((curr) => (curr !== listener));
    }

    notifyPageReloadRequested(): void {
        this.pageReloadRequestedListeners.forEach((listener) => listener());
    }

}
