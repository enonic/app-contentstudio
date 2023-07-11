import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PageComponentsGridDragHandler} from './PageComponentsGridDragHandler';
import {ItemView} from '../../page-editor/ItemView';
import {PageView} from '../../page-editor/PageView';
import {RegionView} from '../../page-editor/RegionView';
import {ComponentView} from '../../page-editor/ComponentView';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {Component} from '../page/region/Component';
import {ComponentsTreeItem} from '../../page-editor/ComponentsTreeItem';
import {GetComponentDescriptorRequest} from '../resource/GetComponentDescriptorRequest';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {Descriptor} from '../page/Descriptor';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {PageComponentsTreeGridHelper} from './PageComponentsTreeGridHelper';
import {PartComponentType} from '../page/region/PartComponentType';
import {Region} from '../page/region/Region';
import {Page} from '../page/Page';
import {LayoutComponent} from '../page/region/LayoutComponent';
import {ComponentItem, TreeComponent} from '../../page-editor/TreeComponent';
import {PageModel} from '../../page-editor/PageModel';
import {RegionItemType} from '../../page-editor/RegionItemType';
import {FragmentComponent} from '../page/region/FragmentComponent';
import {FragmentComponentType} from '../page/region/FragmentComponentType';
import {TextComponent} from '../page/region/TextComponent';
import {ItemViewIconClassResolver} from '../../page-editor/ItemViewIconClassResolver';
import {TextComponentType} from '../page/region/TextComponentType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Content} from '../content/Content';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class PageComponentsTreeGrid
    extends TreeGrid<ComponentsTreeItem> {

    private pageView: PageView;
    private nodeExpandedHandler?: ()=> void;

    constructor(pageView: PageView) {
        super(new TreeGridBuilder<ComponentsTreeItem>()
            .setColumns(PageComponentsTreeGridHelper.generateColumns())
            .setOptions(PageComponentsTreeGridHelper.generateOptions())
            .setShowToolbar(false)
            .setAutoLoad(true)
            .prependClasses('page-components-tree-grid')
        );

        this.pageView = pageView;

        (new PageComponentsGridDragHandler(this));
    }

    dataToTreeNode(data: ComponentsTreeItem, parent: TreeNode<ComponentsTreeItem>): TreeNode<ComponentsTreeItem> {
        const node: TreeNode<ComponentsTreeItem> = super.dataToTreeNode(data, parent);

        /*
        if (ObjectHelper.iFrameSafeInstanceOf(data.getItemView().getType(), FragmentItemType)) {
            this.updateTreeNodeWithFragmentsOnLoad(node);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(data.getItemView().getType(), TextItemType)) {
            this.bindTreeTextNodeUpdateOnTextComponentModify(<TextComponentView>data.getItemView());
        }

         */

        return node;
    }

    private bindTreeTextNodeUpdateOnTextComponentModify(textComponentView: TextComponentView) {
        const handler = AppHelper.debounce((event) => {
            this.updateNodeByData(new ComponentsTreeItem(this.makeTextComponentItem(textComponentView.getComponent()), textComponentView));
        }, 500, false);

        new MutationObserver(handler).observe(textComponentView.getHTMLElement(), {subtree: true, childList: true, characterData: true});
    }

    private updateTreeNodeWithFragmentsOnLoad(node: TreeNode<ComponentsTreeItem>) {
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

    queryScrollable(): Element {
        return this;
    }

    setPageView(pageView: PageView): Q.Promise<void> {
        this.pageView = pageView;
        return this.reload();
    }

    setNodeExpandedHandler(handler: () => void) {
        this.nodeExpandedHandler = handler;
    }

    setInvalid(dataIds: string[]) {
        let root = this.getRoot().getCurrentRoot();
        let stylesHash = {};

        dataIds.forEach((dataId) => {
            let node = root.findNode(dataId);
            if (node) {
                let row = this.getRowByNodeId(node.getId());
                stylesHash[row] = {displayName: 'invalid', menu: 'invalid'};
            }
        });
        this.getGrid().setCellCssStyles('invalid-highlight', stylesHash);
    }

    hasChildren(data: ComponentsTreeItem): boolean {
        return this.hasComponentChildren(data.getComponent().getItem());
    }

    hasComponentChildren(item: ComponentItem): boolean {
        if (ObjectHelper.iFrameSafeInstanceOf(item, Page)) {
            return !(<Page>item).getRegions().isEmpty();
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, Region)) {
            return (<Region>item).getComponents().length > 0;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, LayoutComponent)) {
            return !(<LayoutComponent>item).getRegions().isEmpty();
        }

        return false;
    }

    fetchRoot(): Q.Promise<ComponentsTreeItem[]> {
        if (this.pageView.getModel().hasFragment()) {
            return this.fetchRootFragment().then((rootFragment: ComponentsTreeItem) => [rootFragment]);
        }

        return Q([this.makeRootPageItem()]);
    }

    private fetchRootFragment(): Q.Promise<ComponentsTreeItem> {
        const component: Component = this.pageView.getModel().getFragment();

        return this.fetchDescriptor(component).then((descriptor) => {
            const fullComponent: TreeComponent = TreeComponent.create()
                .setItem(component)
                .setDisplayName(descriptor?.getDisplayName())
                .setDescription(descriptor?.getDescription() || component.getType().getShortName())
                .setIconClass(ItemViewIconClassResolver.resolveByType(component.getType().getShortName()))
                .build();

            return new ComponentsTreeItem(fullComponent, this.pageView);
        });
    }

    private makeRootPageItem(): ComponentsTreeItem {
        const pageModel: PageModel = this.pageView.getModel();

        const fullComponent: TreeComponent = TreeComponent.create()
            .setItem(pageModel.getPage())
            .setDisplayName(this.pageView.getName())
            .setDescription(pageModel.getDescriptor()?.getDescription() || this.makeNoDescriptionText())
            .setIconClass(this.pageView.getIconClass())
            .build();

        return new ComponentsTreeItem(fullComponent, this.pageView);
    }

    private makeNoDescriptionText(): string {
        return `<${i18n('text.noDescription')}>`;
    }

    fetchChildren(parentNode: TreeNode<ComponentsTreeItem>): Q.Promise<ComponentsTreeItem[]> {
        const component: ComponentItem = parentNode.getData().getComponent().getItem();

        if (ObjectHelper.iFrameSafeInstanceOf(component, Page)) {
            return Q.resolve((<Page>component).getRegions().getRegions().map((region: Region) => this.regionToComponentsTreeItem(region)));
        }

        if (ObjectHelper.iFrameSafeInstanceOf(component, Region)) {
            return this.fetchRegionItems(<Region>component, parentNode.getData().getItemView() as RegionView);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
            return Q.resolve(
                (<LayoutComponent>component).getRegions().getRegions().map((region: Region) => this.regionToComponentsTreeItem(region)));
        }

        return Q.resolve([]);
    }

    private regionToComponentsTreeItem(region: Region): ComponentsTreeItem {
        const fullComponent: TreeComponent = TreeComponent.create()
            .setItem(region)
            .setDisplayName(region.getName())
            .setDescription(RegionItemType.get().getShortName())
            .setIconClass(ItemViewIconClassResolver.resolveByType(RegionItemType.get().getShortName()))
            .build();

        const regionView: ItemView = this.pageView.getComponentViewByPath(region.getPath());

        return new ComponentsTreeItem(fullComponent, regionView);
    }

    private fetchRegionItems(region: Region, regionView?: RegionView): Q.Promise<ComponentsTreeItem[]> {
        const promises: Q.Promise<ComponentsTreeItem>[] = [];

        region.getComponents().forEach((component: Component) => {
           promises.push(this.fetchTreeItem(component, regionView));
        });

        return Q.all(promises);
    }

    private fetchTreeItem(component: Component, parentRegionView?: RegionView): Q.Promise<ComponentsTreeItem> {
        return this.fetchComponentItem(component).then((fullComponent: TreeComponent) => {
            const itemView: ItemView = parentRegionView?.getComponentViewByPath(component.getPath());
            return new ComponentsTreeItem(fullComponent, itemView);
        });
    }

    private fetchComponentItem(component: Component): Q.Promise<TreeComponent> {
        if (ObjectHelper.iFrameSafeInstanceOf(component, FragmentComponent)) {
             return this.fetchFragmentItem(component as FragmentComponent);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(component, DescriptorBasedComponent)) {
            return this.fetchDescriptorBasedComponent(<DescriptorBasedComponent>component);
        }

        if (ObjectHelper.iFrameSafeInstanceOf(component, TextComponent)) {
            return Q.resolve(this.makeTextComponentItem(<TextComponent>component));
        }

        return Q.resolve(TreeComponent.create().setItem(component).setDisplayName(component.getName().toString()).setDescription(
            component.getType().getShortName()).build());
    }

    private fetchFragmentItem(fragmentComponent: FragmentComponent): Q.Promise<TreeComponent> {
        const fragmentPromise: Q.Promise<Content | null> = fragmentComponent.hasFragment() ? new GetContentByIdRequest(
            fragmentComponent.getFragment()).sendAndParse() : Q(null);

        return fragmentPromise.then((content: Content | null) => {
            return TreeComponent.create()
                .setItem(fragmentComponent)
                .setDisplayName(content?.getDisplayName() || fragmentComponent.getName().toString())
                .setDescription(content?.getPage()?.getFragment()?.getType().getShortName() || fragmentComponent.getType().getShortName())
                .setIconClass(ItemViewIconClassResolver.resolveByType(FragmentComponentType.get().getShortName()))
                .build();
        });
    }

    private fetchDescriptorBasedComponent(component: DescriptorBasedComponent): Q.Promise<TreeComponent> {
        return this.fetchDescriptor(component).then((descriptor) => {
            return TreeComponent.create()
                .setItem(component)
                .setDisplayName(descriptor?.getDisplayName() || component.getName().toString())
                .setDescription(descriptor?.getDescription() || this.makeNoDescriptionText())
                .setIconUrl(descriptor?.getIcon())
                .setIconClass(ItemViewIconClassResolver.resolveByType(component.getType().getShortName()))
                .build();
        });
    }

    private makeTextComponentItem(component: TextComponent): TreeComponent {
        return TreeComponent.create()
            .setItem(component)
            .setDisplayName(StringHelper.htmlToString(component.getText()) || component.getName().toString())
            .setDescription(TextComponentType.get().getShortName())
            .setIconClass(ItemViewIconClassResolver.resolveByType(component.getType().getShortName()))
            .build();
    }

    private fetchDescriptor(component: Component): Q.Promise<Descriptor | null> {
        if (!ObjectHelper.iFrameSafeInstanceOf(component, DescriptorBasedComponent)) {
            return Q.resolve(null);
        }

        const item: DescriptorBasedComponent = <DescriptorBasedComponent>component;

        if (!item.hasDescriptor()) {
            return Q.resolve(null);
        }

        const descriptorKey: string = item.getDescriptorKey().toString();
        const type = ObjectHelper.iFrameSafeInstanceOf(item, LayoutComponent) ? LayoutComponentType.get() : PartComponentType.get();
        return new GetComponentDescriptorRequest(descriptorKey, type).sendAndParse();
    }

    addComponentToParent(componentView: ComponentView<Component>, parent: RegionView): Q.Promise<void> {
        const parentNode: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(parent.getItemId().toString());
        if (!parentNode) {
            return;
        }

        const index: number = parent.getComponentViews().indexOf(componentView);
        if (index < 0) {
            return;
        }

        debugger;
        return this.fetchComponentItem(componentView.getComponent()).then((fullComponent: TreeComponent) => {
            const item: ComponentsTreeItem = new ComponentsTreeItem(fullComponent, componentView);
            this.insertDataToParentNode(item, parentNode, index);
        });

    }

    refreshComponentNode(componentView: ComponentView<Component>, oldComponentView: ComponentView<Component>, clean?: boolean): Q.Promise<void> {
        const oldDataId: string = oldComponentView.getItemId().toString();
        const oldNode: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(oldDataId);

        if (clean) {
            oldNode.getChildren().forEach((childNode: TreeNode<ComponentsTreeItem>) => {
                this.deleteNode(childNode);
            });
        }

        return this.fetchComponentItem(componentView.getComponent()).then((fullComponent: TreeComponent) => {
            this.updateNodeByData(new ComponentsTreeItem(fullComponent, componentView), oldDataId);

            const dataId: string = componentView.getItemId().toString();

            if (componentView.isSelected()) {
                this.selectNode(dataId);
            }

            if (ObjectHelper.iFrameSafeInstanceOf(componentView.getType(), TextItemType)) {
                this.bindTreeTextNodeUpdateOnTextComponentModify(<TextComponentView>componentView);
            }
        });
    }

    protected doUpdateNodeByData(nodeToUpdate: TreeNode<ComponentsTreeItem>, data: ComponentsTreeItem): void {
        nodeToUpdate.setExpandable(this.hasChildren(data));
        super.doUpdateNodeByData(nodeToUpdate, data);
    }

    scrollToItem(dataId: string) {
        const node: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(dataId);

        if (node) {
            this.scrollToRow(this.getRowByNodeId(node.getId()));
            const row = this.getRowByNodeId(node.getId());
            const itemElement = this.getGrid().getCellNode(row, 0);

            if (itemElement && !this.isElementInViewport(itemElement)) {
                itemElement.scrollIntoView();
            }
        }
    }

    private isElementInViewport(element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    protected isToBeExpanded(node: TreeNode<ComponentsTreeItem>): boolean {
        const item: ComponentItem = node.getData().getComponent().getItem();
        return super.isToBeExpanded(node) || !ObjectHelper.iFrameSafeInstanceOf(item, LayoutComponent) ||
               !(<LayoutComponent>item).getParent();
    }

    mask() {
        // skipping mask for now to avoid flickering
    }

    unmask() {
        // skipping mask for now to avoid flickering
    }

    protected expandNode(node?: TreeNode<ComponentsTreeItem>): Q.Promise<boolean> {
        return super.expandNode(node).then((expanded: boolean) => {
            this.nodeExpandedHandler?.();
            return expanded;
        });
    }

    protected deleteNode(node: TreeNode<ComponentsTreeItem>): void {
        if (node.hasChildren()) {
            node.getChildren().forEach((childNode: TreeNode<ComponentsTreeItem>) => this.deleteNode(childNode));
        }

        super.deleteNode(node);
    }

    selectItemByDataId(dataId: string): void { // not using selectNode() because it triggers extra selectRow() call
        if (this.getSelectedItems()[0] !== dataId) { // if not already selected
            const nodeId: string = this.getRoot().getNodeByDataIdFromCurrent(dataId)?.getId();

            if (nodeId) {
                this.selectRow(this.getRowByNodeId(nodeId));
            }
        }
    }

    selectItemByComponentView(view: ItemView): void {
        const dataId: string = view.getItemId().toString();

        this.expandRecursivelyFromTopToView(view.getParentItemView()).then(() => {
            if (this.getSelectedItems()[0] !== dataId) { // if not already selected
                const node: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(dataId);
                if (node) {
                    this.selectRow(this.getRowByNodeId(node.getId()));
                }
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private expandRecursivelyFromTopToNode(node?: TreeNode<ComponentsTreeItem>): Q.Promise<boolean> {
        if (!node) {
            return Q.resolve(true);
        }

        const expandParentsPromise: Q.Promise<boolean> =
            node.hasParent() ? this.expandRecursivelyFromTopToNode(node.getParent()) : Q.resolve(true);

        return expandParentsPromise.then(() => {
            return node.isExpanded() ? Q.resolve(true) : this.expandNode(node);
        });
    }

    private expandRecursivelyFromTopToView(view?: ItemView): Q.Promise<boolean> {
        if (!view) {
            return Q.resolve(true);
        }

        const dataId: string = view.getItemId().toString();
        const node: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(dataId);

        if (node) { // ItemView's corresponding node is already in the tree
            return this.expandRecursivelyFromTopToNode(node);
        }

        // No node in the tree for the ItemView, looking for the first parent ItemView with a node in the tree
        return this.expandRecursivelyFromTopToView(view.getParentItemView()).then(() => {
            // after parent items expanded, looking for the node again
            const node: TreeNode<ComponentsTreeItem> = this.getRoot().getNodeByDataIdFromCurrent(dataId);

            return !!node ? this.expandNode(node) : Q.resolve(false);
        });
    }

    protected selectRow(row: number, debounce?: boolean): void {
        // TreeGrid does not have select/deselect click handler, so need to handle deselect ourselves
        const currentlySelectedItem: ComponentsTreeItem = this.getFirstSelectedItem();
        super.selectRow(row, debounce);
        const newlySelectedItem: ComponentsTreeItem = this.getFirstSelectedItem();

        if (newlySelectedItem === currentlySelectedItem) {
            this.deselectNodes([currentlySelectedItem.getId()]);
        }
    }

    private getRowByNodeId(nodeId: string): number {
        return this.getGrid().getDataView().getRowById(nodeId);
    }

}
