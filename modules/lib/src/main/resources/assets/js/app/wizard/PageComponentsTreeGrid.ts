import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
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
import {ComponentView} from '../../page-editor/ComponentView';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {GridColumnBuilder} from 'lib-admin-ui/ui/grid/GridColumn';
import {GridOptionsBuilder} from 'lib-admin-ui/ui/grid/GridOptions';
import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {FragmentItemType} from '../../page-editor/fragment/FragmentItemType';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {Component} from '../page/region/Component';
import {ItemViewTreeGridWrapper} from '../../page-editor/ItemViewTreeGridWrapper';
import {GetComponentDescriptorRequest} from '../resource/GetComponentDescriptorRequest';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {PartComponentType} from '../page/region/PartComponentType';
import {Descriptor} from '../page/Descriptor';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';

export class PageComponentsTreeGrid
    extends TreeGrid<ItemViewTreeGridWrapper> {

    private pageView: PageView;
    private content: Content;

    constructor(content: Content, pageView: PageView) {
        super(new TreeGridBuilder<ItemViewTreeGridWrapper>()
            .setColumns([
                new GridColumnBuilder<TreeNode<ItemViewTreeGridWrapper>>()
                    .setName(i18n('field.name'))
                    .setId('displayName')
                    .setField('displayName')
                    .setFormatter(PageComponentsTreeGrid.nameFormatter.bind(null, content))
                    .setMinWidth(250)
                    .setBehavior('selectAndMove')
                    .setResizable(true)
                    .build(),
                new GridColumnBuilder<TreeNode<ItemViewTreeGridWrapper>>()
                    .setName(i18n('field.menu'))
                    .setId('menu')
                    .setMinWidth(30)
                    .setMaxWidth(45)
                    .setField('menu')
                    .setCssClass('menu-cell')
                    .setResizable(false)
                    .setFormatter(PageComponentsTreeGrid.menuFormatter).build()
            ])
            .setOptions(
                new GridOptionsBuilder<TreeNode<ItemViewTreeGridWrapper>>()
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
            )
            .setShowToolbar(false)
            .setAutoLoad(true)
            .prependClasses('components-grid')
        );

        this.content = content;
        this.pageView = pageView;

        (new PageComponentsGridDragHandler(this));
    }

    dataToTreeNode(data: ItemViewTreeGridWrapper, parent: TreeNode<ItemViewTreeGridWrapper>): TreeNode<ItemViewTreeGridWrapper> {
        const node: TreeNode<ItemViewTreeGridWrapper> = super.dataToTreeNode(data, parent);

        if (ObjectHelper.iFrameSafeInstanceOf(data.getItemView().getType(), FragmentItemType)) {
            this.updateTreeNodeWithFragmentsOnLoad(node);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(data.getItemView().getType(), TextItemType)) {
            this.bindTreeTextNodeUpdateOnTextComponentModify(<TextComponentView>data.getItemView());
        }

        return node;
    }

    private bindTreeTextNodeUpdateOnTextComponentModify(textComponentView: TextComponentView) {
        const handler = AppHelper.debounce((event) => {
            this.updateNodeByData(new ItemViewTreeGridWrapper(textComponentView));
        }, 500, false);

        textComponentView.onKeyUp(handler);
        textComponentView.getHTMLElement().onpaste = handler;
    }

    private updateTreeNodeWithFragmentsOnLoad(node: TreeNode<ItemViewTreeGridWrapper>) {
        const fragmentView: FragmentComponentView = <FragmentComponentView>node.getData().getItemView();

        if (fragmentView.isLoaded()) {
            return;
        }

        const loadedListener = () => {
            this.invalidateNodes([node]);
            fragmentView.unFragmentContentLoaded(loadedListener);
        };

        fragmentView.onFragmentContentLoaded(loadedListener);
    }

    toggleCompact(flag: boolean) {
        const options = this.getOptions().setRowHeight(flag ? 30 : 45);
        this.getGrid().setOptions(options);
        this.invalidate();
    }

    queryScrollable(): Element {
        return this;
    }

    setPageView(pageView: PageView): Q.Promise<void> {
        this.pageView = pageView;
        return this.reload();
    }

    public static nameFormatter(content: Content, row: number, cell: number, value: any, columnDef: any,
                                node: TreeNode<ItemViewTreeGridWrapper>) {
        const viewer: PageComponentsItemViewer = <PageComponentsItemViewer>node.getViewer('name') || new PageComponentsItemViewer(content);
        node.setViewer('name', viewer);
        const data: ItemView = node.getData().getItemView();
        viewer.setObject(data);

        if (!(ObjectHelper.iFrameSafeInstanceOf(data, RegionView) || ObjectHelper.iFrameSafeInstanceOf(data, PageView))) {
            viewer.addClass('draggable');
        }

        return viewer.toString();
    }

    setInvalid(dataIds: string[]) {
        let root = this.getRoot().getCurrentRoot();
        let stylesHash = {};

        dataIds.forEach((dataId) => {
            let node = root.findNode(dataId);
            if (node) {
                let row = this.getGrid().getDataView().getRowById(node.getId());
                stylesHash[row] = {displayName: 'invalid', menu: 'invalid'};
            }
        });
        this.getGrid().setCellCssStyles('invalid-highlight', stylesHash);
    }

    hasChildren(data: ItemViewTreeGridWrapper): boolean {
        return this.getDataChildren(data.getItemView()).length > 0;
    }

    fetch(node: TreeNode<ItemViewTreeGridWrapper>, dataId?: string): Q.Promise<ItemViewTreeGridWrapper> {
        const itemViewId: ItemViewId = dataId ? new ItemViewId(parseInt(dataId, 10)) : node.getData().getItemView().getItemId();
        return Q(new ItemViewTreeGridWrapper(this.pageView.getItemViewById(itemViewId)));
    }

    fetchRoot(): Q.Promise<ItemViewTreeGridWrapper[]> {
        if (this.pageView.getFragmentView()) {
            return this.fetchDescriptions([this.pageView.getFragmentView()]).then(items => {
                return items.map((item: ItemView) => new ItemViewTreeGridWrapper(item));
            });
        } else {
            return Q([new ItemViewTreeGridWrapper(this.pageView)]);
        }
    }

    fetchChildren(parentNode: TreeNode<ItemViewTreeGridWrapper>): Q.Promise<ItemViewTreeGridWrapper[]> {
        return this.fetchDescriptions(this.getDataChildren(parentNode.getData().getItemView())).then((allItems: ItemView[]) => {
            return allItems.map((item: ItemView) => new ItemViewTreeGridWrapper(item));
        });
    }

    private fetchDescriptions(itemViews: ItemView[]): Q.Promise<ItemView[]> {
        const requests = itemViews.map(this.fetchDescription);

        return Q.all(requests);
    }

    private fetchDescription(itemView: ItemView): Q.Promise<ItemView> {
        if (!itemView.isPart() && !itemView.isLayout()) {
            return Q.resolve(itemView);
        }

        const component: DescriptorBasedComponent = (<ComponentView<any>>itemView).getComponent();
        if (!component || !component.hasDescriptor()) {
            return Q.resolve(itemView);
        }

        const descriptorKey = component.getDescriptorKey().toString();
        let request;
        if (itemView.isLayout()) {
            request = new GetComponentDescriptorRequest(descriptorKey, LayoutComponentType.get()).sendAndParse();
        } else if (itemView.isPart()) {
            request = new GetComponentDescriptorRequest(descriptorKey, PartComponentType.get()).sendAndParse();
        }

        return request.then((descriptor: Descriptor) => {
            component.setDescription(descriptor.getDescription());
            component.setIcon(descriptor.getIcon());
            return itemView;
        });
    }

    private getDataChildren(data: ItemView): ItemView[] {
        let children = [];
        let dataType = data.getType();
        if (PageItemType.get().equals(dataType)) {
            let pageView = <PageView>data;
            children = pageView.getRegions();
            if (children.length === 0) {
                let fragmentRoot = pageView.getFragmentView();
                if (fragmentRoot) {
                    return [fragmentRoot];
                }
            }
        } else if (RegionItemType.get().equals(dataType)) {
            let regionView = <RegionView>data;
            children = regionView.getComponentViews();
        } else if (LayoutItemType.get().equals(dataType)) {
            let layoutView = <LayoutComponentView>data;
            children = layoutView.getRegions();
        }
        return children;
    }

    public static menuFormatter(row: number, cell: number, value: any, columnDef: any, node: TreeNode<ContentSummaryAndCompareStatus>) {
        let wrapper = new SpanEl();

        let icon = new DivEl('menu-icon icon-menu2');
        wrapper.appendChild(icon);
        return wrapper.toString();
    }

    addComponentToParent(component: ComponentView<Component>, parent: RegionView) {
        const parentNode: TreeNode<ItemViewTreeGridWrapper> = this.getRoot().getNodeByDataIdFromCurrent(parent.getItemId().toString());
        if (!parentNode) {
            return;
        }

        const index: number = parent.getComponentViews().indexOf(component);
        if (index < 0) {
            return;
        }

        this.insertDataToParentNode(new ItemViewTreeGridWrapper(component), parentNode, index);
        this.fetchDescription(component);
    }

    refreshComponentNode(componentView: ComponentView<Component>, oldComponentView: ComponentView<Component>, clean?: boolean) {
        const oldDataId: string = oldComponentView.getItemId().toString();
        const oldNode: TreeNode<ItemViewTreeGridWrapper> = this.getRoot().getNodeByDataIdFromCurrent(oldDataId);

        if (clean) {
            oldNode.getChildren().forEach((childNode: TreeNode<ItemViewTreeGridWrapper>) => {
               this.deleteNode(childNode);
            });
        }

        this.updateNodeByData(new ItemViewTreeGridWrapper(componentView), oldDataId);

        const dataId: string = componentView.getItemId().toString();

        if (componentView.isSelected()) {
            this.selectNode(dataId);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(componentView.getType(), TextItemType)) {
            this.bindTreeTextNodeUpdateOnTextComponentModify(<TextComponentView>componentView);
        }
    }

    protected doUpdateNodeByData(nodeToUpdate: TreeNode<ItemViewTreeGridWrapper>, data: ItemViewTreeGridWrapper): void {
        nodeToUpdate.setExpandable(this.hasChildren(data));
        super.doUpdateNodeByData(nodeToUpdate, data);
    }

    scrollToItem(dataId: string) {
        const node: TreeNode<ItemViewTreeGridWrapper> = this.getRoot().getNodeByDataIdFromCurrent(dataId);

        if (node) {
            node.getData().getItemView().scrollComponentIntoView();
            this.scrollToRow(this.getGrid().getDataView().getRowById(node.getId()));
        }
    }

    protected isToBeExpanded(node: TreeNode<ItemViewTreeGridWrapper>): boolean {
        return super.isToBeExpanded(node) || !node.getData().getItemView().getType().equals(LayoutItemType.get());
    }

}
