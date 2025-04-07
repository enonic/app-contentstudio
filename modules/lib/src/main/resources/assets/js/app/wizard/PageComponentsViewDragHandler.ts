import Sortable, {MoveEvent, SortableEvent} from 'sortablejs';
import {PageComponentsListElement, PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageEventsManager} from './PageEventsManager';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';

export class PageComponentsViewDragHandler {

    private readonly listToSort: PageComponentsTreeGrid;

    private readonly rootList: PageComponentsTreeGrid;

    private readonly moveHelperHandler: (event: MouseEvent) => void;

    private isLayoutDragging: boolean;

    private isDropAllowed: boolean;

    private allViews: PageComponentsListElement[] = [];

    constructor(root: PageComponentsTreeGrid, rootList: PageComponentsTreeGrid) {
        this.listToSort = root;
        this.rootList = rootList;
        this.moveHelperHandler = this.handleHelperMove.bind(this);

        this.initSortable();
    }

    private initSortable(): void {
        new Sortable(this.listToSort.getHTMLElement(), {
            group: {
                name: 'page-components',
            },
            swapThreshold: 0.5,
            filter: '.toggle, .region',
            sort: true,
            delay: 20, // need to hold touch/mouse pressed 20ms before drag starts
            animation: 300,
            forceFallback: true,
            onStart: (event: SortableEvent) => this.handleStart(event),
            onEnd: (event: SortableEvent) => this.handleEnd(event),
            onMove: (evt: MoveEvent, originalEvent: Event) => this.handleMoveEvent(evt, originalEvent),
        });
    }

    private handleEnd(event: Sortable.SortableEvent): void {
        this.setDropAllowed(false);
        this.rootList.removeClass('component-dragging');
        Body.get().unMouseMove(this.moveHelperHandler);
        Body.get().removeChild(DragHelper.get());

        const fromList = this.findListByElement(this.rootList, event.from);
        const toList = this.findListByElement(this.rootList, event.to);
        const fromParentPath = (fromList.getParentListElement() as PageComponentsListElement).getPath();
        const toParentPath = (toList.getParentListElement() as PageComponentsListElement).getPath();
        const fromPath = this.makeComponentPath(fromParentPath, event.oldIndex);
        const toPath = this.makeComponentPath(toParentPath, event.newIndex);

        if (fromPath?.equals(toPath)) {
            return;
        }

        event.to.removeChild(event.item);
        event.from.insertBefore(event.item, event.from.children.item(event.oldIndex));

        PageEventsManager.get().notifyComponentMoveRequested(fromPath, toPath);
    }

    private findListByElement(listToLookIn: PageComponentsTreeGrid, elToLookFor: HTMLElement): PageComponentsTreeGrid {
        let result: PageComponentsTreeGrid = null;

        listToLookIn.getItemViews().some((listElement: PageComponentsListElement) => {
            const list = listElement.getList() as PageComponentsTreeGrid;

            if (list.getHTMLElement() === elToLookFor) {
                result = list;
                return true;
            }

            result = this.findListByElement(list, elToLookFor);

            return !!result;
        });

        return result;
    }

    private makeComponentPath(parentPath: string, index: number): ComponentPath {
        return ComponentPath.fromString(`${parentPath}${ComponentPath.DIVIDER}${index}`);
    }

    private handleStart(event: SortableEvent): void {
        this.setDropAllowed(true);
        this.rootList.addClass('component-dragging');
        Body.get().appendChild(DragHelper.get());
        Body.get().onMouseMove(this.moveHelperHandler);

        this.isLayoutDragging = false;
        const allItems = this.rootList.getItems(true);
        this.allViews = allItems.map((item) => this.rootList.getItemView(item)).filter((view) => !!view) as PageComponentsListElement[];

        const draggedElement = this.findListElementById(event.item.id);

        if (draggedElement) {
            if (this.isLayout(draggedElement.getItem())) { // collapse layout if it's expanded
                draggedElement.collapse();
            }

            this.isLayoutDragging = this.isLayoutOrFragmentWithLayout(draggedElement.getItem());
        }
    }

    private isLayoutOrFragmentWithLayout(item: ComponentsTreeItem): boolean {
        return this.isLayout(item) || item.getComponent().isLayoutFragment();
    }

    private isLayout(item: ComponentsTreeItem): boolean {
        return item.getType() instanceof LayoutComponentType;
    }

    private handleMoveEvent(evt: MoveEvent, originalEvent: Event):  boolean | -1 | 1 | void {
        const currentlyOverList = this.findListById(evt.to.id);

        if (this.isLayoutDragging && currentlyOverList) {
            if (this.hasLayoutInParents(currentlyOverList)) {
                this.setDropAllowed(false);
                return false; // to forbid drop event
            }
        }

        this.setDropAllowed(true);
    }

    private findListElementById(id: string): PageComponentsListElement {
        return this.allViews.find((listElement: PageComponentsListElement) => listElement.getId() === id);
    }

    private findListById(id: string): PageComponentsTreeGrid {
        return this.allViews.find((listElement: PageComponentsListElement) => listElement.getList()?.getId() ===
                                                                              id)?.getParentList() as PageComponentsTreeGrid;
    }

    private hasLayoutInParents(list: PageComponentsTreeGrid): boolean {
        let parentItem = list.getParentListElement() as PageComponentsListElement;

        while (parentItem) {
            if (parentItem.getItem().getType() instanceof LayoutComponentType) {
                return true;
            }

            parentItem = parentItem.getParentList()?.getParentListElement() as PageComponentsListElement;
        }

        return false;
    }

    private setDropAllowed(value: boolean): void {
        this.isDropAllowed = value;
    }

    private handleHelperMove(event: MouseEvent): void {
        DragHelper.get().setDropAllowed(this.isDropAllowed);
        DragHelper.get().getEl().setLeftPx(event.pageX);
        DragHelper.get().getEl().setTopPx(event.pageY);
    }
}
