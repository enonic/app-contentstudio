import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {ItemView, ItemViewBuilder} from './ItemView';
import {ItemViewAddedEvent} from './ItemViewAddedEvent';
import {ItemViewRemovedEvent} from './ItemViewRemovedEvent';
import {ItemViewSelectedEventConfig} from './event/outgoing/navigation/SelectComponentEvent';
import {ComponentViewContextMenuTitle} from './ComponentViewContextMenuTitle';
import {ComponentItemType} from './ComponentItemType';
import {ComponentInspectedEvent} from './ComponentInspectedEvent';
import {FragmentItemType} from './fragment/FragmentItemType';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {ItemViewFactory} from './ItemViewFactory';
import {PageItemType} from './PageItemType';
import {RegionView} from './RegionView';
import {PageView} from './PageView';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {CreateFragmentEvent} from './event/outgoing/manipulation/CreateFragmentEvent';
import {LiveEditParams} from './LiveEditParams';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {RemoveComponentRequest} from './event/outgoing/manipulation/RemoveComponentRequest';
import {DuplicateComponentEvent} from './event/outgoing/manipulation/DuplicateComponentEvent';
import {ResetComponentEvent} from './event/outgoing/manipulation/ResetComponentEvent';
import {DragAndDrop} from './DragAndDrop';

export class ComponentViewBuilder {

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    type: ComponentItemType;

    parentRegionView: RegionView;

    parentElement: Element;

    element: Element;

    positionIndex: number = -1;

    contextMenuActions: Action[];

    placeholder: ItemViewPlaceholder;

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

    setLiveEditParams(value: LiveEditParams): this {
        this.liveEditParams = value;
        return this;
    }
}

export class ComponentView
    extends ItemView
    implements Cloneable {

    protected empty: boolean;

    private moving: boolean = false;

    private itemViewAddedListeners: ((event: ItemViewAddedEvent) => void)[] = [];

    private itemViewRemovedListeners: ((event: ItemViewRemovedEvent) => void)[] = [];

    protected initOnAdd: boolean = true;

    public static debug: boolean = false;

    private keyBinding: KeyBinding[];

    constructor(builder: ComponentViewBuilder) {
        super(new ItemViewBuilder()
            .setItemViewIdProducer(
                builder.itemViewIdProducer ? builder.itemViewIdProducer : builder.parentRegionView.getItemViewIdProducer())
            .setItemViewFactory(builder.itemViewFactory ? builder.itemViewFactory : builder.parentRegionView.getItemViewFactory())
            .setPlaceholder(builder.placeholder)
            .setType(builder.type)
            .setElement(builder.element)
            .setParentView(builder.parentRegionView)
            .setParentElement(builder.parentElement)
            .setLiveEditParams(builder.liveEditParams)
            .setContextMenuTitle(new ComponentViewContextMenuTitle(builder.type?.getShortName(), builder.type))
        );

        // that will immediately set connection between component and parent region
        if (this.getParentItemView() && builder.positionIndex >= 0) {
            this.getParentItemView().registerComponentViewInParent(this, builder.positionIndex);
        }

        this.empty = StringHelper.isEmpty(builder.element?.getHtml()) ||
                     (this.getChildren().length === 1 && this.getChildren()[0] === this.placeholder);
        this.initListeners();
        this.addComponentContextMenuActions(builder.inspectActionRequired);
        this.initKeyBoardBindings();
        this.refreshEmptyState();
    }

    protected initListeners() {
     //
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

        if (!this.empty) {
            actions.push(new Action(i18n('live.view.reset')).onExecuted(() => {
                new ResetComponentEvent(this.getPath()).fire();
            }));
        }

        if (!isTopFragmentComponent) {
            actions.push(new Action(i18n('live.view.remove')).onExecuted(() => {
                new RemoveComponentRequest(this.getPath()).fire();
            }));

            actions.push(new Action(i18n('live.view.duplicate')).onExecuted(() => {
                this.deselect();

                new DuplicateComponentEvent(this.getPath()).fire();
            }));
        }

        let isFragmentComponent = this.getType().equals(FragmentItemType.get());

        if (!isFragmentComponent && this.getLiveEditParams().isFragmentAllowed) {
            actions.push(new Action(i18n('action.component.create.fragment')).onExecuted(() => {
                this.deselect();

                new CreateFragmentEvent(this.getPath()).fire();
            }));
        }

        this.addContextMenuActions(actions);
    }

    private initKeyBoardBindings() {
        const removeHandler = () => {
            new RemoveComponentRequest(this.getPath()).fire();
            return true;
        };
        this.keyBinding = [
            new KeyBinding('del', removeHandler),
            new KeyBinding('backspace', removeHandler)
        ];

    }

    select(config?: ItemViewSelectedEventConfig, menuPosition?: ItemViewContextMenuPosition) {
        super.select(config, menuPosition);
        KeyBindings.get().bindKeys(this.keyBinding);
    }

    deselect(silent?: boolean) {
        KeyBindings.get().unbindKeys(this.keyBinding);

        super.deselect(silent);
    }

    remove(): ComponentView {
        let parentView = this.getParentItemView();
        if (parentView) {
            parentView.removeComponentView(this);
        }

        super.remove();

        return this;
    }

    getType(): ComponentItemType {
        return super.getType() as ComponentItemType;
    }

    getName(): string {
        return this.getType().getShortName();
    }

    getParentItemView(): RegionView {
        return super.getParentItemView() as RegionView;
    }

    setMoving(value: boolean) {
        this.moving = value;
    }

    isMoving(): boolean {
        return this.moving;
    }

    getPath(): ComponentPath {
        if (this.getType() instanceof ComponentItemType && this.getParentItemView().getType() instanceof PageItemType) {
            return ComponentPath.root();
        }

        return new ComponentPath(this.getParentItemView().getComponentViewIndex(this), this.getParentItemView().getPath());
    }

    clone(): ComponentView {
        const config = new CreateItemViewConfig<RegionView>()
            .setParentView(this.getParentItemView())
            .setParentElement(this.getParentElement())
            .setLiveEditParams(this.getLiveEditParams());

        return this.createView(this.getType(), config) as ComponentView;
    }

    protected makeDuplicateConfig(config?: CreateItemViewConfig<RegionView>): CreateItemViewConfig<RegionView> {
        return (config || new CreateItemViewConfig<RegionView>())
            .setParentView(this.getParentItemView())
            .setParentElement(this.getParentElement())
            .setLiveEditParams(this.getLiveEditParams());
    }

    duplicate(): ComponentView {
        const parentView = this.getParentItemView();
        const index = parentView.getComponentViewIndex(this);
        const duplicateView = this.createView(this.getType(), this.makeDuplicateConfig()) as ComponentView;

        duplicateView.skipInitOnAdd();
        parentView.addComponentView(duplicateView, index + 1);

        return duplicateView;
    }

    toString() {
        return super.toString() + ' : ' + this.getPath().toString();
    }

    replaceWith(replacement: ComponentView) {
        if (ComponentView.debug) {
            console.log('ComponentView[' + this.toString() + '].replaceWith', this, replacement);
        }
        super.replaceWith(replacement);
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
            parentRegionView.notifyItemViewAdded(replacement);
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

    addComponentView(componentView: ComponentView, index: number) {
        this.getParentItemView().addComponentView(componentView, index, true);
    }

    getPageView(): PageView {
        return super.getPageView();
    }

    protected getRegionView(): RegionView {
        return super.getRegionView() as RegionView;
    }

    isEmpty(): boolean {
        return this.empty;
    }

    reset(): void {
        // recreate the component view from scratch
        // if the component has been reset
        this.empty = true;
        let clone = this.clone();
        this.replaceWith(clone);
        clone.select();
        clone.hideContextMenu();
    }

    private skipInitOnAdd(): void {
        this.initOnAdd = false;
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }
}
