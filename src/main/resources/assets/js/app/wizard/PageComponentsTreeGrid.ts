import {PageComponentsItemViewer} from './PageComponentsItemViewer';
import {PageComponentsGridDragHandler} from './PageComponentsGridDragHandler';
import {ItemView} from '../../page-editor/ItemView';
import {PageView} from '../../page-editor/PageView';
import {RegionView} from '../../page-editor/RegionView';
import {ItemViewId} from '../../page-editor/ItemViewId';
import {PageItemType} from '../../page-editor/PageItemType';
import {RegionItemType} from '../../page-editor/RegionItemType';
import {LayoutItemType} from '../../page-editor/layout/LayoutItemType';
import {LayoutComponentView} from '../../page-editor/layout/LayoutComponentView';
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {PartItemType} from '../../page-editor/part/PartItemType';
import {PartComponentView} from '../../page-editor/part/PartComponentView';
import {ComponentView} from '../../page-editor/ComponentView';
import {GetPartDescriptorByKeyRequest} from './page/contextwindow/inspect/region/GetPartDescriptorByKeyRequest';
import {GetLayoutDescriptorByKeyRequest} from './page/contextwindow/inspect/region/GetLayoutDescriptorByKeyRequest';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import GridColumnBuilder = api.ui.grid.GridColumnBuilder;
import GridOptionsBuilder = api.ui.grid.GridOptionsBuilder;
import TreeGrid = api.ui.treegrid.TreeGrid;
import TreeNode = api.ui.treegrid.TreeNode;
import TreeGridBuilder = api.ui.treegrid.TreeGridBuilder;
import i18n = api.util.i18n;
import Descriptor = api.content.page.Descriptor;

export class PageComponentsTreeGrid
    extends TreeGrid<ItemView> {

    private pageView: PageView;
    private content: Content;

    constructor(content: Content, pageView: PageView) {
        super(new TreeGridBuilder<ItemView>().setColumns([
            new GridColumnBuilder<TreeNode<ItemView>>()
                .setName(i18n('field.name'))
                .setId('displayName')
                .setField('displayName')
                .setFormatter(PageComponentsTreeGrid.nameFormatter.bind(null, content))
                .setMinWidth(295)
                .setBehavior('selectAndMove')
                .setResizable(false)
                .build(),
            new GridColumnBuilder<TreeNode<ContentSummaryAndCompareStatus>>()
                .setName(i18n('field.menu'))
                .setId('menu')
                .setMinWidth(45)
                .setMaxWidth(45)
                .setField('menu')
                .setCssClass('menu-cell')
                .setResizable(false)
                .setFormatter(PageComponentsTreeGrid.menuFormatter).build()
        ]).setOptions(
            new GridOptionsBuilder<TreeNode<ItemView>>()
                .setAutoHeight(true)
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
                .setDragAndDrop(true).build()
        ).setShowToolbar(false).setAutoLoad(true).setExpandAll(true).prependClasses('components-grid'));

        this.content = content;
        this.pageView = pageView;

        // tslint:disable-next-line:no-unused-expression
        (new PageComponentsGridDragHandler(this));
    }

    toggleCompact(flag: boolean) {
        const options = this.getOptions().setRowHeight(flag ? 30 : 45);
        this.getGrid().setOptions(options);
        this.invalidate();
    }

    queryScrollable(): api.dom.Element {
        return this;
    }

    setPageView(pageView: PageView): wemQ.Promise<void> {
        this.pageView = pageView;
        return this.reload();
    }

    public static nameFormatter(content: Content, row: number, cell: number, value: any, columnDef: any, node: TreeNode<ItemView>) {
        let viewer = <PageComponentsItemViewer>node.getViewer('name');
        if (!viewer) {
            viewer = new PageComponentsItemViewer(content);
            const data = node.getData();

            viewer.setObject(data);
            node.setViewer('name', viewer);
            if (!(api.ObjectHelper.iFrameSafeInstanceOf(data, RegionView) || api.ObjectHelper.iFrameSafeInstanceOf(data, PageView))) {
                viewer.addClass('draggable');
            }
        }
        return viewer.toString();
    }

    setInvalid(dataIds: string[]) {
        let root = this.getRoot().getCurrentRoot();
        let stylesHash: Slick.CellCssStylesHash = {};

        dataIds.forEach((dataId) => {
            let node = root.findNode(dataId);
            if (node) {
                let row = this.getGrid().getDataView().getRowById(node.getId());
                stylesHash[row] = {displayName: 'invalid', menu: 'invalid'};
            }
        });
        this.getGrid().setCellCssStyles('invalid-highlight', stylesHash);
    }

    getDataId(data: ItemView): string {
        return data.getItemId().toString();
    }

    hasChildren(data: ItemView): boolean {
        return this.getDataChildren(data).length > 0;
    }

    fetch(node: TreeNode<ItemView>, dataId?: string): Q.Promise<ItemView> {
        let itemViewId = dataId ? new ItemViewId(parseInt(dataId, 10)) : node.getData().getItemId();
        return wemQ(this.pageView.getItemViewById(itemViewId));
    }

    fetchRoot(): wemQ.Promise<ItemView[]> {
        if (this.pageView.getFragmentView()) {
            return wemQ([this.pageView.getFragmentView()]);
        } else {
            return wemQ([this.pageView]);
        }
    }

    fetchChildren(parentNode: TreeNode<ItemView>): Q.Promise<ItemView[]> {
        return wemQ.all(this.getDataChildren(parentNode.getData()).map(this.fetchDescriptions)).then(allItems => {
            return allItems;
        });
    }

    fetchDescriptions(itemView: ItemView): wemQ.Promise<ItemView> {

        const isPartItemType: boolean = PartItemType.get().equals(itemView.getType());
        const isLayoutItemType: boolean = LayoutItemType.get().equals(itemView.getType());

        if (!(isPartItemType || isLayoutItemType)) {
            return wemQ(itemView);
        }

        const component: DescriptorBasedComponent = (<ComponentView<any>> itemView).getComponent();

        if (!component || !component.hasDescriptor()) {
            return wemQ(itemView);
        }

        let request;
        if (isPartItemType) {
            request = new GetPartDescriptorByKeyRequest((<PartComponentView> itemView).getComponent().getDescriptorKey());
        }
        if (isLayoutItemType) {
            request = new GetLayoutDescriptorByKeyRequest((<LayoutComponentView> itemView).getComponent().getDescriptorKey());
        }

        if (!!request) {
            request.sendAndParse().then((receivedDescriptor: Descriptor) => {
                component.setDescription(receivedDescriptor.getDescription());

                return itemView;
            });
        }

        return wemQ(itemView);
    }

    private getDataChildren(data: ItemView): ItemView[] {
        let children = [];
        let dataType = data.getType();
        if (PageItemType.get().equals(dataType)) {
            let pageView = <PageView> data;
            children = pageView.getRegions();
            if (children.length === 0) {
                let fragmentRoot = pageView.getFragmentView();
                if (fragmentRoot) {
                    return [fragmentRoot];
                }
            }
        } else if (RegionItemType.get().equals(dataType)) {
            let regionView = <RegionView> data;
            children = regionView.getComponentViews();
        } else if (LayoutItemType.get().equals(dataType)) {
            let layoutView = <LayoutComponentView> data;
            children = layoutView.getRegions();
        }
        return children;
    }

    public static menuFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummaryAndCompareStatus>) {
        let wrapper = new api.dom.SpanEl();

        let icon = new api.dom.DivEl('menu-icon icon-menu2');
        wrapper.getEl().setInnerHtml(icon.toString(), false);
        return wrapper.toString();
    }

}
