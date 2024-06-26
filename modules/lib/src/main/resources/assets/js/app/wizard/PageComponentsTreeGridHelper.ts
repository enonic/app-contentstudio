import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageComponentsItemViewer} from './PageComponentsItemViewer';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {GridColumn, GridColumnBuilder} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {GridOptions, GridOptionsBuilder} from '@enonic/lib-admin-ui/ui/grid/GridOptions';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {PageComponentsMenuIcon} from './PageComponentsMenuIcon';
import {PageItemType} from '../page/region/PageItemType';

export class PageComponentsTreeGridHelper {

    public static generateColumns(): GridColumn<TreeNode<ComponentsTreeItem>>[] {
        return [
            new GridColumnBuilder<TreeNode<ComponentsTreeItem>>()
                .setName(i18n('field.name'))
                .setId('displayName')
                .setField('displayName')
                .setFormatter(PageComponentsTreeGridHelper.nameFormatter)
                .setMinWidth(250)
                .setBehavior('selectAndMove')
                .setResizable(true)
                .build(),
            new GridColumnBuilder<TreeNode<ComponentsTreeItem>>()
                .setName(i18n('field.menu'))
                .setId('menu')
                .setMinWidth(30)
                .setMaxWidth(45)
                .setField('menu')
                .setCssClass('menu-cell')
                .setResizable(false)
                .setFormatter(PageComponentsTreeGridHelper.menuFormatter).build()
        ];
    }

    public static generateOptions(): GridOptions<TreeNode<ComponentsTreeItem>> {
        return new GridOptionsBuilder<TreeNode<ComponentsTreeItem>>()
            .setShowHeaderRow(false)
            .setHideColumnHeaders(true)
            .setForceFitColumns(true)
            .setFullWidthRows(true)
            .setHeight('initial')
            .setWidth('340')
            // It is necessary to turn off the library key handling. It may cause
            // the conflicts with Mousetrap, which leads to skipping the key events
            // Do not set to true, if you are not fully aware of the result
            .setEnableCellNavigation(false)
            .setSelectedCellCssClass('selected cell')
            .setCheckableRows(false)
            .disableMultipleSelection(true)
            .setMultiSelect(false)
            .setRowHeight(45)
            .setDragAndDrop(true).build();
    }

    private static menuFormatter(row: number, cell: number, value: unknown, columnDef: unknown, node: TreeNode<ContentSummaryAndCompareStatus>) {
        const wrapper: SpanEl = new SpanEl();
        wrapper.appendChild(new PageComponentsMenuIcon());
        return wrapper.toString();
    }

    // Type guard function
    private static isPageOrRegion(componentType: PageItemType): componentType is 'page' | 'region' {
        return componentType === 'page' || PageComponentsTreeGridHelper.isRegion(componentType);
    }

    // Type guard function
    private static isRegion(componentType: PageItemType): componentType is 'region' {
        return componentType === 'region';
    }

    private static nameFormatter(row: number, cell: number, value: unknown, columnDef: unknown,
                                 node: TreeNode<ComponentsTreeItem>) {
        const viewer: PageComponentsItemViewer = node.getViewer('name') as PageComponentsItemViewer || new PageComponentsItemViewer();
        node.setViewer('name', viewer);
        const itemWrapper: ComponentsTreeItem = node.getData();
        viewer.setObject(itemWrapper);
        if (!PageComponentsTreeGridHelper.isPageOrRegion(itemWrapper.getType())) {
            viewer.addClass('draggable');
        } else {
            viewer.addClass((itemWrapper.getType() as 'page' | 'region').toString());
            if (PageComponentsTreeGridHelper.isRegion(itemWrapper.getType()) && !node.isExpandable()) {
                viewer.addClass('empty icon-arrow_drop_up');
            }
        }

        return viewer.toString();
    }
}
