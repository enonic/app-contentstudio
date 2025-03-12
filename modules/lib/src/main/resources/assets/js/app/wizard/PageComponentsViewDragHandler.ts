import Sortable, {MoveEvent, SortableEvent} from 'sortablejs';
import {PageComponentsListElement, PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageEventsManager} from './PageEventsManager';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';
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
            filter: '.toggle',
            sort: true,
            animation: 150,
            forceFallback: true,
            onStart: (event: SortableEvent) => this.handleStart(event),
            onEnd: (event: SortableEvent) => this.handleEnd(event),
            onMove: (evt: MoveEvent, originalEvent: Event) => this.handleMoveEvent(evt, originalEvent),
        });
    }

    private handleEnd(event: Sortable.SortableEvent): void {
        this.setDropAllowed(false);
        Body.get().unMouseMove(this.moveHelperHandler);
        Body.get().removeChild(DragHelper.get());

        event.to.removeChild(event.item);
        event.from.insertBefore(event.item, event.from.children.item(event.oldIndex));

        const fromList = this.findListByElement(this.rootList, event.from);
        const toList = this.findListByElement(this.rootList, event.to);
        const fromParentPath = (fromList.getParentListElement() as PageComponentsListElement).getPath();
        const toParentPath = (toList.getParentListElement() as PageComponentsListElement).getPath();
        const fromPath = this.makeComponentPath(fromParentPath, event.oldIndex);
        const toPath = this.makeComponentPath(toParentPath, event.newIndex);

        PageEventsManager.get().notifyComponentMoveRequested(fromPath, toPath);
        PageNavigationMediator.get().notify(new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(toPath)));
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
        Body.get().appendChild(DragHelper.get());
        Body.get().onMouseMove(this.moveHelperHandler);

        this.isLayoutDragging = false;
        const allItems = this.rootList.getItems(true);
        this.allViews = allItems.map((item) => this.rootList.getItemView(item)).filter((view) => !!view) as PageComponentsListElement[];

        const draggedElement = this.findListElementById(event.item.id);

        if (draggedElement) {
            this.isLayoutDragging = this.isLayoutOrFragmentWithLayout(draggedElement.getItem());
        }
    }

    private isLayoutOrFragmentWithLayout(item: ComponentsTreeItem): boolean {
        return item.getType() instanceof LayoutComponentType || item.getComponent().isLayoutFragment();
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
