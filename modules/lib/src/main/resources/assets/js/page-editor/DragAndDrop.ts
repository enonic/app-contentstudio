import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {ComponentView} from './ComponentView';
import {ItemType} from './ItemType';
import {RegionView} from './RegionView';
import {FragmentItemType} from './fragment/FragmentItemType';
import {FragmentComponentView} from './fragment/FragmentComponentView';
import {DragPlaceholder} from './DragPlaceholder';
import {ComponentViewDragCanceledEvent} from './ComponentViewDragCanceledEvent';
import {ComponentViewDragDroppedEvent} from './ComponentViewDragDroppedEventEvent';
import {ComponentViewDragStoppedEvent} from './ComponentViewDraggingStoppedEvent';
import {ComponentViewDragStartedEvent} from './ComponentViewDragStartedEvent';
import {ComponentItemType} from './ComponentItemType';
import {RegionItemType} from './RegionItemType';
import {ItemView} from './ItemView';
import {PageView} from './PageView';
import {LayoutItemType} from './layout/LayoutItemType';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {assertState} from '@enonic/lib-admin-ui/util/Assert';
import {AddComponentEvent} from './event/outgoing/manipulation/AddComponentEvent';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {MoveComponentEvent} from './event/outgoing/manipulation/MoveComponentEvent';
import {Body} from '@enonic/lib-admin-ui/dom/Body';

export class DragAndDrop {

    public static debug: boolean = false;

    private static messageCounter: number = 0;

    private static instance: DragAndDrop;

    private pageView: PageView;

    // Set up selectors for jQuery.sortable configuration.
    public REGION_SELECTOR: string = RegionItemType.get().getConfig().getCssSelector();

    public ITEM_NOT_DRAGGABLE_SELECTOR: string = '.not-draggable';

    public PLACEHOLDER_CONTAINER_SELECTOR: string = 'live-edit-drag-placeholder-container';

    public DRAGGED_OVER_CLASS: string = 'dragged-over';

    public DRAGGING_ACTIVE_CLASS: string = 'dragging';

    public SORTABLE_ITEMS_SELECTOR: string;

    private dragging: boolean = false;

    private wasDropped: boolean = false;

    private newlyDropped: boolean = false;

    private wasDestroyed: boolean = false;

    private newItemItemType: ItemType;

    private draggedComponentView: ComponentView;

    private dragStartedListeners: ((componentView: ComponentView) => void)[] = [];
    private dragStoppedListeners: ((componentView: ComponentView) => void)[] = [];
    private droppedListeners: ((componentView: ComponentView, regionView: RegionView) => void)[] = [];
    private canceledListeners: ((componentView: ComponentView) => void)[] = [];

    public static init(pageView: PageView) {
        DragAndDrop.instance = new DragAndDrop(pageView);
    }

    public static get(): DragAndDrop {
        if (!DragAndDrop.instance) {
            throw Error('Do DragAndDrop.init(pageView) first');
        }
        return DragAndDrop.instance;
    }

    constructor(pageView: PageView) {
        this.pageView = pageView;
        this.SORTABLE_ITEMS_SELECTOR = this.createSortableItemsSelector();
        this.createSortable($(this.REGION_SELECTOR));
    }

    isDragging(): boolean {
        return this.dragging;
    }

    createSortableLayout(component: ItemView) {
        $(component.getHTMLElement()).find(this.REGION_SELECTOR).each((index, element) => {
            this.createSortable($(element));
        });
    }

    refreshSortable(): void {
        $(this.REGION_SELECTOR).sortable('refresh');
    }

    private processMouseOverRegionView(regionView: RegionView) {

        // Make sure no other region has the over class
        this.pageView.getItemViewsByType(RegionItemType.get()).forEach((region: RegionView) => {
            region.toggleClass(this.DRAGGED_OVER_CLASS, region.getPath().equals(regionView.getPath()));
        });

        // Need to update empty state if the only item
        // has been dragged out of the region (marked as moving)
        regionView.refreshEmptyState();

    }

    private processMouseOutRegionView(regionView: RegionView) {

        // Remove over class from region
        regionView.refreshEmptyState().removeClass(this.DRAGGED_OVER_CLASS);
    }

    createSortable(selector: JQuery<HTMLElement>): void {

        $(selector).sortable({
            // append helper to pageView so it doesn't jump when sortable jumps
            // because of adding/removing placeholder (appended to sortable by default)
            // Don't use Body.get() because it may return the parent's body if it had been called there earlier
            appendTo: document.body,
            revert: false,
            cancel: this.ITEM_NOT_DRAGGABLE_SELECTOR,
            connectWith: this.REGION_SELECTOR,
            items: this.SORTABLE_ITEMS_SELECTOR,
            distance: 20,
            delay: 50,
            tolerance: 'intersect',
            cursor: 'move',
            cursorAt: DragHelper.CURSOR_AT,
            scrollSensitivity: this.calculateScrollSensitivity(),
            placeholder: this.PLACEHOLDER_CONTAINER_SELECTOR,
            forceHelperSize: true,
            helper: (event, ui) => DragHelper.get().getHTMLElement(),
            start: (event, ui) => this.handleSortStart(event, ui),
            activate: (event, ui) => this.handleActivate(event, ui),
            over: (event, ui) => this.handleDragOver(event, ui),
            out: (event, ui) => this.handleDragOut(event, ui),
            beforeStop: (event, ui) => this.handleBeforeStop(event, ui),
            receive: (event, ui) => this.handleReceive(event, ui),
            deactivate: (event, ui) => this.handleDeactivate(event, ui),
            stop: (event, ui) => this.handleSortStop(event, ui),
            //change: (event, ui) => this.handleSortChange(event, ui),
            //update: (event, ui) => this.handleSortUpdate(event, ui),
            remove: (event, ui) => this.handleRemove(event, ui)
        });
    }

    // Used by the Context Window when dragging above the IFrame
    createDraggable(jq: JQuery) {

        this.newItemItemType = ItemType.fromHTMLElement(jq.get(0));

        jq.draggable({
            connectToSortable: this.REGION_SELECTOR,
            addClasses: false,
            cursor: 'move',
            appendTo: 'body',
            cursorAt: DragHelper.CURSOR_AT,
            helper: (event, ui) => DragHelper.get().getHTMLElement(),
            start: (event, ui) => this.handleDraggableStart(event, ui),
            stop: (event, ui) => this.handleDraggableStop(event, ui)
        });
    }

    // Used by the Context Window when dragging above the IFrame
    destroyDraggable(jq: JQuery) {
        jq.draggable('destroy');
        this.wasDestroyed = true;
    }

    /*
     *  Sortable start is not fired in Firefox when dragging item from context window
     *  So listen for the draggable events as well
     */
    handleDraggableStart(event: Event, ui: JQueryUI.DraggableEventUIParams) {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleDraggableStart');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        Body.get().appendChild(DragHelper.get());

        this.notifyDragStarted(this.draggedComponentView);
    }

    /*
     *  Sortable stop is not fired in Firefox when dragging item from context window
     *  So listen for the draggable events as well
     */
    handleDraggableStop(event: Event, ui: JQueryUI.DraggableEventUIParams) {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleDraggableStop');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        Body.get().removeChild(DragHelper.get());

        if (!this.wasDropped) {
            this.notifyCanceled(this.draggedComponentView);
        }

        this.notifyDragStopped(this.draggedComponentView);
    }

    /*
     *  This event is triggered when sorting starts.
     */
    handleSortStart(event: JQueryEventObject, ui: JQueryUI.SortableUIParams): void {

        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleSortStart');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        let regionView: RegionView = this.getRegionView(ui.item.parent());

        let itemType: ItemType;
        let placeholder = DragPlaceholder.get().setRegionView(regionView);

        if (this.isDraggingFromContextWindow()) {
            // Dragging from context window
            itemType = this.newItemItemType;
        } else {
            // Dragging between sortables
            this.draggedComponentView = this.getComponentView(ui.item);

            this.draggedComponentView.deselect();
            this.draggedComponentView.setMoving(true);

            itemType = this.draggedComponentView.getType();
        }

        // Set it as html first time only
        // update the singleton after
        ui.placeholder.append(placeholder.setItemType(itemType).getHTMLElement());
        ui.helper.show();

        this.processMouseOverRegionView(regionView);

        this.updateHelperAndPlaceholder(regionView);

        this.updateScrollSensitivity(event.target);

        this.notifyDragStarted(this.draggedComponentView);
    }

    /*
     * This event is triggered when sorting stops, but when the placeholder/helper is still available.
     */
    handleBeforeStop(event: JQueryEventObject, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleBeforeStop');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        ui.helper.hide();
    }

    /*
     * This event is triggered when sorting has stopped.
     */
    handleSortStop(event: JQueryEventObject, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleSortStop');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        if (this.wasDestroyed) {
            this.cancelDrag(event.target as HTMLElement);
            this.wasDestroyed = false;
            return;
        }

        let regionView: RegionView = this.getRegionView(ui.item.parent());

        if (!DragHelper.get().isDropAllowed()) {
            // Don't allow to drop if it is forbidden (i.e. layout on layout, or outside region)
            if (DragAndDrop.debug) {
                console.log('DragAndDrop.handleStop: cancelling drag because it is not allowed to drop here...');
            }

            this.cancelDrag(event.target as HTMLElement);
        } else {
            let componentIndex = $('>.drag-helper, >.' + StyleHelper.getCls('item-view'),
                regionView.getHTMLElement()).index(ui.item);

            if (this.isDraggingFromContextWindow()) {
                // Create component and view if we drag from context window
                const componentType: ComponentItemType = this.newItemItemType as ComponentItemType;
                const path = new ComponentPath(componentIndex, regionView.getPath());
                new AddComponentEvent(path, componentType.toComponentType()).fire();
                this.notifyDropped(null, path, regionView);
            } else {
                const from: ComponentPath = this.draggedComponentView.getPath();
                const to: ComponentPath = new ComponentPath(componentIndex, regionView.getPath());
                new MoveComponentEvent(from, to).fire();
                this.notifyDropped(from, to, regionView);
            }
        }

        if (!this.isDraggingFromContextWindow()) {
            this.draggedComponentView.setMoving(false);
        }

        regionView.refreshEmptyState();

        this.notifyDragStopped(this.draggedComponentView);

        // Cleanup

        if (this.isDraggingFromContextWindow()) {
            // remove item if dragging from context window
            ui.item.remove();
        }
        this.newItemItemType = null;
        this.draggedComponentView = null;
        this.newlyDropped = true;

        // in FF after item was dragged a redundant click event is fired
        setTimeout(() => {
            this.newlyDropped = false;
        }, 100);
    }

    isNewlyDropped(): boolean {
        return this.newlyDropped;
    }

    /*
     * This event is triggered when using connected lists, every connected list on drag start receives it.
     */
    handleActivate(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleActivate');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        this.getRegionView($(event.target as HTMLElement)).addClass(this.DRAGGING_ACTIVE_CLASS);
    }

    /*
     * This event is triggered when sorting was stopped, is propagated to all possible connected lists.
     */
    handleDeactivate(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleDeactivate');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        this.getRegionView($(event.target as HTMLElement)).removeClass(this.DRAGGING_ACTIVE_CLASS);
    }

    /*
     *  This event is triggered when a sortable item is moved into a sortable list.
     */
    handleDragOver(event: Event, ui: JQueryUI.SortableUIParams): void {

        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleDragOver');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        let regionView: RegionView = this.getRegionView(ui.placeholder.parent());

        this.processMouseOverRegionView(regionView);

        this.updateHelperAndPlaceholder(regionView);
    }

    /*
     *  This event is triggered when a sortable item is moved away from a sortable list.
     */
    handleDragOut(event: Event, ui: JQueryUI.SortableUIParams): void {

        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleDragOut');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        if (!ui.placeholder || !ui.placeholder.parent()[0]) {
            if (DragAndDrop.debug) {
                console.log(
                    'DragAndDrop.handleDragOut skipping because there is no placeholder, probably item has been already dropped...');
            }
            return;
        }

        let regionView: RegionView = this.getRegionView(ui.placeholder.parent());

        this.processMouseOutRegionView(regionView);

        this.updateHelperAndPlaceholder(regionView, false);
    }

    /*
     *  This event is triggered during sorting, but only when the DOM position has changed.
     */
    handleSortChange(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleSortChange');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

    }

    /*
     *  This event is triggered when the user stopped sorting and the DOM position has changed.
     */
    handleSortUpdate(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleSortUpdate');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

    }

    /*
     * This event is triggered when a sortable item from the list has been dropped into another. The former is the event target.
     */
    handleRemove(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleRemove');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        let fromRegionView = this.getRegionView($(event.target as HTMLElement));
        fromRegionView.refreshEmptyState();
    }

    // This event is triggered when an item from a connected sortable list has been dropped into another list.
    // The latter is the event target.
    handleReceive(event: Event, ui: JQueryUI.SortableUIParams): void {
        if (DragAndDrop.debug) {
            console.groupCollapsed((DragAndDrop.messageCounter++) + ' DragDropSort.handleReceive');
            console.log('Event', event, '\nUI', ui);
            console.groupEnd();
        }

        let toRegionView = this.getRegionView($(event.target as HTMLElement));
        toRegionView.refreshEmptyState();
    }

    private cancelDrag(sortable: HTMLElement) {

        $(sortable).sortable('cancel');

        this.notifyCanceled(this.draggedComponentView);
    }

    onDragStarted(listener: (componentView: ComponentView) => void) {
        this.dragStartedListeners.push(listener);
    }

    unDragStarted(listener: (componentView: ComponentView) => void) {
        this.dragStartedListeners = this.dragStartedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyDragStarted(componentView: ComponentView) {
        if (DragAndDrop.debug) {
            console.log('DragAndDrop.notifyDragStarted', componentView);
        }

        this.dragging = true;
        this.wasDropped = false;
        this.dragStartedListeners.forEach((curr) => {
            curr(componentView);
        });

        new ComponentViewDragStartedEvent(componentView?.getPath()).fire();
    }

    onDragStopped(listener: (componentView: ComponentView) => void) {
        this.dragStoppedListeners.push(listener);
    }

    unDragStopped(listener: (componentView: ComponentView) => void) {
        this.dragStoppedListeners = this.dragStoppedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyDragStopped(componentView: ComponentView) {
        if (DragAndDrop.debug) {
            console.log('DragAndDrop.notifyDragStopped', componentView);
        }

        this.dragging = false;
        DragHelper.get().reset();
        this.dragStoppedListeners.forEach((curr) => {
            curr(componentView);
        });

        new ComponentViewDragStoppedEvent(componentView?.getPath()).fire();
    }

    onDropped(listener: (componentView: ComponentView, regionView: RegionView) => void) {
        this.droppedListeners.push(listener);
    }

    unDropped(listener: (componentView: ComponentView, regionView: RegionView) => void) {
        this.droppedListeners = this.droppedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyDropped(from: ComponentPath, to: ComponentPath, regionView: RegionView) {
        if (DragAndDrop.debug) {
            console.log('DragAndDrop.notifyDropped', from, to, regionView);
        }

        this.wasDropped = true;
        new ComponentViewDragDroppedEvent(from, to).fire();
    }

    onCanceled(listener: (componentView: ComponentView) => void) {
        this.canceledListeners.push(listener);
    }

    unCanceled(listener: (componentView: ComponentView) => void) {
        this.canceledListeners = this.canceledListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyCanceled(componentView: ComponentView) {
        if (DragAndDrop.debug) {
            console.log('DragAndDrop.notifyCanceled', componentView);
        }

        this.canceledListeners.forEach((curr) => {
            curr(componentView);
        });

        new ComponentViewDragCanceledEvent(componentView).fire();
    }

    private updateHelperAndPlaceholder(regionView: RegionView, enter: boolean = true) {
        let helper = DragHelper.get();
        let placeholder = DragPlaceholder.get().setRegionView(enter ? regionView : null);

        helper.setItemName(this.draggedComponentView ? this.draggedComponentView.getName() : StringHelper.capitalize(
            i18n('field.' + this.getItemType().getShortName())));

        if (!enter) {
            helper.setDropAllowed(false);
        } else if (this.isDraggingLayoutOverLayout(regionView, this.getItemType())) {
            helper.setDropAllowed(false);
            placeholder.setText(i18n('notify.nestedLayouts'));
            placeholder.setDropAllowed(false);
        } else {
            helper.setDropAllowed(true);
        }
    }

    private getItemType(): ItemType {
        if (this.draggedComponentView) {
            return this.draggedComponentView.getType();
        } else if (this.newItemItemType) {
            return this.newItemItemType;
        } else {
            throw new Error(i18n('live.view.drag.error.sourceandtargetnull'));
        }
    }

    private isDraggingFromContextWindow(): boolean {
        return !!this.newItemItemType;
    }

    private isDraggingLayoutOverLayout(regionView: RegionView, draggingItemType: ItemType): boolean {
        const isFragment = FragmentItemType.get().equals(draggingItemType);
        const isLayout = !isFragment && LayoutItemType.get().equals(draggingItemType);

        if (isFragment || isLayout) {
            if (regionView.hasParentLayoutComponentView() && (isLayout || (this.draggedComponentView as FragmentComponentView)?.containsLayout())) {
                return true;
            }
        }

        return false;
    }

    private getComponentView(jq: JQuery): ComponentView {
        let comp = this.pageView.getComponentViewByElement(jq.get(0));
        assertState(!!comp, i18n('live.view.drag.error.compviewisnull'));
        return comp;
    }

    private getRegionView(jq: JQuery): RegionView {
        let region = this.pageView.getRegionViewByElement(jq.get(0));
        assertState(!!region, i18n('live.view.drag.error.regionviewisnull'));
        return region;
    }

    private createSortableItemsSelector(): string {

        let sortableItemsSelector: string[] = [];
        ItemType.getDraggables().forEach((draggableItemType: ItemType) => {
            sortableItemsSelector.push(draggableItemType.getConfig().getCssSelector());
        });

        return sortableItemsSelector.toString();
    }

    private updateScrollSensitivity(selector: Element): void {
        let scrollSensitivity = this.calculateScrollSensitivity();
        $(selector).sortable('option', 'scrollSensitivity', scrollSensitivity);
    }

    private calculateScrollSensitivity(): number {
        // use getViewPortSize() instead of document.body.clientHeight
        // which returned the height of the whole rendered page,not just of the part visible in LiveEdit
        let height = $(window).height();
        let scrollSensitivity = Math.round(height / 8);
        scrollSensitivity = Math.max(20, Math.min(scrollSensitivity, 100));
        return scrollSensitivity;
    }

}
