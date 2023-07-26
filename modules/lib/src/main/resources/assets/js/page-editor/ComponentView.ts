import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {ItemView, ItemViewBuilder} from './ItemView';
import {ItemViewAddedEvent} from './ItemViewAddedEvent';
import {ItemViewRemovedEvent} from './ItemViewRemovedEvent';
import {ItemViewSelectedEventConfig} from './ItemViewSelectedEvent';
import {ComponentViewContextMenuTitle} from './ComponentViewContextMenuTitle';
import {ComponentItemType} from './ComponentItemType';
import {ComponentInspectedEvent} from './ComponentInspectedEvent';
import {ComponentDuplicatedEvent} from './ComponentDuplicatedEvent';
import {FragmentItemType} from './fragment/FragmentItemType';
import {ComponentResetEvent as UIComponentResetEvent} from './ComponentResetEvent';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {ItemViewFactory} from './ItemViewFactory';
import {PageItemType} from './PageItemType';
import {RegionView} from './RegionView';
import {PageView} from './PageView';
import {Component, ComponentPropertyChangedEventHandler, ComponentResetEventHandler} from '../app/page/region/Component';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {CreateComponentRequestedEvent} from './event/CreateComponentRequestedEvent';
import {LiveEditParams} from './LiveEditParams';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ComponentViewBuilder<COMPONENT extends Component> {

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    type: ComponentItemType;

    parentRegionView: RegionView;

    parentElement: Element;

    component: COMPONENT;

    element: Element;

    positionIndex: number;

    contextMenuActions: Action[];

    placeholder: ItemViewPlaceholder;

    viewer: Viewer<any>;

    inspectActionRequired: boolean;

    liveEditParams: LiveEditParams;

    /**
     * Optional. The ItemViewIdProducer of parentRegionView will be used if not set.
     */
    setItemViewIdProducer(value: ItemViewIdProducer): this {
        this.itemViewIdProducer = value;
        return this;
    }

    /**
     * Optional. The ItemViewFactory of parentRegionView will be used if not set.
     */
    setItemViewFactory(value: ItemViewFactory): this {
        this.itemViewFactory = value;
        return this;
    }

    setType(value: ComponentItemType): this {
        this.type = value;
        return this;
    }

    setParentRegionView(value: RegionView): this {
        this.parentRegionView = value;
        return this;
    }

    setParentElement(value: Element): this {
        this.parentElement = value;
        return this;
    }

    setComponent(value: COMPONENT): this {
        this.component = value;
        return this;
    }

    setElement(value: Element): this {
        this.element = value;
        return this;
    }

    setPositionIndex(value: number): this {
        this.positionIndex = value;
        return this;
    }

    setContextMenuActions(actions: Action[]): this {
        this.contextMenuActions = actions;
        return this;
    }

    setPlaceholder(value: ItemViewPlaceholder): this {
        this.placeholder = value;
        return this;
    }

    setInspectActionRequired(value: boolean): this {
        this.inspectActionRequired = value;
        return this;
    }

    setViewer(value: Viewer<any>): this {
        this.viewer = value;
        return this;
    }

    setLiveEditParams(value: LiveEditParams): this {
        this.liveEditParams = value;
        return this;
    }
}

export class ComponentView<COMPONENT extends Component>
    extends ItemView
    implements Cloneable {

    protected component: COMPONENT;

    protected empty: boolean;

    private moving: boolean = false;

    private itemViewAddedListeners: { (event: ItemViewAddedEvent): void }[] = [];

    private itemViewRemovedListeners: { (event: ItemViewRemovedEvent): void }[] = [];

    private propertyChangedListener: ComponentPropertyChangedEventHandler;

    private resetListener: ComponentResetEventHandler;

    protected initOnAdd: boolean = true;

    public static debug: boolean = false;

    private keyBinding: KeyBinding[];

    constructor(builder: ComponentViewBuilder<COMPONENT>) {
        super(new ItemViewBuilder()
            .setItemViewIdProducer(
                builder.itemViewIdProducer ? builder.itemViewIdProducer : builder.parentRegionView.getItemViewIdProducer())
            .setItemViewFactory(builder.itemViewFactory ? builder.itemViewFactory : builder.parentRegionView.getItemViewFactory())
            .setPlaceholder(builder.placeholder)
            .setViewer(builder.viewer)
            .setType(builder.type)
            .setElement(builder.element)
            .setParentView(builder.parentRegionView)
            .setParentElement(builder.parentElement)
            .setLiveEditParams(builder.liveEditParams)
            .setContextMenuTitle(new ComponentViewContextMenuTitle(builder.component, builder.type))
        );

        this.empty = StringHelper.isEmpty(builder.element.getHtml());
        this.initListeners();
        this.setComponent(builder.component);
        this.addComponentContextMenuActions(builder.inspectActionRequired);
        this.initKeyBoardBindings();
    }

    protected initListeners() {
        this.propertyChangedListener = () => this.refreshEmptyState();
        this.resetListener = () => {
            // recreate the component view from scratch
            // if the component has been reset
            this.deselect();
            let clone = this.clone();
            this.replaceWith(clone);
            clone.select();
            clone.hideContextMenu();

            new UIComponentResetEvent(this.getPath()).fire();
        };

        this.onRemoved(event => {
            if (this.component) {
                this.unregisterComponentListeners(this.component);
            }
        });

        this.onAdded(() => {
            if (this.component) {
                this.registerComponentListeners(this.component);
            }
        });
    }

    private registerComponentListeners(component: COMPONENT) {
        component.onReset(this.resetListener);
        component.onPropertyChanged(this.propertyChangedListener);
    }

    unregisterComponentListeners(component: COMPONENT) {
        component.unPropertyChanged(this.propertyChangedListener);
        component.unReset(this.resetListener);
    }

    protected addComponentContextMenuActions(inspectActionRequired: boolean) {
        let isFragmentContent = this.getLiveEditParams().isFragment;
        let parentIsPage = this.getParentItemView().getType().equals(PageItemType.get());
        let isTopFragmentComponent = parentIsPage && isFragmentContent;

        let actions: Action[] = [];

        if (!isTopFragmentComponent) {
            actions.push(this.createSelectParentAction());
            actions.push(this.createInsertAction());
        }

        if (inspectActionRequired) {
            actions.push(new Action(i18n('live.view.inspect')).onExecuted(() => {
                new ComponentInspectedEvent(this.getPath()).fire();
            }));
        }

        actions.push(new Action(i18n('live.view.reset')).onExecuted(() => {
            //
        }));

        if (!isTopFragmentComponent) {
            actions.push(new Action(i18n('live.view.remove')).onExecuted(() => {
                this.deselect();
                this.remove();
            }));
            actions.push(new Action(i18n('live.view.duplicate')).onExecuted(() => {
                this.deselect();

                let duplicatedComponent = <COMPONENT> this.getComponent().duplicate();
                let duplicatedView = this.duplicate(duplicatedComponent);

                duplicatedView.showLoadingSpinner();

                new ComponentDuplicatedEvent(this, duplicatedView).fire();
            }));
        }

        let isFragmentComponent = this.getType().equals(FragmentItemType.get());

        if (!isFragmentComponent && this.getLiveEditParams().isFragmentAllowed) {
            actions.push(new Action(i18n('live.view.saveAs.fragment')).onExecuted(() => {
                this.deselect();

                new CreateComponentRequestedEvent(this.getPath()).fire();
            }));
        }

        this.addContextMenuActions(actions);
    }

    private initKeyBoardBindings() {
        const removeHandler = () => {
            this.deselect();
            this.remove();
            return true;
        };
        this.keyBinding = [
            new KeyBinding('del', removeHandler),
            new KeyBinding('backspace', removeHandler)
        ];

    }

    select(config?: ItemViewSelectedEventConfig, menuPosition?: ItemViewContextMenuPosition) {
        Element.fromHtmlElement(<HTMLElement>window.frameElement).giveFocus();

        super.select(config, menuPosition);
        KeyBindings.get().bindKeys(this.keyBinding);

    }

    deselect(silent?: boolean) {
        KeyBindings.get().unbindKeys(this.keyBinding);

        super.deselect(silent);
    }

    remove(): ComponentView<COMPONENT> {
        if (this.component) {
            this.unregisterComponentListeners(this.component);
        }

        let parentView = this.getParentItemView();
        if (parentView) {
            parentView.removeComponentView(this);
        }

        super.remove();

        return this;
    }

    getType(): ComponentItemType {
        return <ComponentItemType>super.getType();
    }

    setComponent(component: COMPONENT) {
        if (component) {
            if (this.component) {
                this.unregisterComponentListeners(this.component);
            }
            this.registerComponentListeners(component);
        }

        this.component = component;
        this.refreshEmptyState();
    }

    getComponent(): COMPONENT {
        return this.component;
    }

    getName(): string {
        return this.component?.getName()?.toString();
    }

    getParentItemView(): RegionView {
        return <RegionView>super.getParentItemView();
    }

    setMoving(value: boolean) {
        this.moving = value;
    }

    isMoving(): boolean {
        return this.moving;
    }

    getPath(): ComponentPath {
        return new ComponentPath(this.getParentItemView().getComponentViewIndex(this), this.getParentItemView()?.getPath());
    }

    clone(): ComponentView<COMPONENT> {
        const isFragmentContent: boolean = this.getLiveEditParams().isFragment;
        const index: number = isFragmentContent ? 0 : this.getParentItemView().getComponentViewIndex(this);

        return <ComponentView<COMPONENT>>this.createView(this.getType(),
            new CreateItemViewConfig<RegionView, COMPONENT>().setParentView(this.getParentItemView()).setParentElement(
                this.getParentElement()).setData(this.getComponent()).setPositionIndex(index));
    }

    protected duplicate(duplicate: COMPONENT): ComponentView<COMPONENT> {

        let parentView = this.getParentItemView();
        let index = parentView.getComponentViewIndex(this);

        let duplicateView = <ComponentView<COMPONENT>>this.createView(this.getType(),
            new CreateItemViewConfig<RegionView, COMPONENT>()
                .setParentView(this.getParentItemView())
                .setParentElement(this.getParentElement())
                .setData(duplicate)
                .setPositionIndex(index + 1));

        duplicateView.skipInitOnAdd();
        parentView.addComponentView(duplicateView, index + 1);

        return duplicateView;
    }

    toString() {
        return super.toString() + ' : ' + this.getPath().toString();
    }

    replaceWith(replacement: ComponentView<COMPONENT>) {
        if (ComponentView.debug) {
            console.log('ComponentView[' + this.toString() + '].replaceWith', this, replacement);
        }
        super.replaceWith(replacement);

        // unbind the old view from the component and bind the new one
        if (this.component) {
            this.unregisterComponentListeners(this.component);
        }
        this.unbindMouseListeners();

        let parentIsPage = PageItemType.get().equals(this.getParentItemView().getType());
        if (parentIsPage) {
            const pageView = this.getPageView();
            pageView.unregisterFragmentComponentView(this);
            pageView.registerFragmentComponentView(replacement);
        } else {
            let index = this.getParentItemView().getComponentViewIndex(this);

            let parentRegionView = this.getParentItemView();
            parentRegionView.unregisterComponentView(this);
            parentRegionView.registerComponentView(replacement, index);
        }
    }

    moveToRegion(toRegionView: RegionView, toIndex: number) {
        const parentRegionView = this.getParentItemView();
        if (ComponentView.debug) {
            console.log('ComponentView[' + this.toString() + '].moveToRegion', this, parentRegionView, toRegionView);
        }

        this.moving = false;

        if (parentRegionView.getPath().equals(toRegionView.getPath()) &&
            toIndex === parentRegionView.getComponentViewIndex(this)) {

            if (ComponentView.debug) {
                console.debug('Dropped in the same region at the same index, no need to move', parentRegionView, toRegionView);
            }
            return;
        }

        // Unregister from previous region...
        let parentView = this.getParentItemView();
        if (parentView) {
            parentView.removeComponentView(this);
        }

        // Register with new region...
        toRegionView.addComponentView(this, toIndex, false, true);
    }

    onItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners.push(listener);
    }

    unItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners = this.itemViewAddedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    notifyItemViewAdded(view: ItemView, isNew: boolean = false) {
        let event = new ItemViewAddedEvent(view, isNew);
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

    notifyItemViewRemoved(view: ItemView) {
        let event = new ItemViewRemovedEvent(view);
        this.itemViewRemovedListeners.forEach((listener) => {
            listener(event);
        });
    }

    getNewItemIndex(): number {
        return this.getParentItemView().getComponentViewIndex(this) + 1;
    }

    addComponentView(componentView: ComponentView<COMPONENT>, index: number) {
        this.getParentItemView().addComponentView(componentView, index, true);
    }

    getPageView(): PageView {
        return super.getPageView();
    }

    protected getRegionView(): RegionView {
        return <RegionView>super.getRegionView();
    }

    isEmpty(): boolean {
        return this.empty;
    }

    private skipInitOnAdd(): void {
        this.initOnAdd = false;
    }
}
