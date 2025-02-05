import * as Q from 'q';
import {DescriptorBasedComponent} from '../page/region/DescriptorBasedComponent';
import {Component} from '../page/region/Component';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {GetComponentDescriptorRequest} from '../resource/GetComponentDescriptorRequest';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {Descriptor} from '../page/Descriptor';
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
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TreeListBox, TreeListBoxParams, TreeListElement, TreeListElementParams} from '@enonic/lib-admin-ui/ui/selector/list/TreeListBox';
import {PageEventsManager} from './PageEventsManager';
import {PageComponentsItemView} from './PageComponentsItemView';

export class PageComponentsTreeGrid
    extends TreeListBox<ComponentsTreeItem> {

    private loadedListeners: (() => void)[] = [];

    private wasLoaded: boolean = false;

    constructor(params?: TreeListBoxParams<ComponentsTreeItem>) {
        super(params);
    }

    protected createItemView(item: ComponentsTreeItem, readOnly: boolean): PageComponentsListElement {
        const itemView = new PageComponentsListElement(item, {scrollParent: this.scrollParent, level: this.level, parentList: this});

        if (this.isRootList() || !(item.getType() instanceof LayoutComponentType)) {
            itemView.whenRendered(() => itemView.expand());
        }

        return itemView;
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

    protected getItemId(item: ComponentsTreeItem): string {
        return item.getId();
    }

    load(): Q.Promise<void> {
        if (!PageState.getState() || !this.isVisible()) {
            return Q.resolve();
        }

        this.clearItems();
        this.handleLazyLoad();
    }

    protected handleLazyLoad(): void {
        if (this.getItemCount() === 0) {
            this.fetch().then((items: ComponentsTreeItem[]) => {
                if (items.length > 0) {
                    this.addItems(items);
                }

                this.wasLoaded = true;
                this.notifyItemsLoaded();
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private fetch(): Q.Promise<ComponentsTreeItem[]> {
        return this.isRootList() ? this.fetchRootItems() : this.fetchItems();
    }

    isRootList(): boolean {
        return !this.getParentItem();
    }

    private fetchRootItems(): Q.Promise<ComponentsTreeItem[]> {
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

    private fetchItems(): Q.Promise<ComponentsTreeItem[]> {
        const path: ComponentPath = (this.getParentListElement() as PageComponentsListElement).getComponentPath();
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

    fetchComponentItem(component: Component): Q.Promise<TreeComponent> {
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
            const isLayoutFragment: boolean = content?.getPage().getFragment() instanceof LayoutComponent;

            return TreeComponent.create()
                .setDisplayName(content?.getDisplayName() || fragmentComponent.getName().toString())
                .setDescription(description)
                .setIconClass(ItemViewIconClassResolver.resolveByType(FragmentComponentType.get().getShortName()))
                .setHasChildren(false)
                .setInvalid(isInvalid)
                .setType(FragmentComponentType.get())
                .setLayoutFragment(isLayoutFragment)
                .build();
        });
    }

    private fetchDescriptorBasedComponent(component: DescriptorBasedComponent): Q.Promise<TreeComponent> {
        return this.fetchDescriptor(component).then((descriptor: Descriptor | null) => {
            const isInvalid: boolean = component.hasDescriptor() && (!descriptor || descriptor.isAutoGenerated());
            const description: string =
                isInvalid ? i18n('notify.component.descriptor.notfound') : (descriptor?.getDescription() || this.makeNoDescriptionText());

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

    findItemIndex(item: ComponentsTreeItem): number {
        return super.findItemIndex(item);
    }

    whenItemsLoaded(handler: () => void): void {
        if (this.wasLoaded) {
            handler();
        } else {
            this.loadedListeners.push(handler);
        }
    }

    private notifyItemsLoaded(): void {
        this.loadedListeners.forEach((listener) => listener());
        this.loadedListeners = [];
    }
}

export class PageComponentsListElement
    extends TreeListElement<ComponentsTreeItem> {

    private wasExpanded: boolean = false;

    constructor(content: ComponentsTreeItem, params: TreeListElementParams<ComponentsTreeItem>) {
        super(content, params);
    }

    protected initListeners(): void {
        super.initListeners();

        this.getDataView().onDblClicked(() => {
            if (this.item.getType() instanceof TextComponentType) {
                const path: ComponentPath = this.getComponentPath();

                if (path) {
                    PageEventsManager.get().notifyTextComponentEditRequested(path);
                }
            }
        });
    }

    setExpanded(expanded: boolean): void {
        super.setExpanded(expanded);

        if (expanded) {
            this.wasExpanded = true;
        }
    }

    isExpandedAtLeastOnce(): boolean {
        return this.wasExpanded;
    }

    getComponentPath(): ComponentPath {
        return ComponentPath.fromString(this.getPath());
    }

    getPath(): string {
        if ((this.getParentList() as PageComponentsTreeGrid)?.isRootList()) {
            return ComponentPath.DIVIDER;
        }

        const parentItemPath = (this.getParentList().getParentListElement() as PageComponentsListElement)?.getPath();
        const parentPath = (parentItemPath && parentItemPath !== ComponentPath.DIVIDER) ? parentItemPath : '';

       return `${parentPath}${ComponentPath.DIVIDER}${this.getThisPath()}`;
    }

    private getThisPath(): string {
        if (this.item.getType() === 'page') {
            return '';
        }

        if (this.item.getType() === 'region') {
            return this.item.getComponent().getDisplayName();
        }

        return '' + (this.getParentList() as PageComponentsTreeGrid).findItemIndex(this.item);
    }

    protected createChildrenList(params?: TreeListBoxParams<ComponentsTreeItem>): PageComponentsTreeGrid {
        return new PageComponentsTreeGrid(params);
    }

    hasChildren(): boolean {
        return this.item.getComponent().hasChildren() || this.item.getType() === 'region';
    }

    protected createItemViewer(item: ComponentsTreeItem): PageComponentsItemView {
        const viewer = new PageComponentsItemView();
        viewer.setItem(item);
        return viewer;
    }

    setItem(item: ComponentsTreeItem): void {
        super.setItem(item);

        (this.itemViewer as PageComponentsItemView).setItem(item);
        this.updateExpandableState();
    }

    onMenuIconClicked(handler: (event: MouseEvent) => void): void {
        (this.itemViewer as PageComponentsItemView).onMenuIconClicked(handler);
    }
}
