import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PageComponentsItemViewer} from './PageComponentsItemViewer';
import {ItemView} from '../../page-editor/ItemView';
import {PageView} from '../../page-editor/PageView';
import {RegionView} from '../../page-editor/RegionView';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {GridColumn, GridColumnBuilder} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {GridOptions, GridOptionsBuilder} from '@enonic/lib-admin-ui/ui/grid/GridOptions';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ComponentsTreeItem} from './ComponentsTreeItem';

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

    private static menuFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummaryAndCompareStatus>) {
        const wrapper: SpanEl = new SpanEl();

        const icon: DivEl = new DivEl('menu-icon icon-menu2');
        wrapper.appendChild(icon);
        return wrapper.toString();
    }

    private static nameFormatter(row: number, cell: number, value: any, columnDef: any,
                                 node: TreeNode<ComponentsTreeItem>) {
        const viewer: PageComponentsItemViewer = <PageComponentsItemViewer>node.getViewer('name') || new PageComponentsItemViewer();
        node.setViewer('name', viewer);
        const itemWrapper: ComponentsTreeItem = node.getData();
        viewer.setObject(itemWrapper);

        if (itemWrapper.getType() !== 'page' ! && itemWrapper.getType() !== 'region' !) {
            viewer.addClass('draggable');
        }

        return viewer.toString();
    }
}
