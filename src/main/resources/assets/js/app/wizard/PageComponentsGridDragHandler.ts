import {Element} from 'lib-admin-ui/dom/Element';
import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {Event} from 'lib-admin-ui/event/Event';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Body} from 'lib-admin-ui/dom/Body';
import {ItemView} from '../../page-editor/ItemView';
import {Highlighter} from '../../page-editor/Highlighter';
import {ComponentView} from '../../page-editor/ComponentView';
import {ItemViewContextMenuPosition} from '../../page-editor/ItemViewContextMenuPosition';
import {RegionView} from '../../page-editor/RegionView';
import {LayoutComponentView} from '../../page-editor/layout/LayoutComponentView';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {PageView} from '../../page-editor/PageView';
import {RegionItemType} from '../../page-editor/RegionItemType';
import {Component} from '../page/region/Component';
import {DragEventData, GridDragHandler} from 'lib-admin-ui/ui/grid/GridDragHandler';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';

import {DragHelper} from 'lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {BodyMask} from 'lib-admin-ui/ui/mask/BodyMask';
import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';

export class PageComponentsGridDragHandler
    extends GridDragHandler<ItemView> {

    protected handleDragInit(e: DragEvent) {
        let row = this.getRowByTarget(new ElementHelper(<HTMLElement>e.target));
        let nodes = this.contentGrid.getRoot().getCurrentRoot().treeToList();
        let draggedNode = nodes[row.getSiblingIndex()];

        // prevent the grid from cancelling drag'n'drop by default
        if (draggedNode.getData().isDraggableView() && !BrowserHelper.isMobile()) {
            e.stopImmediatePropagation();
        }
    }

    protected handleDragStart() {
        super.handleDragStart();

        BodyMask.get().show();
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

    protected handleDragEnd(event: Event, data: any) {
        BodyMask.get().hide();
        Body.get().unMouseMove(this.handleHelperMove);
        Body.get().removeChild(DragHelper.get());

        this.contentGrid.unMouseLeave(this.handleMouseLeave);
        this.contentGrid.unMouseEnter(this.handleMouseEnter);

        super.handleDragEnd(event, data);
    }

    protected handleBeforeMoveRows(event: Event, data: any): boolean {

        let dataList = this.contentGrid.getRoot().getCurrentRoot().treeToList();

        let draggableRow = data.rows[0];
        let insertBefore = data.insertBefore;

        let insertPosition = (draggableRow > insertBefore) ? insertBefore : insertBefore + 1;

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

        let root = this.contentGrid.getRoot().getCurrentRoot();
        let dataList = root.treeToList();

        let item = dataList.slice(draggableRow, draggableRow + 1)[0];
        let insertPosition = (draggableRow > insertBefore) ? insertBefore : insertBefore + 1;

        this.moveIntoNewParent(item, insertPosition, dataList);

        dataList.splice(dataList.indexOf(item), 1);
        dataList.splice(insertBefore, 0, item);

        return dataList.indexOf(item);
    }

    protected getModelId(model: ItemView) {
        return model ? model.getItemId() : null;
    }

    protected moveIntoNewParent(item: TreeNode<ItemView>, insertBefore: number, data: TreeNode<ItemView>[]) {
        let insertData = this.getParentPosition(insertBefore, data);
        let regionPosition = insertData.parentPosition;
        let insertIndex = insertData.insertIndex;

        let newParent = data[regionPosition];

        if (!newParent.getData().getType().equals(RegionItemType.get())) {
            return;
        }

        if (newParent === item.getParent() && data.indexOf(item) < insertBefore) {
            insertIndex--;
        }

        this.contentGrid.deselectAll();
        item.getData().deselect();

        (<ComponentView<Component>>item.getData()).moveToRegion(<RegionView>newParent.getData(), insertIndex);

        item.getData().select(null, ItemViewContextMenuPosition.NONE);
        this.contentGrid.refresh();

        return data[regionPosition];
    }

    private updateDragHelperStatus(draggableRow: number, insertBeforePos: number, data: TreeNode<ItemView>[]) {

        let parentPosition = this.getParentPosition(insertBeforePos, data).parentPosition;

        let parentComponentNode = data[parentPosition];
        let parentComponentView = parentComponentNode.getData();
        let draggableComponentView = data[draggableRow].getData();

        if (parentComponentView) {

            if (ObjectHelper.iFrameSafeInstanceOf(draggableComponentView, LayoutComponentView)) {
                if (parentComponentView.getName() !== 'main') {
                    DragHelper.get().setDropAllowed(false);
                    return;
                }
            }

            if (ObjectHelper.iFrameSafeInstanceOf(parentComponentView, RegionView)) {

                if (ObjectHelper.iFrameSafeInstanceOf(draggableComponentView, FragmentComponentView)) {
                    if (ObjectHelper.iFrameSafeInstanceOf(parentComponentView.getParentItemView(), LayoutComponentView)) {
                        if ((<FragmentComponentView> draggableComponentView).containsLayout()) {
                            // Fragment with layout over Layout region
                            DragHelper.get().setDropAllowed(false);
                            return;
                        }
                    }
                }

                DragHelper.get().setDropAllowed(true);

                let draggableItem = this.getDraggableItem();
                if (draggableItem) {
                    this.updateDraggableItemPosition(draggableItem, parentComponentNode.calcLevel());
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

    private getParentPosition(insertBeforePos: number, data: TreeNode<ItemView>[]): InsertData {
        let parentPosition = insertBeforePos;
        let insertIndex = 0;

        const current = data[insertBeforePos];
        const previous = data[insertBeforePos - 1];

        if (!previous) {
            return {parentPosition: 0, insertIndex: 0};
        }

        const calcLevel = data[parentPosition - 1].calcLevel();

        const isFirstChildPosition = (current ? previous.calcLevel() < current.calcLevel() : false)
                                     || (ObjectHelper.iFrameSafeInstanceOf(previous.getData(), RegionView));

        let parentComponentNode;
        let parentComponentView;

        const check = (view, node) => {
            return !(ObjectHelper.iFrameSafeInstanceOf(view, RegionView)
                   // lets drag items inside the 'main' region between layouts
                   || (ObjectHelper.iFrameSafeInstanceOf(view, LayoutComponentView)
                       && (node.isExpanded() && node.getChildren().length > 0) )
                   || ObjectHelper.iFrameSafeInstanceOf(view, PageView))
                   || (node.calcLevel() >= calcLevel && !isFirstChildPosition);
        };

        do {
            parentPosition = parentPosition <= 0 ? 0 : parentPosition - 1;

            parentComponentNode = data[parentPosition];
            parentComponentView = parentComponentNode.getData();

            if (parentComponentNode.calcLevel() === calcLevel && !isFirstChildPosition) {
                insertIndex++;
            }

        } while (check(parentComponentView, parentComponentNode));

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

}

export interface InsertData {
    parentPosition: number;
    insertIndex: number;
}
