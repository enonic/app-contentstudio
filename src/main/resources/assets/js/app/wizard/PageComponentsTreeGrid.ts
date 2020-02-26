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
import {PartItemType} from '../../page-editor/part/PartItemType';
import {ComponentView} from '../../page-editor/ComponentView';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {GetPartDescriptorsByApplicationsRequest} from './page/contextwindow/inspect/region/GetPartDescriptorsByApplicationsRequest';
import {GetLayoutDescriptorsByApplicationsRequest} from './page/contextwindow/inspect/region/GetLayoutDescriptorsByApplicationsRequest';
import {GridColumnBuilder} from 'lib-admin-ui/ui/grid/GridColumn';
import {GridOptionsBuilder} from 'lib-admin-ui/ui/grid/GridOptions';
import {TreeGrid} from 'lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from 'lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {Descriptor} from 'lib-admin-ui/content/page/Descriptor';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export class PageComponentsTreeGrid
    extends TreeGrid<ItemView> {

    private pageView: PageView;
    private content: Content;

    constructor(content: Content, pageView: PageView) {
        super(new TreeGridBuilder<ItemView>()
            .setColumns([
                new GridColumnBuilder<TreeNode<ItemView>>()
                    .setName(i18n('field.name'))
                    .setId('displayName')
                    .setField('displayName')
                    .setFormatter(PageComponentsTreeGrid.nameFormatter.bind(null, content))
                    .setMinWidth(250)
                    .setBehavior('selectAndMove')
                    .setResizable(true)
                    .build(),
                new GridColumnBuilder<TreeNode<ContentSummaryAndCompareStatus>>()
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
            )
            .setShowToolbar(false)
            .setAutoLoad(true)
            .setExpandFn((item: ItemView) => !item.getType().equals(LayoutItemType.get()))
            .prependClasses('components-grid')
        );

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

    queryScrollable(): Element {
        return this;
    }

    setPageView(pageView: PageView): Q.Promise<void> {
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
            if (!(ObjectHelper.iFrameSafeInstanceOf(data, RegionView) || ObjectHelper.iFrameSafeInstanceOf(data, PageView))) {
                viewer.addClass('draggable');
            }
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

    getDataId(data: ItemView): string {
        return data.getItemId().toString();
    }

    hasChildren(data: ItemView): boolean {
        return this.getDataChildren(data).length > 0;
    }

    fetch(node: TreeNode<ItemView>, dataId?: string): Q.Promise<ItemView> {
        let itemViewId = dataId ? new ItemViewId(parseInt(dataId, 10)) : node.getData().getItemId();
        return Q(this.pageView.getItemViewById(itemViewId));
    }

    fetchRoot(): Q.Promise<ItemView[]> {
        if (this.pageView.getFragmentView()) {
            return Q([this.pageView.getFragmentView()]);
        } else {
            return Q([this.pageView]);
        }
    }

    fetchChildren(parentNode: TreeNode<ItemView>): Q.Promise<ItemView[]> {
        return this.fetchDescriptions(this.getDataChildren(parentNode.getData())).then(allItems => {
            return allItems;
        });
    }

    fetchDescriptions(itemViews: ItemView[]): Q.Promise<ItemView[]> {

        const partKeys: ApplicationKey[] = [];
        const layoutKeys: ApplicationKey[] = [];
        const componentMap: { [descKey: string]: DescriptorBasedComponent[] } = {};

        itemViews.forEach((itemView) => {
            const isPartItemType: boolean = PartItemType.get().equals(itemView.getType());
            const isLayoutItemType: boolean = LayoutItemType.get().equals(itemView.getType());
            if (!isLayoutItemType && !isPartItemType) {
                return;
            }

            const component: DescriptorBasedComponent = (<ComponentView<any>>itemView).getComponent();
            if (!component || !component.hasDescriptor()) {
                return;
            }

            const descKey = component.getDescriptorKey();
            if (componentMap[descKey.toString()]) {
                componentMap[descKey.toString()].push(component);
            } else {
                componentMap[descKey.toString()] = [component];
            }

            const appKey = descKey.getApplicationKey();
            if (isLayoutItemType) {
                layoutKeys.push(appKey);
            } else {
                partKeys.push(appKey);
            }
        });

        const requests = [];
        if (partKeys.length > 0) {
            requests.push(new GetPartDescriptorsByApplicationsRequest(partKeys).sendAndParse());
        }
        if (layoutKeys.length > 0) {
            requests.push(new GetLayoutDescriptorsByApplicationsRequest(layoutKeys).sendAndParse());
        }
        return Q.all(requests).then((descriptorsArray) => {
            descriptorsArray.forEach((descriptors: Descriptor[]) => {
                descriptors.forEach(desc => {
                    const components = componentMap[desc.getKey().toString()];
                    if (components) {
                        components.forEach(component => {
                            component.setDescription(desc.getDescription());
                            component.setIcon(desc.getIcon());
                        });
                    }
                });
            });
        }).then(() => {
            return itemViews;
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

}
