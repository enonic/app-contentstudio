import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Highlighter} from '../../page-editor/Highlighter';
import {DragEventData, GridDragHandler} from '@enonic/lib-admin-ui/ui/grid/GridDragHandler';

import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {FragmentComponentType} from '../page/region/FragmentComponentType';
import {PageNavigationEventData} from './PageNavigationEventData';
import {PageEventsManager} from './PageEventsManager';
import {ComponentPath} from '../page/region/ComponentPath';

export interface PageComponentsHelperFunctions {
    getPathByItem: (item: ComponentsTreeItem) => ComponentPath;
    getItemByPath: (path: ComponentPath) => ComponentsTreeItem;
    isDropAllowed: (draggedItem: ComponentsTreeItem) => boolean;
}

export class PageComponentsGridDragHandler
    extends GridDragHandler<ComponentsTreeItem> {

    private helperFunctions: PageComponentsHelperFunctions;

    constructor(grid: TreeGrid<ComponentsTreeItem>, helperFunctions: PageComponentsHelperFunctions) {
        super(grid);

        this.helperFunctions = helperFunctions;
    }

    protected handleDragInit(e: DragEvent) {
        const row: ElementHelper = this.getRowByTarget(new ElementHelper(e.target as HTMLElement));
        const data: ComponentsTreeItem = this.contentGrid.getDataByRow(this.getRowIndex(row));

        // prevent the grid from cancelling drag'n'drop by default
        if (this.isItemDraggable(data) && !BrowserHelper.isMobile()) {
            e.stopImmediatePropagation();
        }
    }

    protected handleDragStart() {
        super.handleDragStart();

        Highlighter.get().hide();
        this.getDraggableItem().getChildren().forEach((childEl: Element) => {
            childEl.removeClass('selected');
        });

        DragHelper.get().setDropAllowed(true);

        Body.get().appendChild(DragHelper.get());
        Body.get().onMouseMove(this.handleHelperMove);

        this.contentGrid.onMouseLeave(this.handleMouseLeave);
        this.contentGrid.onMouseEnter(this.handleMouseEnter);
    }

    protected handleDragEnd(event: Event, data: DragEventData) {
        Body.get().unMouseMove(this.handleHelperMove);
        Body.get().removeChild(DragHelper.get());

        this.contentGrid.unMouseLeave(this.handleMouseLeave);
        this.contentGrid.unMouseEnter(this.handleMouseEnter);

        super.handleDragEnd(event, data);
    }

    protected handleBeforeMoveRows(event: Event, data: DragEventData): boolean {
        const dataList: ComponentsTreeItem[] = this.contentGrid.getCurrentData();

        const draggableRow: number = data.rows[0];
        const insertBefore: number = data.insertBefore;

        const insertPosition: number = (draggableRow > insertBefore) ? insertBefore : insertBefore + 1;

        if (DragHelper.get().isDropAllowed()) {
            super.handleBeforeMoveRows(event, data);
        }

        this.updateDragHelperStatus(draggableRow, insertPosition, dataList);

        return true;
    }

    protected handleMoveRows(event: Event, args: DragEventData) {
        if (DragHelper.get().isDropAllowed()) {
            super.handleMoveRows(event, args);
        }
    }

    protected makeMovementInNodes(draggableRow: number, insertBefore: number): number {
        const dataList: ComponentsTreeItem[] = this.contentGrid.getCurrentData();

        const item: ComponentsTreeItem = dataList.slice(draggableRow, draggableRow + 1)[0];
        const insertPosition: number = (draggableRow > insertBefore) ? insertBefore : insertBefore + 1;

        this.moveIntoNewParent(item, insertPosition, dataList);

        dataList.splice(dataList.indexOf(item), 1);
        dataList.splice(insertBefore, 0, item);

        return dataList.indexOf(item);
    }

    protected getModelId(model: ComponentsTreeItem) {
        return model ? model.getId() : null;
    }

    protected moveIntoNewParent(item: ComponentsTreeItem, insertBefore: number, data: ComponentsTreeItem[]) {
        const oldPath: ComponentPath = this.helperFunctions.getPathByItem(item);
        const insertData: InsertData = this.getParentPosition(insertBefore, data);
        const regionPosition: number = insertData.parentPosition;
        let insertIndex: number = insertData.insertIndex;

        let newParent: ComponentsTreeItem = data[regionPosition];

        if (newParent.getType() !== 'region') {
            return;
        }

        if (newParent === this.contentGrid.getParentDataById(item.getId()) && data.indexOf(item) < insertBefore) {
            insertIndex--;
        }

        this.contentGrid.deselectAll();

        PageNavigationMediator.get().notify(new PageNavigationEvent(PageNavigationEventType.DESELECT));

        const newPath: ComponentPath = new ComponentPath(insertIndex, this.helperFunctions.getPathByItem(newParent));
        PageEventsManager.get().notifyComponentMoveRequested(oldPath, newPath);

        PageNavigationMediator.get().notify(new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(newPath)));

        return data[regionPosition];
    }

    private updateDragHelperStatus(draggableRow: number, insertBeforePos: number, data: ComponentsTreeItem[]) {
        const parentPosition: number = this.getParentPosition(insertBeforePos, data).parentPosition;
        const parentTreeItem: ComponentsTreeItem = data[parentPosition];
        const draggedItem: ComponentsTreeItem = data[draggableRow];

        if (parentTreeItem) {
            if (parentTreeItem.getType() === 'region') {
                if (draggedItem.getType() instanceof FragmentComponentType) {
                    const grandParentPath: ComponentPath = this.helperFunctions.getPathByItem(parentTreeItem)?.getParentPath();
                    const grandParent: ComponentsTreeItem = grandParentPath ? this.helperFunctions.getItemByPath(grandParentPath) : null;

                    if (grandParent?.getType() instanceof LayoutComponentType) {
                        if (this.helperFunctions.isDropAllowed(draggedItem)) {
                            // Fragment with layout over Layout region
                            DragHelper.get().setDropAllowed(false);
                            return;
                        }
                    }
                }

                DragHelper.get().setDropAllowed(true);

                let draggableItem = this.getDraggableItem();
                if (draggableItem) {
                    this.updateDraggableItemPosition(draggableItem, this.contentGrid.getDataLevel(parentTreeItem));
                }
                return;
            }
        }
        DragHelper.get().setDropAllowed(false);
    }

    private updateDraggableItemPosition(draggableItem: Element, parentLevel: number) {
        let margin = parentLevel * TreeGrid.LEVEL_STEP_INDENT;
        let nodes = draggableItem.getEl().getElementsByClassName('toggle icon');

        if (nodes.length === 1) {
            nodes[0].setMarginLeft(margin + 'px');
        }
    }

    private getParentPosition(insertBeforePos: number, data: ComponentsTreeItem[]): InsertData {
        let parentPosition: number = insertBeforePos;
        let insertIndex: number = 0;

        const current: ComponentsTreeItem = data[insertBeforePos];
        const previous: ComponentsTreeItem = data[insertBeforePos - 1];

        if (!previous) {
            return {parentPosition: 0, insertIndex: 0};
        }

        const calcLevel = this.contentGrid.getDataLevel(data[parentPosition - 1]);

        const isFirstChildPosition = (current ? this.contentGrid.getDataLevel(previous) < this.contentGrid.getDataLevel(current) : false)
                                     || (previous.getType() === 'region');

        let parentComponentView: ComponentsTreeItem;

        const check = (view: ComponentsTreeItem) => {
            return !(view.getType() === 'region'
                   // lets drag items inside the 'main' region between layouts
                   || (view.getType() instanceof LayoutComponentType
                       && (this.contentGrid.isExpandedAndHasChildren(view.getId())))
                   || view.getType() === 'page')
                   || (this.contentGrid.getDataLevel(view) >= calcLevel && !isFirstChildPosition);
        };

        do {
            parentPosition = parentPosition <= 0 ? 0 : parentPosition - 1;

            parentComponentView = data[parentPosition];

            if (this.contentGrid.getDataLevel(parentComponentView) === calcLevel && !isFirstChildPosition) {
                insertIndex++;
            }

        } while (check(parentComponentView));

        return {parentPosition: parentPosition, insertIndex: insertIndex};
    }

    private getRowByTarget(el: ElementHelper): ElementHelper {
        return (el && el.hasClass('slick-row')) ? el : this.getRowByTarget(el.getParent());
    }

    private handleMouseLeave() {
        DragHelper.get().setVisible(false);
    }

    private handleMouseEnter() {
        DragHelper.get().setVisible(true);
    }

    private handleHelperMove(event: MouseEvent) {
        DragHelper.get().getEl().setLeftPx(event.pageX);
        DragHelper.get().getEl().setTopPx(event.pageY);
    }

    private isItemDraggable(item: ComponentsTreeItem): boolean {
        return item && item.getType() !== 'page' && item.getType() !== 'region';
    }

}

export interface InsertData {
    parentPosition: number;
    insertIndex: number;
}
