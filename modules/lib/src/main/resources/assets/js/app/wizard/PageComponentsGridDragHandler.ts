import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
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
import {DragEventData, GridDragHandler} from '@enonic/lib-admin-ui/ui/grid/GridDragHandler';

import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {BodyMask} from '@enonic/lib-admin-ui/ui/mask/BodyMask';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {ItemViewTreeGridWrapper} from '../../page-editor/ItemViewTreeGridWrapper';

export class PageComponentsGridDragHandler
    extends GridDragHandler<ItemViewTreeGridWrapper> {

    protected handleDragInit(e: DragEvent) {
        const row: ElementHelper = this.getRowByTarget(new ElementHelper(<HTMLElement>e.target));
        const data: ItemViewTreeGridWrapper = this.contentGrid.getDataByRow(this.getRowIndex(row));

        // prevent the grid from cancelling drag'n'drop by default
        if (!!data && data.getItemView().isDraggableView() && !BrowserHelper.isMobile()) {
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
        const dataList: ItemViewTreeGridWrapper[] = this.contentGrid.getCurrentData();

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
        const dataList: ItemViewTreeGridWrapper[] = this.contentGrid.getCurrentData();

        const item: ItemViewTreeGridWrapper = dataList.slice(draggableRow, draggableRow + 1)[0];
        const insertPosition: number = (draggableRow > insertBefore) ? insertBefore : insertBefore + 1;

        this.moveIntoNewParent(item, insertPosition, dataList);

        dataList.splice(dataList.indexOf(item), 1);
        dataList.splice(insertBefore, 0, item);

        return dataList.indexOf(item);
    }

    protected getModelId(model: ItemViewTreeGridWrapper) {
        return model ? model.getItemView().getItemId() : null;
    }

    protected moveIntoNewParent(item: ItemViewTreeGridWrapper, insertBefore: number, data: ItemViewTreeGridWrapper[]) {
        const insertData: InsertData = this.getParentPosition(insertBefore, data);
        const regionPosition: number = insertData.parentPosition;
        let insertIndex: number = insertData.insertIndex;

        let newParent: ItemViewTreeGridWrapper = data[regionPosition];

        if (!newParent.getItemView().getType().equals(RegionItemType.get())) {
            return;
        }

        if (newParent === this.contentGrid.getParentDataById(item.getId()) && data.indexOf(item) < insertBefore) {
            insertIndex--;
        }

        this.contentGrid.deselectAll();
        item.getItemView().deselect();

        (<ComponentView<Component>>item.getItemView()).moveToRegion(<RegionView>newParent.getItemView(), insertIndex);

        item.getItemView().select(null, ItemViewContextMenuPosition.NONE);

        return data[regionPosition];
    }

    private updateDragHelperStatus(draggableRow: number, insertBeforePos: number, data: ItemViewTreeGridWrapper[]) {

        const parentPosition: number = this.getParentPosition(insertBeforePos, data).parentPosition;
        const parentComponentView: ItemViewTreeGridWrapper = data[parentPosition];
        const draggableComponentView: ItemViewTreeGridWrapper = data[draggableRow];

        if (parentComponentView) {

            if (ObjectHelper.iFrameSafeInstanceOf(draggableComponentView.getItemView(), LayoutComponentView)) {
                if (parentComponentView.getItemView().getName() !== 'main') {
                    DragHelper.get().setDropAllowed(false);
                    return;
                }
            }

            if (ObjectHelper.iFrameSafeInstanceOf(parentComponentView.getItemView(), RegionView)) {

                if (ObjectHelper.iFrameSafeInstanceOf(draggableComponentView.getItemView(), FragmentComponentView)) {
                    if (ObjectHelper.iFrameSafeInstanceOf(parentComponentView.getItemView().getParentItemView(), LayoutComponentView)) {
                        if ((<FragmentComponentView> draggableComponentView.getItemView()).containsLayout()) {
                            // Fragment with layout over Layout region
                            DragHelper.get().setDropAllowed(false);
                            return;
                        }
                    }
                }

                DragHelper.get().setDropAllowed(true);

                let draggableItem = this.getDraggableItem();
                if (draggableItem) {
                    this.updateDraggableItemPosition(draggableItem, this.contentGrid.getDataLevel(parentComponentView));
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

    private getParentPosition(insertBeforePos: number, data: ItemViewTreeGridWrapper[]): InsertData {
        let parentPosition: number = insertBeforePos;
        let insertIndex: number = 0;

        const current: ItemViewTreeGridWrapper = data[insertBeforePos];
        const previous: ItemViewTreeGridWrapper = data[insertBeforePos - 1];

        if (!previous) {
            return {parentPosition: 0, insertIndex: 0};
        }

        const calcLevel = this.contentGrid.getDataLevel(data[parentPosition - 1]);

        const isFirstChildPosition = (current ? this.contentGrid.getDataLevel(previous) < this.contentGrid.getDataLevel(current) : false)
                                     || (ObjectHelper.iFrameSafeInstanceOf(previous.getItemView(), RegionView));

        let parentComponentView: ItemViewTreeGridWrapper;

        const check = (view: ItemViewTreeGridWrapper) => {
            return !(ObjectHelper.iFrameSafeInstanceOf(view.getItemView(), RegionView)
                   // lets drag items inside the 'main' region between layouts
                   || (ObjectHelper.iFrameSafeInstanceOf(view.getItemView(), LayoutComponentView)
                       && (this.contentGrid.isExpandedAndHasChildren(view.getId())))
                   || ObjectHelper.iFrameSafeInstanceOf(view.getItemView(), PageView))
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

}

export interface InsertData {
    parentPosition: number;
    insertIndex: number;
}
