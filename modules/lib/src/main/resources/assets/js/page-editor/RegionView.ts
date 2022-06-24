import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ItemView, ItemViewBuilder} from './ItemView';
import {RegionItemType} from './RegionItemType';
import {RegionViewContextMenuTitle} from './RegionViewContextMenuTitle';
import {RegionComponentViewer} from './RegionComponentViewer';
import {RegionPlaceholder} from './RegionPlaceholder';
import {LiveEditModel} from './LiveEditModel';
import {ItemViewAddedEvent} from './ItemViewAddedEvent';
import {ItemViewRemovedEvent} from './ItemViewRemovedEvent';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {ItemViewSelectedEventConfig} from './ItemViewSelectedEvent';
import {RegionSelectedEvent} from './RegionSelectedEvent';
import {ComponentAddedEvent as PageEditorComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentRemovedEvent as PageEditorComponentRemovedEvent} from './ComponentRemovedEvent';
import {ItemType} from './ItemType';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {PageViewController} from './PageViewController';
import {LayoutItemType} from './layout/LayoutItemType';
import {ComponentView} from './ComponentView';
import {PageView} from './PageView';
import {LayoutComponentView} from './layout/LayoutComponentView';
import {DragAndDrop} from './DragAndDrop';
import {Region} from '../app/page/region/Region';
import {Component} from '../app/page/region/Component';
import {RegionPath} from '../app/page/region/RegionPath';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {ComponentAddedEvent} from '../app/page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../app/page/region/ComponentRemovedEvent';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {assert} from '@enonic/lib-admin-ui/util/Assert';

export class RegionViewBuilder {

    liveEditModel: LiveEditModel;

    parentElement: Element;

    parentView: ItemView;

    region: Region;

    element: Element;

    setLiveEditModel(value: LiveEditModel): RegionViewBuilder {
        this.liveEditModel = value;
        return this;
    }

    setParentElement(value: Element): RegionViewBuilder {
        this.parentElement = value;
        return this;
    }

    setParentView(value: ItemView): RegionViewBuilder {
        this.parentView = value;
        return this;
    }

    setRegion(value: Region): RegionViewBuilder {
        this.region = value;
        return this;
    }

    setElement(value: Element): RegionViewBuilder {
        this.element = value;
        return this;
    }
}

export class RegionView
    extends ItemView {

    private region: Region;

    private componentViews: ComponentView<Component>[];

    private componentIndex: number;

    private itemViewAddedListeners: { (event: ItemViewAddedEvent): void }[];

    private itemViewRemovedListeners: { (event: ItemViewRemovedEvent): void }[];

    private itemViewAddedListener: (event: ItemViewAddedEvent) => void;

    private itemViewRemovedListener: (event: ItemViewRemovedEvent) => void;

    private componentAddedListener: (event: ComponentAddedEvent) => void;

    private componentRemovedListener: (event: ComponentRemovedEvent) => void;

    private mouseDownLastTarget: HTMLElement;

    private mouseOverListener: (e: MouseEvent) => void;

    private resetAction: Action;

    private textMode: boolean = false;

    public static debug: boolean = false;

    constructor(builder: RegionViewBuilder) {
        super(new ItemViewBuilder()
            .setItemViewIdProducer(builder.parentView.getItemViewIdProducer())
            .setItemViewFactory(builder.parentView.getItemViewFactory())
            .setType(RegionItemType.get())
            .setElement(builder.element)
            .setPlaceholder(new RegionPlaceholder(builder.region))
            .setViewer(new RegionComponentViewer())
            .setParentElement(builder.parentElement)
            .setParentView(builder.parentView)
            .setContextMenuTitle(new RegionViewContextMenuTitle(builder.region)));

        this.addClassEx('region-view');

        this.componentViews = [];
        this.componentIndex = 0;
        this.itemViewAddedListeners = [];
        this.itemViewRemovedListeners = [];
        this.resetAction = new Action(i18n('live.view.reset')).onExecuted(() => {
            this.deselect();
            this.empty();
        });
        this.initListeners();

        this.setRegion(builder.region);

        this.addRegionContextMenuActions();

        this.parseComponentViews();
    }

    private initListeners() {

        this.itemViewAddedListener = (event: ItemViewAddedEvent) => this.notifyItemViewAdded(event.getView(), event.isNewlyCreated());

        this.itemViewRemovedListener = (event: ItemViewRemovedEvent) => {

            // Check if removed ItemView is a child, and remove it if so
            if (ObjectHelper.iFrameSafeInstanceOf(event.getView(), ComponentView)) {

                const removedComponentView: ComponentView<Component> = <ComponentView<Component>>event.getView();
                const childIndex = this.getComponentViewIndex(removedComponentView);
                if (childIndex > -1) {
                    this.componentViews.splice(childIndex, 1);
                }
            }
            this.notifyItemViewRemoved(event.getView());
        };

        this.componentAddedListener = (event: ComponentAddedEvent) => {
            if (RegionView.debug) {
                console.log('RegionView.handleComponentAdded: ' + event.getComponentPath().toString());
            }

            this.refreshEmptyState();
            this.handleResetContextMenuAction();
        };

        this.componentRemovedListener = (event: ComponentRemovedEvent) => {
            if (RegionView.debug) {
                console.log('RegionView.handleComponentRemoved: ' + event.getComponentPath().toString());
            }

            this.refreshEmptyState();
            this.handleResetContextMenuAction();
        };

        this.onMouseDown(this.memorizeLastMouseDownTarget.bind(this));

        this.mouseOverListener = (e: MouseEvent) => {
            if (this.isDragging() && this.isElementOverRegion((<HTMLElement>e.target))) {
                this.highlight();
            }
        };

        this.onMouseOver(this.mouseOverListener);

        const textEditModeListener = (value: boolean) => this.textMode = value;

        PageViewController.get().onTextEditModeChanged(textEditModeListener);

        this.onRemoved(event => {
            PageViewController.get().unTextEditModeChanged(textEditModeListener);
        });
    }

    /*
        Checking if this region is where mouseover triggered to not highlight region's ancestor regions
    */
    private isElementOverRegion(element: HTMLElement): boolean {
        while (!element.hasAttribute('data-portal-region')) {
            element = element.parentElement;
        }

        return element === this.getHTMLElement();
    }

    memorizeLastMouseDownTarget(event: MouseEvent) {
        this.mouseDownLastTarget = <HTMLElement> event.target;
    }

    private addRegionContextMenuActions() {
        const actions: Action[] = [];

        actions.push(this.createSelectParentAction());
        actions.push(this.createInsertAction());

        this.addContextMenuActions(actions);
        this.handleResetContextMenuAction();
    }

    private handleResetContextMenuAction() {
        if (this.isEmpty()) {
            this.removeContextMenuAction(this.resetAction);
        } else {
            if (this.getContextMenuActions().indexOf(this.resetAction) === -1) {
                this.addContextMenuActions([this.resetAction]);
            }
        }
    }

    setRegion(region: Region) {
        if (region) {
            if (this.region) {
                this.region.unComponentAdded(this.componentAddedListener);
                this.region.unComponentRemoved(this.componentRemovedListener);
            }
            this.region = region;

            this.region.onComponentAdded(this.componentAddedListener);
            this.region.onComponentRemoved(this.componentRemovedListener);

            const components = region.getComponents();
            const componentViews = this.getComponentViews();

            componentViews.forEach((view: ComponentView<Component>, index: number) => {
                view.setComponent(components[index]);
            });
        }

        this.refreshEmptyState();
        this.handleResetContextMenuAction();
    }

    getRegion(): Region {
        return this.region;
    }

    getRegionName(): string {
        return this.getRegionPath() ? this.getRegionPath().getRegionName() : null;
    }

    getRegionPath(): RegionPath {
        return this.region ? this.region.getPath() : null;
    }

    getName(): string {
        return this.getRegionName() ? this.getRegionName().toString() : i18n('live.view.itemview.noname');
    }

    /*
            highlight() {
                // Don't highlight region on hover
            }

            unhighlight() {
                // Don't highlight region on hover
            }
    */
    highlightSelected() {
        if (!this.textMode && !this.isDragging()) {
            super.highlightSelected();
        }
    }

    showCursor() {
        if (!this.textMode) {
            super.showCursor();
        }
    }

    handleClick(event: MouseEvent) {
        const pageView = this.getPageView();
        if (pageView.isTextEditMode()) {
            event.stopPropagation();
            if (!pageView.hasTargetWithinTextComponent(this.mouseDownLastTarget)) {
                pageView.setTextEditMode(false);
            }
        } else {
            super.handleClick(event);
        }
    }

    select(config?: ItemViewSelectedEventConfig, menuPosition?: ItemViewContextMenuPosition) {
        config.newlyCreated = false;
        config.rightClicked = false;

        super.select(config, menuPosition);

        new RegionSelectedEvent(this, config.rightClicked).fire();
    }

    selectWithoutMenu(restoredSelection?: boolean) {
        super.selectWithoutMenu(restoredSelection);

        new RegionSelectedEvent(this).fire();
    }

    toString() {
        let extra = '';
        if (this.getRegionPath()) {
            extra = ' : ' + this.getRegionPath().toString();
        }
        return super.toString() + extra;
    }

    registerComponentView(componentView: ComponentView<Component>, index: number, newlyCreated: boolean = false) {
        if (RegionView.debug) {
            console.log('RegionView[' + this.toString() + '].registerComponentView: ' + componentView.toString() + ' at ' + index);
        }

        if (index >= 0) {
            this.componentViews.splice(index, 0, componentView);
        } else {
            this.componentViews.push(componentView);
        }
        componentView.setParentItemView(this);

        componentView.onItemViewAdded(this.itemViewAddedListener);
        componentView.onItemViewRemoved(this.itemViewRemovedListener);

        this.notifyItemViewAdded(componentView, newlyCreated);
    }

    unregisterComponentView(componentView: ComponentView<Component>) {
        if (RegionView.debug) {
            console.log('RegionView[' + this.toString() + '].unregisterComponentView: ' + componentView.toString());
        }

        const indexToRemove = this.getComponentViewIndex(componentView);
        if (indexToRemove >= 0) {

            componentView.unItemViewAdded(this.itemViewAddedListener);
            componentView.unItemViewRemoved(this.itemViewRemovedListener);

            this.componentViews.splice(indexToRemove, 1);
            componentView.setParentItemView(null);

            this.notifyItemViewRemoved(componentView);

        } else {

            throw new Error('Did not find ComponentView to remove: ' + componentView.getItemId().toString());
        }
    }

    getNewItemIndex(): number {
        return 0;
    }

    addComponentView(componentView: ComponentView<Component>, index: number, newlyCreated: boolean = false, dragged?: boolean) {
        if (RegionView.debug) {
            console.log('RegionView[' + this.toString() + ']addComponentView: ' + componentView.toString() + ' at ' + index);
        }
        if (componentView.getComponent()) {
            this.region.addComponent(componentView.getComponent(), index);
        }

        this.insertChild(componentView, index);
        this.registerComponentView(componentView, index, newlyCreated || dragged);

        new PageEditorComponentAddedEvent(componentView, this, dragged).fire();
    }

    removeComponentView(componentView: ComponentView<Component>, silent: boolean = false) {
        if (RegionView.debug) {
            console.log('RegionView[' + this.toString() + '].removeComponentView: ' + componentView.toString());
        }

        this.unregisterComponentView(componentView);
        if (!silent) {
            this.removeChild(componentView);
        }

        if (componentView.getComponent()) {
            componentView.getComponent().remove();
        }

        new PageEditorComponentRemovedEvent(componentView, this).fire();
    }

    getComponentViews(): ComponentView<Component>[] {
        return this.componentViews;
    }

    getComponentViewIndex(view: ComponentView<Component>): number {

        return this.componentViews.indexOf(view);
    }

    getComponentViewByIndex(index: number): ComponentView<Component> {

        return this.componentViews[index];
    }

    getComponentViewByPath(path: ComponentPath): ComponentView<Component> {

        const firstLevelOfPath = path.getFirstLevel();

        if (path.numberOfLevels() === 1) {

            return this.componentViews[firstLevelOfPath.getComponentIndex()];
        }

        for (let i = 0; i < this.componentViews.length; i++) {
            const componentView = this.componentViews[i];
            if (componentView.getType().equals(LayoutItemType.get())) {

                const layoutView = <LayoutComponentView>componentView;
                const match = layoutView.getComponentViewByPath(path.removeFirstLevel());
                if (match) {
                    return match;
                }
            }
        }

        return null;
    }

    hasOnlyMovingComponentViews(): boolean {
        return this.componentViews.length > 0 && this.componentViews.every((view: ComponentView<Component>) => {
            return view.isMoving();
        });
    }

    isEmpty(): boolean {
        const onlyMoving = this.hasOnlyMovingComponentViews();
        const empty = !this.region || this.region.isEmpty();

        return empty || onlyMoving;
    }

    empty() {
        if (RegionView.debug) {
            console.debug('RegionView[' + this.toString() + '].empty()', this.componentViews);
        }

        while (this.componentViews.length > 0) {
            // remove component modifies the components array so we can't rely on forEach
            this.removeComponentView(this.componentViews[0]);
        }
    }

    getPageView(): PageView {
        return super.getPageView();
    }

    remove(): RegionView {
        this.unMouseOver(this.mouseOverListener);
        super.remove();
        return this;
    }

    toItemViewArray(): ItemView[] {

        let array: ItemView[] = [];
        array.push(this);
        this.componentViews.forEach((componentView: ComponentView<Component>) => {
            const itemViews = componentView.toItemViewArray();
            array = array.concat(itemViews);
        });
        return array;
    }

    onItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners.push(listener);
    }

    unItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners = this.itemViewAddedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyItemViewAdded(itemView: ItemView, newlyCreated: boolean = false) {
        const event = new ItemViewAddedEvent(itemView, newlyCreated);
        this.itemViewAddedListeners.forEach((listener) => {
            listener(event);
        });
    }

    onItemViewRemoved(listener: (event: ItemViewRemovedEvent) => void) {
        this.itemViewRemovedListeners.push(listener);
    }

    unItemViewRemoved(listener: (event: ItemViewRemovedEvent) => void) {
        this.itemViewRemovedListeners = this.itemViewRemovedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    getRegionView(): RegionView {
        return this;
    }

    private notifyItemViewRemoved(itemView: ItemView) {
        const event = new ItemViewRemovedEvent(itemView);
        this.itemViewRemovedListeners.forEach((listener) => {
            listener(event);
        });
    }

    static isRegionViewFromHTMLElement(htmlElement: HTMLElement): boolean {

        const name = htmlElement.getAttribute('data-' + ItemType.ATTRIBUTE_REGION_NAME);
        return !StringHelper.isBlank(name);
    }

    private parseComponentViews() {
        this.componentViews.forEach((componentView) => {
            this.unregisterComponentView(componentView);
        });

        this.componentViews = [];
        this.componentIndex = 0;

        this.doParseComponentViews();
    }

    private doParseComponentViews(parentElement?: Element) {

        const children = parentElement ? parentElement.getChildren() : this.getChildren();
        const region = this.getRegion();

        children.forEach((childElement: Element) => {
            const itemType = ItemType.fromElement(childElement);
            const isComponentView = ObjectHelper.iFrameSafeInstanceOf(childElement, ComponentView);
            let component: Component;
            let componentView;

            if (isComponentView) {
                component = region.getComponentByIndex(this.componentIndex++);
                if (component) {
                    // reuse existing component view
                    componentView = <ComponentView<Component>> childElement;
                    // update view's data
                    componentView.setComponent(component);
                    // register it again because we unregistered everything before parsing
                    this.registerComponentView(componentView, this.componentIndex);
                }
            } else if (itemType) {
                assert(itemType.isComponentType(),
                    'Expected ItemView beneath a Region to be a Component: ' + itemType.getShortName());
                // components may be nested on different levels so use region wide var for count
                component = region.getComponentByIndex(this.componentIndex++);
                if (component) {

                    componentView = <ComponentView<Component>>this.createView(
                        itemType,
                        new CreateItemViewConfig<RegionView, Component>()
                            .setParentView(this)
                            .setData(component)
                            .setElement(childElement)
                            .setParentElement(parentElement ? parentElement : this));

                    this.registerComponentView(componentView, this.componentIndex);
                }
            } else {
                this.doParseComponentViews(childElement);
            }
        });
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }
}
