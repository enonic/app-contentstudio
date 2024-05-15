import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {PageComponentsGridDragHandler} from './PageComponentsGridDragHandler';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {TreeGridBuilder} from '@enonic/lib-admin-ui/ui/treegrid/TreeGridBuilder';
import {Component} from '../page/region/Component';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {GetComponentDescriptorRequest} from '../resource/GetComponentDescriptorRequest';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {Descriptor} from '../page/Descriptor';
import {PageComponentsTreeGridHelper} from './PageComponentsTreeGridHelper';
import {PartComponentType} from '../page/region/PartComponentType';
import {Region} from '../page/region/Region';
import {Page} from '../page/Page';
import {LayoutComponent} from '../page/region/LayoutComponent';
import {TreeComponent} from './TreeComponent';
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
import {ComponentPath} from '../page/region/ComponentPath';
import {PageItem} from '../page/region/PageItem';
import {PageState} from './page/PageState';
import {ComponentUpdatedEvent} from '../page/region/ComponentUpdatedEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {PageComponentsMenuIcon} from './PageComponentsMenuIcon';
import {ComponentAddedEvent} from '../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../page/region/ComponentRemovedEvent';

export class PageComponentsTreeGrid
    extends TreeGrid<ComponentsTreeItem> {

    private nodeExpandedHandler?: () => void;

    constructor() {
        super(new TreeGridBuilder<ComponentsTreeItem>()
            .setColumns(PageComponentsTreeGridHelper.generateColumns())
            .setOptions(PageComponentsTreeGridHelper.generateOptions())
            .setShowToolbar(false)
            .setAutoLoad(false)
            .prependClasses('page-components-tree-grid')
        );

        (new PageComponentsGridDragHandler(this, {
            getPathByItem: this.getPathByItem.bind(this),
            getItemByPath: this.getItemByPath.bind(this),
        }));

        this.initListeners();
    }

    private initListeners(): void {
        PageState.getEvents().onComponentAdded((event: ComponentAddedEvent) => {
            this.addComponent(event.getComponent())?.catch(DefaultErrorHandler.handle);
        });

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            this.deleteItemByPath(event.getPath());
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            this.updateItemByPath(event.getPath());
        });

        const isRootItemEmptyChecker = this.toggleRootItemHasChildren.bind(this);

        this.onLoaded(isRootItemEmptyChecker);
        this.onDataChanged(isRootItemEmptyChecker);
    }

    private toggleRootItemHasChildren(): void {
        this.toggleClass('no-children-root', !this.isRootItemWithChildren());
    }

    queryScrollable(): Element {
        return this;
    }

    setNodeExpandedHandler(handler: () => void) {
        this.nodeExpandedHandler = handler;
    }

    hasChildren(data: ComponentsTreeItem): boolean {
        return data.getComponent().hasChildren();
    }

    private hasComponentChildren(item: PageItem): boolean {
        if (item instanceof Page) {
            return !item.getRegions().isEmpty();
        }

        if (item instanceof Region) {
            return item.getComponents().length > 0;
        }

        if (item instanceof LayoutComponent) {
            return !item.getRegions().isEmpty();
        }

        return false;
    }

    reload(): Q.Promise<void> {
        if (!PageState.getState()) {
            return Q.resolve();
        }

        return super.reload();
    }

    fetchRoot(): Q.Promise<ComponentsTreeItem[]> {
        if (PageState.getState().getFragment()) {
            return this.fetchRootFragment().then((rootFragment: ComponentsTreeItem) => [rootFragment]);
        }

        return this.fetchRootPageItem().then((rootPageItem: ComponentsTreeItem) => [rootPageItem]);
    }

    private fetchRootFragment(): Q.Promise<ComponentsTreeItem> {
        const component: Component = PageState.getState().getFragment();
        return this.fetchTreeItem(component);
    }

    private fetchRootPageItem(): Q.Promise<ComponentsTreeItem> {
        return new GetComponentDescriptorRequest(PageState.getState().getController().toString()).sendAndParse().then((descriptor) => {
            const fullComponent: TreeComponent = TreeComponent.create()
                .setDisplayName(descriptor?.getDisplayName())
                .setDescription(descriptor?.getDescription() || this.makeNoDescriptionText())
                .setIconClass('icon-file')
                .setHasChildren(this.hasComponentChildren(PageState.getState()))
                .setType('page')
                .build();

            return new ComponentsTreeItem(fullComponent);
        });
    }

    private makeNoDescriptionText(): string {
        return `<${i18n('text.noDescription')}>`;
    }

    fetchChildren(parentNode: TreeNode<ComponentsTreeItem>): Q.Promise<ComponentsTreeItem[]> {
        const path: ComponentPath = this.getNodePath(parentNode);
        const component: PageItem = PageState.getComponentByPath(path);

        if (component instanceof Page) {
            return Q.resolve(component.getRegions().getRegions().map((region: Region) => this.regionToComponentsTreeItem(region)));
        }

        if (component instanceof Region) {
            return this.fetchRegionItems(component);
        }

        if (component instanceof LayoutComponent) {
            return Q.resolve(component.getRegions().getRegions().map((region: Region) => this.regionToComponentsTreeItem(region)));
        }

        return Q.resolve([]);
    }

    private regionToComponentsTreeItem(region: Region): ComponentsTreeItem {
        const fullComponent: TreeComponent = TreeComponent.create()
            .setDisplayName(region.getName())
            .setDescription(RegionItemType.get().getShortName())
            .setHasChildren(this.hasComponentChildren(region))
            .setType('region')
            .build();

        return new ComponentsTreeItem(fullComponent);
    }

    private fetchRegionItems(region: Region): Q.Promise<ComponentsTreeItem[]> {
        const promises: Q.Promise<ComponentsTreeItem>[] = [];

        region.getComponents().forEach((component: Component) => {
            promises.push(this.fetchTreeItem(component));
        });

        return Q.all(promises);
    }

    private fetchTreeItem(component: Component): Q.Promise<ComponentsTreeItem> {
        return this.fetchComponentItem(component).then((fullComponent: TreeComponent) => {
            return new ComponentsTreeItem(fullComponent);
        });
    }

    private fetchComponentItem(component: Component): Q.Promise<TreeComponent> {
        if (component instanceof FragmentComponent) {
            return this.fetchFragmentItem(component);
        }

        if (component instanceof DescriptorBasedComponent) {
            return this.fetchDescriptorBasedComponent(component);
        }

        if (component instanceof TextComponent) {
            return Q.resolve(this.makeTextComponentItem(component));
        }

        return Q.resolve(TreeComponent.create().setDisplayName(component.getName().toString()).setDescription(
            component.getType().getShortName()).setType(component.getType()).build());
    }

    private fetchFragmentItem(fragmentComponent: FragmentComponent): Q.Promise<TreeComponent> {
        const hasFragment: boolean = fragmentComponent.hasFragment();
        const fragmentPromise: Q.Promise<Content | null> = hasFragment ? new GetContentByIdRequest(
            fragmentComponent.getFragment()).sendAndParse().catch(console.log) : Q(null);

        return fragmentPromise.then((content: Content | null) => {
            const isInvalid: boolean = hasFragment && !content;
            const description: string = isInvalid ? i18n('notify.fragment.component.content.notfound')
                                                  : (content?.getPage()?.getFragment()?.getType().getShortName() ||
                                                     fragmentComponent.getType().getShortName());

            return TreeComponent.create()
                .setDisplayName(content?.getDisplayName() || fragmentComponent.getName().toString())
                .setDescription(description)
                .setIconClass(ItemViewIconClassResolver.resolveByType(FragmentComponentType.get().getShortName()))
                .setHasChildren(false)
                .setInvalid(isInvalid)
                .setType(FragmentComponentType.get())
                .build();
        });
    }

    private fetchDescriptorBasedComponent(component: DescriptorBasedComponent): Q.Promise<TreeComponent> {
        return this.fetchDescriptor(component).then((descriptor: Descriptor | null) => {
            const isInvalid: boolean = component.hasDescriptor() && (!descriptor || descriptor.isAutoGenerated());
            const description: string =
                isInvalid ? i18n('notify.сomponent.descriptor.notfound') : (descriptor?.getDescription() || this.makeNoDescriptionText());

            return TreeComponent.create()
                .setDisplayName(descriptor?.getDisplayName() || component.getName().toString())
                .setDescription(description)
                .setIconUrl(descriptor?.getIcon())
                .setIconClass(ItemViewIconClassResolver.resolveByType(component.getType().getShortName()))
                .setHasChildren(!!descriptor?.getRegions()?.length)
                .setType(component.getType())
                .setInvalid(isInvalid)
                .build();
        });
    }

    private makeTextComponentItem(component: TextComponent): TreeComponent {
        return TreeComponent.create()
            .setDisplayName(this.makeTextComponentDisplayName(component))
            .setDescription(TextComponentType.get().getShortName())
            .setIconClass(ItemViewIconClassResolver.resolveByType(component.getType().getShortName()))
            .setHasChildren(false)
            .setType(TextComponentType.get())
            .build();
    }

    private makeTextComponentDisplayName(component: TextComponent): string {
        return StringHelper.htmlToString(component.getText() || '').replace(/(\r\n|\n|\r)/gm, '').trim() || component.getName().toString();
    }

    private fetchDescriptor(component: Component): Q.Promise<Descriptor | null> {
        if (!(component instanceof DescriptorBasedComponent)) {
            return Q.resolve(null);
        }

        if (!component.hasDescriptor()) {
            return Q.resolve(null);
        }

        const descriptorKey: string = component.getDescriptorKey().toString();
        const type: LayoutComponentType | PartComponentType = component instanceof LayoutComponent
                                                              ? LayoutComponentType.get()
                                                              : PartComponentType.get();
        return new GetComponentDescriptorRequest(descriptorKey, type).sendAndParse().catch((error: unknown) => {
            console.log(error);
            return null;
        });
    }

    private addComponent(component: Component): Q.Promise<ComponentsTreeItem> {
        const parentNode: TreeNode<ComponentsTreeItem> = this.getNodeByPath(component.getParent().getPath());
        if (!parentNode) {
            return;
        }

        const index: number = component.getIndex();
        if (index < 0) {
            return;
        }

        return this.fetchComponentItem(component).then((fullComponent: TreeComponent) => {
            const item: ComponentsTreeItem = new ComponentsTreeItem(fullComponent);
            this.insertDataToParentNode(item, parentNode, index);

            return item;
        });
    }

    protected doUpdateNodeByData(nodeToUpdate: TreeNode<ComponentsTreeItem>, data: ComponentsTreeItem): void {
        nodeToUpdate.setExpandable(this.hasChildren(data));
        super.doUpdateNodeByData(nodeToUpdate, data);
    }

    scrollToItem(path: ComponentPath) {
        const node: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);

        if (node) {
            this.scrollToRow(this.getRowByNodeId(node.getId()));
            const row = this.getRowByNodeId(node.getId());
            const itemElement = this.getGrid().getCellNode(row, 0);

            if (itemElement && !this.isElementInViewport(itemElement)) {
                itemElement.scrollIntoView();
            }
        }
    }

    isItemSelected(path: ComponentPath): boolean {
        if (!this.hasSelectedItems()) {
            return false;
        }

        return this.getSelectedDataList().map(item => this.getPathByItem(item)).some(
            (selectedItemPath: ComponentPath) => selectedItemPath.equals(path));
    }

    private getNodeByPath(path: ComponentPath): TreeNode<ComponentsTreeItem> {
        if (!path) {
            return null;
        }

        return this.getRoot().getAllDefaultRootNodes().find((node: TreeNode<ComponentsTreeItem>) => {
            const nodePath = this.getNodePath(node);
            return path.equals(nodePath);
        });
    }

    private getItemByPath(path: ComponentPath): ComponentsTreeItem {
        return this.getNodeByPath(path)?.getData();
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
        const treeComponent: TreeComponent = node.getData().getComponent();

        return super.isToBeExpanded(node) ||
               !(treeComponent.getType() instanceof LayoutComponentType) || node.getParent() === node.getRoot();
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

    selectItemByPath(path: ComponentPath): Q.Promise<void> {
        return this.expandRecursivelyFromTopToView(path.getParentPath()).then(() => {
            if (!this.isItemSelected(path)) { // if not already selected
                const node: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);
                if (node) {
                    this.selectRow(this.getRowByNodeId(node.getId()));
                }
            }
        });
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

    private expandRecursivelyFromTopToView(path?: ComponentPath): Q.Promise<boolean> {
        if (!path) {
            return Q.resolve(true);
        }

        const node: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);

        if (node) { // ItemView's corresponding node is already in the tree
            return this.expandRecursivelyFromTopToNode(node);
        }

        // No node in the tree for the ItemView, looking for the first parent ItemView with a node in the tree
        return this.expandRecursivelyFromTopToView(path.getParentPath()).then(() => {
            // after parent items expanded, looking for the node again
            const node: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);

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

    private deleteItemByPath(path: ComponentPath): void {
        const node: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);

        if (node) {
            this.deleteNode(node);
        }
    }

    private updateItemByPath(path: ComponentPath): void {
        const nodeToUpdate: TreeNode<ComponentsTreeItem> = this.getNodeByPath(path);

        if (!nodeToUpdate) {
            return;
        }

        const item: PageItem = PageState.getState().getComponentByPath(path);

        if (item instanceof Component) {
            this.fetchComponentItem(item).then((updatedComponent: TreeComponent) => {
                return this.updateExistingNode(nodeToUpdate, updatedComponent);
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private updateExistingNode(nodeToUpdate: TreeNode<ComponentsTreeItem>, updatedComponent: TreeComponent): Q.Promise<boolean> {
        // preserving old id since it might be used as selected node id etc.
        const treeComponent: ComponentsTreeItem = new ComponentsTreeItem(updatedComponent, +nodeToUpdate.getDataId());
        nodeToUpdate.setData(treeComponent);
        nodeToUpdate.setExpandable(treeComponent.getComponent().hasChildren());
        this.invalidateNodes([nodeToUpdate]);

        if (updatedComponent.getType() instanceof LayoutComponentType && this.isIdSelected(nodeToUpdate.getDataId())) {
            return this.expandNode(nodeToUpdate);
        }

        return Q.resolve();
    }

    private isIdSelected(dataId: string): boolean {
        return this.getSelectedItems().some((item: string) => item === dataId);
    }

    getPathByItem(item: ComponentsTreeItem): ComponentPath {
        if (item.getType() === 'page') {
            return ComponentPath.root();
        }

        const node: TreeNode<ComponentsTreeItem> = this.getRoot().getAllDefaultRootNodes().find((node: TreeNode<ComponentsTreeItem>) => {
            return node.getDataId() === item.getId();
        });

        return node ? this.getNodePath(node) : null;
    }

    getNodePath(node: TreeNode<ComponentsTreeItem>): ComponentPath {
        let result: string = '';

        while (node?.hasParent()) {
            if (node.getParent() === node.getRoot()) {
                //
            } else if (node.getData().getType() === 'region') {
                result = '/' + node.getData().getComponent().getDisplayName() + result;
            } else {
                result = '/' + node.getParent().getChildren().indexOf(node) + result;
            }

            node = node.getParent();
        }

        return ComponentPath.fromString(result);
    }

    protected expandOnClick(elem: ElementHelper, data: Slick.OnClickEventArgs<ComponentsTreeItem>) {
        // trick to avoid select/deselect when clicking on menu icon
        if (PageComponentsMenuIcon.isMenuIcon(elem)) {
            this.setActive(true);
            return;
        }

        super.expandOnClick(elem, data);
    }

    private isRootItemWithChildren(): boolean {
        return this.getRoot().getDefaultRoot()?.getChildren()[0]?.hasChildren();
    }

}
