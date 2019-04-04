import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {ItemType} from './ItemType';
import {LiveEditModel} from './LiveEditModel';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {ItemViewContextMenu, ItemViewContextMenuOrientation} from './ItemViewContextMenu';
import {Shader} from './Shader';
import {Highlighter} from './Highlighter';
import {SelectedHighlighter} from './SelectedHighlighter';
import {Cursor} from './Cursor';
import {ItemViewId} from './ItemViewId';
import {ItemViewSelectedEvent} from './ItemViewSelectedEvent';
import {ItemViewDeselectedEvent} from './ItemViewDeselectedEvent';
import {ItemViewIconClassResolver} from './ItemViewIconClassResolver';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {ClickPosition} from './ClickPosition';
import {FragmentItemType} from './fragment/FragmentItemType';
import {TextItemType} from './text/TextItemType';
import {LayoutItemType} from './layout/LayoutItemType';
import {PartItemType} from './part/PartItemType';
import {ImageItemType} from './image/ImageItemType';
import {PageViewController} from './PageViewController';
import {ItemViewFactory} from './ItemViewFactory';
import {RegionItemType} from './RegionItemType';
import {PageItemType} from './PageItemType';
import {Content} from '../app/content/Content';
import {Component, ComponentBuilder} from '../app/page/region/Component';
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from '../app/page/region/DescriptorBasedComponent';
import {ComponentType} from '../app/page/region/ComponentType';
import {FragmentComponentBuilder} from '../app/page/region/FragmentComponent';
import {FragmentComponentType} from '../app/page/region/FragmentComponentType';
import {ImageComponentType} from '../app/page/region/ImageComponentType';
import {ImageComponentBuilder} from '../app/page/region/ImageComponent';
import {LayoutComponentType} from '../app/page/region/LayoutComponentType';
import {LayoutComponentBuilder} from '../app/page/region/LayoutComponent';
import {PartComponentType} from '../app/page/region/PartComponentType';
import {PartComponentBuilder} from '../app/page/region/PartComponent';
import {TextComponentType} from '../app/page/region/TextComponentType';
import {TextComponentBuilder} from '../app/page/region/TextComponent';
import {PageView} from './PageView';
import PropertyTree = api.data.PropertyTree;
import i18n = api.util.i18n;
import ObjectHelper = api.ObjectHelper;

export interface ElementDimensions {
    top: number;
    left: number;
    width: number;
    height: number;
}

export class ItemViewBuilder {

    liveEditModel: LiveEditModel;

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    type: ItemType;

    element: api.dom.Element;

    parentElement: api.dom.Element;

    parentView: ItemView;

    contextMenuActions: api.ui.Action[];

    contextMenuTitle: ItemViewContextMenuTitle;

    placeholder: ItemViewPlaceholder;

    viewer: api.ui.Viewer<any>;

    setLiveEditModel(value: LiveEditModel): ItemViewBuilder {
        this.liveEditModel = value;
        return this;
    }

    setItemViewIdProducer(value: ItemViewIdProducer): ItemViewBuilder {
        this.itemViewIdProducer = value;
        return this;
    }

    setItemViewFactory(value: ItemViewFactory): ItemViewBuilder {
        this.itemViewFactory = value;
        return this;
    }

    setType(value: ItemType): ItemViewBuilder {
        this.type = value;
        return this;
    }

    setElement(value: api.dom.Element): ItemViewBuilder {
        this.element = value;
        return this;
    }

    setPlaceholder(value: ItemViewPlaceholder): ItemViewBuilder {
        this.placeholder = value;
        return this;
    }

    setViewer(value: api.ui.Viewer<any>): ItemViewBuilder {
        this.viewer = value;
        return this;
    }

    setParentView(value: ItemView): ItemViewBuilder {
        this.parentView = value;
        return this;
    }

    setParentElement(value: api.dom.Element): ItemViewBuilder {
        this.parentElement = value;
        return this;
    }

    setContextMenuActions(actions: api.ui.Action[]): ItemViewBuilder {
        this.contextMenuActions = actions;
        return this;
    }

    setContextMenuTitle(title: ItemViewContextMenuTitle): ItemViewBuilder {
        this.contextMenuTitle = title;
        return this;
    }
}

export class ItemView
    extends api.dom.Element {

    protected liveEditModel: LiveEditModel;

    private itemViewIdProducer: ItemViewIdProducer;

    private itemViewFactory: ItemViewFactory;

    private placeholder: ItemViewPlaceholder;

    private type: ItemType;

    private parentItemView: ItemView;

    private loadMask: api.ui.mask.LoadMask;

    private contextMenu: ItemViewContextMenu;

    private contextMenuTitle: ItemViewContextMenuTitle;

    private contextMenuActions: api.ui.Action[];

    private viewer: api.ui.Viewer<any>;

    private mouseOver: boolean;

    private shaded: boolean;

    private mouseOverViewListeners: { (): void } [];

    private mouseOutViewListeners: { (): void } [];

    private mouseOverViewListener: () => void;
    private mouseLeaveViewListener: () => void;
    private shaderClickedListener: (event: MouseEvent) => void;
    private mouseEnterListener: (event: MouseEvent) => void;
    private mouseLeaveListener: (event: MouseEvent) => void;
    private mouseClickedListener: (event: MouseEvent) => void;
    private contextMenuListener: (event: MouseEvent) => void;

    public static debug: boolean;

    constructor(builder: ItemViewBuilder) {
        api.util.assertNotNull(builder.type, 'type cannot be null');

        let props: api.dom.ElementBuilder = null;
        if (builder.element) {
            let elementFromElementBuilder = new api.dom.ElementFromElementBuilder();
            elementFromElementBuilder.setElement(builder.element);
            elementFromElementBuilder.setParentElement(builder.parentElement);
            elementFromElementBuilder.setGenerateId(false);
            props = elementFromElementBuilder;
        } else {
            let newElementBuilder = new api.dom.NewElementBuilder();
            newElementBuilder.setTagName('div');
            newElementBuilder.setParentElement(builder.parentElement);
            newElementBuilder.setGenerateId(false);
            props = newElementBuilder;
        }

        super(props);

        this.type = builder.type;
        this.parentItemView = builder.parentView;
        this.liveEditModel = builder.liveEditModel ? builder.liveEditModel : builder.parentView.getLiveEditModel();
        this.itemViewIdProducer = builder.itemViewIdProducer;
        this.itemViewFactory = builder.itemViewFactory;
        this.contextMenuTitle = builder.contextMenuTitle;

        this.addClassEx('item-view');

        this.contextMenuActions = [];

        this.setDraggable(true);

        this.mouseOver = false;
        this.mouseOverViewListeners = [];
        this.mouseOutViewListeners = [];

        this.setItemId(builder.itemViewIdProducer.next());

        if (!builder.element) {
            this.getEl().setData(ItemType.ATTRIBUTE_TYPE, builder.type.getShortName());
        }

        this.viewer = builder.viewer;

        // remove old placeholder in case of parsing already parsed page again
        for (let i = 0; i < this.getChildren().length; i++) {
            let child = this.getChildren()[i];
            if (api.ObjectHelper.iFrameSafeInstanceOf(child, ItemViewPlaceholder)) {
                this.removeChild(child);
                // there can be only one placeholder
                break;
            }
        }

        if (builder.placeholder) {
            this.setPlaceholder(builder.placeholder);
        }

        this.onRemoved(this.invalidateContextMenu.bind(this));

        this.bindMouseListeners();
    }

    protected addContextMenuActions(actions: api.ui.Action[]) {
        this.contextMenuActions = this.contextMenuActions.concat(actions);
    }

    protected removeContextMenuAction(action: api.ui.Action) {
        if (this.contextMenuActions.indexOf(action) === -1) {
            return;
        }
        this.contextMenuActions.splice(this.contextMenuActions.indexOf(action), 1);
    }

    protected setPlaceholder(placeholder: ItemViewPlaceholder) {
        this.placeholder = placeholder;
        this.appendChild(placeholder);
    }

    protected disableLinks() {
        wemjq(this.getHTMLElement()).find('a').click(e => e.preventDefault());
    }

    public setContextMenuTitle(title: ItemViewContextMenuTitle) {
        this.contextMenuTitle = title;
    }

    private bindMouseListeners() {
        this.mouseEnterListener = (event: MouseEvent) => this.handleMouseEnter(event);
        this.onMouseEnter(this.mouseEnterListener);

        this.mouseLeaveListener = (event: MouseEvent) => this.handleMouseLeave(event);
        this.onMouseLeave(this.mouseLeaveListener);

        this.mouseClickedListener = (event: MouseEvent) => this.handleClick(event);
        this.onClicked(this.mouseClickedListener);
        this.onTouchStart(this.mouseClickedListener);

        this.contextMenuListener = (event: MouseEvent) => this.handleClick(event);
        this.onContextMenu(this.contextMenuListener);

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, (item: api.ui.responsive.ResponsiveItem) => {
            if (this.mouseOver) {
                this.highlight();
            }
            if (this.isSelected()) {
                this.highlightSelected();
                //this.shade();
            }
        });

        // Page shader catches mouse events
        // so bind listener to it to know when a shader clicked
        // in case of the locked or selected page
        this.shaderClickedListener = (event: MouseEvent) => this.handleShaderClick(event);
        Shader.get().onClicked(this.shaderClickedListener);

        this.mouseOverViewListener = () => {
            let isRegistered = !!this.getParentItemView() || PageItemType.get().equals(this.getType());
            if (ItemView.debug) {
                console.log('ItemView[' + this.toString() + '].mouseOverViewListener registered: ' + isRegistered);
            }
            if (!isRegistered) {
                // the component has not been registered yet
                return;
            }

            if (!this.isDragging()) {
                this.showCursor();
                this.highlight();
            }
        };
        this.onMouseOverView(this.mouseOverViewListener);

        this.mouseLeaveViewListener = () => {
            let isRegistered = !!this.getParentItemView() || PageItemType.get().equals(this.getType());
            if (ItemView.debug) {
                console.log('ItemView[' + this.toString() + '].mouseLeaveViewListener registered: ' + isRegistered);
            }
            if (!isRegistered) {
                // the component has not been registered yet
                return;
            }

            if (!this.isDragging()) {
                this.resetCursor();
                this.unhighlight();
            }
        };
        this.onMouseLeaveView(this.mouseLeaveViewListener);
        /*
        this.pageItemViewAddedListener = (event) => {
            if (this.isSelected()) {
                this.deselect();
            }
        };
        pageView.onItemViewAdded(this.pageItemViewAddedListener);

        this.onRemoved(() => {
            pageView.unItemViewAdded(this.pageItemViewAddedListener);
        });
         */
    }

    protected isDragging(): boolean {
        throw 'Should be overridden, typically DragAndDrop.get().isDragging()';
    }

    protected unbindMouseListeners() {
        this.unMouseEnter(this.mouseEnterListener);
        this.unMouseLeave(this.mouseLeaveListener);
        this.unClicked(this.mouseClickedListener);
        this.unTouchStart(this.mouseClickedListener);
        this.unContextMenu(this.contextMenuListener);

        api.ui.responsive.ResponsiveManager.unAvailableSizeChanged(this);
        Shader.get().unClicked(this.shaderClickedListener);
        this.unMouseOverView(this.mouseOverViewListener);
        this.unMouseLeaveView(this.mouseLeaveViewListener);
    }

    highlight() {
        if (PageViewController.get().isHighlightingDisabled() || this.isViewInsideSelectedContainer()) {
            return;
        }
        Highlighter.get().highlightItemView(this);
        if (this.isSelected()) {
            // Remove selected hilighter to see the hover hilight
            // this.unhighlightSelected();
        }
    }

    unhighlight() {
        Highlighter.get().hide();
        if (this.isSelected()) {
            // Restore selected highlight after leaving
            // this.highlightSelected();
        }
    }

    highlightSelected() {
        if (PageViewController.get().isHighlightingDisabled()) {
            return;
        }

        SelectedHighlighter.get().highlightItemView(this);
    }

    unhighlightSelected() {
        SelectedHighlighter.get().unselect();
    }

    shade() {
        Shader.get().shade(this);
        this.shaded = true;
    }

    unshade() {
        Shader.get().hide();
        this.shaded = false;
    }

    showCursor() {
        let itemView = this.isViewInsideSelectedContainer() ? SelectedHighlighter.get().getSelectedView() : this;
        Cursor.get().displayItemViewCursor(itemView);
    }

    resetCursor() {
        Cursor.get().reset();
    }

    remove(): ItemView {
        if (ItemView.debug) {
            console.log('ItemView.remove [' + this.toString() + ']');
        }

        if (this.contextMenu) {
            this.contextMenu.remove();
        }
        if (this.loadMask) {
            this.loadMask.remove();
        }

        this.unhighlight();
        //this.unshade();

        this.unbindMouseListeners();

        super.remove();
        return this;
    }

    setDraggable(value: boolean) {
        // do not call super.setDraggable
        // tells jquery drag n drop to ignore this draggable
        this.toggleClass('not-draggable', !value);
    }

    scrollComponentIntoView(): void {
        let distance = this.calcDistanceToViewport();
        if (distance !== 0) {
            wemjq('html,body').animate({scrollTop: (distance > 0 ? '+=' : '-=') + Math.abs(distance)}, 200);
        }
    }

    /**
     * Process 'mouseenter' event to track when mouse moves between ItemView's.
     * ItemView notifies that mouse is over it if mouse moves from parent or child ItemView to this one.
     *
     * Method manages two cases:
     * 1. 'mouseenter' was triggered on parent ItemView and then it is triggered on its child ItemView.
     *    - parent has 'mouseOver' state set to 'true';
     *    - the ItemView calls parent.notifyMouseOut(), parent is still in 'mouseOver' state;
     *    - the ItemView receive 'mouseOver' state;
     *    - the ItemView notifies about mouseOver event;
     * 2. 'mouseenter' was triggered on child ItemView before it has been triggered on parent ItemView.
     *    (This occurs when child ItemView is adjacent to its parent's edge.)
     *    - direct parent hasn't received 'mouseOver' state yet;
     *    - look up for the first parent ItemView with 'mouseOver' state, it is ItemView the mouse came from;
     *    - the parent with 'mouseOver' state calls notifyMouseOut();
     *    - go to the previous parent, give it 'mouseOver' state, call notifyMouseOver() and notifyMouseOut() events,
     *      repeat until current ItemView reached;
     *    - set 'mouseOver' state to this ItemView;
     *    - notify about mouseOver event for this ItemView;
     *
     * @param event browser MouseEvent
     */
    handleMouseEnter(event: MouseEvent) {
        // If ItemView has 'mouseOver' state before it has received 'mouseenter' event,
        // then 'mouseenter' event has already occurred on child ItemView
        // and child has already called notifyMouseOver and notifyMouseOut for this ItemView.
        // No need to process this event.

        if (ItemView.debug) {
            console.group('mouse enter [' + this.getId() + ']');
        }

        if (this.mouseOver) {
            if (ItemView.debug) {
                console.log('mouseOver = true, returning.');
                console.groupEnd();
            }
            return;
        }

        this.manageParentsMouseOver();

        // Turn on 'mouseOver' state for this element and notify it entered.
        this.mouseOver = true;
        this.notifyMouseOverView();

        if (ItemView.debug) {
            console.groupEnd();
        }
    }

    private manageParentsMouseOver() {
        // Look up for the parent ItemView with 'mouseOver' state.
        // It is direct parent for case 1 or some parent up to the PageView for case 2.
        // Parents are stored to the stack to manage their state and triger events for them further.
        let parentsStack = [];
        for (let parent = this.parentItemView; parent; parent = parent.parentItemView) {
            parentsStack.push(parent);
            if (parent.mouseOver) {
                break;
            }
        }

        // Stack of parents elements contains single parent element for case 1 or
        // all parents with state 'mouseOver' set to 'false' and first one with 'mouseOver' state.
        // If parent has 'mouseOver' state, notify that mouse is moved out this parent.
        // If parent isn't in 'mouseOver' state, turn it on and notify the parent was entered and left.
        parentsStack.reverse().forEach((view: ItemView) => {
            if (view.mouseOver) {
                if (ItemView.debug) {
                    console.debug('parent.mouseOver = true, notifying mouse out [' + view.getId() + ']');
                }
                view.notifyMouseLeaveView();
            } else {
                view.mouseOver = true;
                if (ItemView.debug) {
                    console.debug('parent.mouseOver = false, setting to true [' + view.getId() + ']');
                }
                view.notifyMouseOverView();
                view.notifyMouseLeaveView();
            }
        });
    }

    /**
     * Process 'mouseleave' event to track when mouse moves between ItemView's.
     * ItemView notifies that mouse left it when mouse moves to its parent or child ItemView.
     *
     * 'mouseleave' event is always triggered on child element before it has been triggered on parent.
     *
     * @param event browser MouseEvent
     */
    handleMouseLeave(event: MouseEvent) {

        if (ItemView.debug) {
            console.group('mouse leave [' + this.getId() + ']');
        }

        // Turn off 'mouseOver' state and notify ItemVeiw was left.
        this.mouseOver = false;
        this.notifyMouseLeaveView();

        // Notify parent ItemView is entered.
        if (this.parentItemView) {
            const rect = this.getEl().getBoundingClientRect();

            if (event.clientX < rect.left || event.clientX > rect.right || // if mouse leave cur element
                event.clientY < rect.top || event.clientY > rect.bottom) {
                this.parentItemView.notifyMouseOverView();
            } else {
                this.parentItemView.notifyMouseLeaveView();
            }
        }

        if (ItemView.debug) {
            console.groupEnd();
        }
    }

    isEmpty(): boolean {
        throw new Error('Must be implemented by inheritors');
    }

    refreshEmptyState(): ItemView {
        this.toggleClass('empty', this.isEmpty());
        return this;
    }

    getCurrentContextMenu(): ItemViewContextMenu {
        return this.contextMenu;
    }

    handleClick(event: MouseEvent) {
        event.stopPropagation();

        if (PageViewController.get().isNextClickDisabled()) {
            PageViewController.get().setNextClickDisabled(false);
            return;
        }

        let rightClicked = event.which === 3 || event.ctrlKey;

        if (rightClicked) { // right click
            event.preventDefault();
        }

        const contextMenu = this.getCurrentContextMenu();
        const targetInContextMenu = !!contextMenu && contextMenu.getHTMLElement().contains(<Node>event.target);
        const placeholderIsTarget = event.target === this.placeholder.getHTMLElement();

        if (!this.isSelected() || rightClicked) {
            let selectedView = SelectedHighlighter.get().getSelectedView();
            let isViewInsideSelectedContainer = this.isViewInsideSelectedContainer();
            let clickPosition = !this.isEmpty() ? {x: event.pageX, y: event.pageY} : null;

            if (selectedView && isViewInsideSelectedContainer && !rightClicked) {
                selectedView.deselect();
            }

            // Allow selecting only component types if something is selected
            // The rest will only deselect current selection
            // Also allow selecting the same component again (i.e. to show context menu)
            if (!selectedView || selectedView === this || !isViewInsideSelectedContainer) {
                let menuPosition = rightClicked ? null : ItemViewContextMenuPosition.NONE;

                if (PageViewController.get().isTextEditMode()) { // if in text edit mode don't select on first click
                    PageViewController.get().setTextEditMode(false);
                    this.unhighlight();
                } else {
                    this.select(clickPosition, menuPosition, false, rightClicked);
                }

            } else if (isViewInsideSelectedContainer && rightClicked) {
                SelectedHighlighter.get().getSelectedView().showContextMenu(clickPosition);
            }
        } else if ((!this.isEmpty() && !targetInContextMenu) || placeholderIsTarget) {
            // Deselect component on left-click only if it's not empty and target is not in the context menu or the placeholder was clicked
            this.deselect();
        }
    }

    handleShaderClick(event: MouseEvent) {
        event.stopPropagation();

        if (PageViewController.get().isLocked()) {
            return;
        }
        if (this.isSelected()) {
            this.deselect();
        }
        if (!!event.type && (event.type === 'click' || event.type === 'contextmenu') && this.isEventOverItem(event)) {
            this.handleClick(event);
        }
    }

    protected isEventOverItem(event: MouseEvent): boolean {
        let offset = this.getEl().getDimensions();
        let x = event.pageX;
        let y = event.pageY;

        return x >= offset.left
               && x <= offset.left + offset.width
               && y >= offset.top
               && y <= offset.top + offset.height;
    }

    getItemViewIdProducer(): ItemViewIdProducer {
        return this.itemViewIdProducer;
    }

    getItemViewFactory(): ItemViewFactory {
        return this.itemViewFactory;
    }

    showContextMenu(clickPosition?: ClickPosition, menuPosition?: ItemViewContextMenuPosition) {
        if (PageViewController.get().isContextMenuDisabled()) {
            return;
        }

        if (menuPosition && ItemViewContextMenuPosition.NONE === menuPosition) {
            this.hideContextMenu();
            return;
        }

        const pageView = this.getPageView();
        const pageViewWidth = pageView.getEl().getWidthWithMargin();
        const pageViewHeight = pageView.getEl().getHeightWithMargin();

        const dimensions = this.getEl().getDimensions();
        let x;
        let y;

        if (!this.contextMenu) {
            this.contextMenu = new ItemViewContextMenu(this.contextMenuTitle, this.contextMenuActions);
            this.contextMenu.onOrientationChanged((orientation: ItemViewContextMenuOrientation) => {

                // move menu to the top edge of empty view in order to not overlay it
                if (orientation === ItemViewContextMenuOrientation.UP && this.isEmpty()) {
                    this.contextMenu.getEl().setMarginTop('-' + dimensions.height + 'px');
                } else {
                    this.contextMenu.getEl().setMarginTop('0px');
                }
            });

            pageView.registerInnerContextMenu(this.contextMenu);
            this.contextMenu.onRemoved(() => pageView.unregisterInnerContextMenu(this.contextMenu));
        }

        if (clickPosition) {
            // show menu at position
            x = clickPosition.x;
            y = clickPosition.y;
        } else {
            // show menu below if empty or on top
            x = dimensions.left + dimensions.width / 2;
            y = dimensions.top + (ItemViewContextMenuPosition.TOP === menuPosition ? 0 : dimensions.height);
        }

        this.contextMenu.showAt(x, y, {notClicked: !clickPosition, targetSize: {width: pageViewWidth, height: pageViewHeight}});
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.hide();
        }
    }

    private invalidateContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    private setItemId(value: ItemViewId) {
        this.getEl().setAttribute('data-' + ItemViewId.DATA_ATTRIBUTE, value.toString());
    }

    getItemId(): ItemViewId {
        let asString = this.getEl().getAttribute('data-' + ItemViewId.DATA_ATTRIBUTE);
        if (!asString) {
            return null;
        }
        return ItemViewId.fromString(asString);
    }

    static parseItemId(element: HTMLElement): ItemViewId {
        let attribute = element.getAttribute('data-' + ItemViewId.DATA_ATTRIBUTE);
        if (api.util.StringHelper.isEmpty(attribute)) {
            return null;
        }
        return ItemViewId.fromString(attribute);
    }

    getType(): ItemType {
        return this.type;
    }

    getParentItemView(): ItemView {
        return this.parentItemView;
    }

    setParentItemView(itemView: ItemView) {
        this.parentItemView = itemView;
    }

    isSelected(): boolean {
        return this.getEl().hasAttribute('data-live-edit-selected');
    }

    select(clickPosition?: ClickPosition, menuPosition?: ItemViewContextMenuPosition, newlyCreated?: boolean, rightClicked?: boolean) {
        Highlighter.get().hide();
        this.selectItem();
        this.showContextMenu(clickPosition, menuPosition);
        new ItemViewSelectedEvent({itemView: this, position: clickPosition, newlyCreated, rightClicked}).fire();
    }

    selectWithoutMenu(restoredSelection?: boolean) {
        this.selectItem();
        new ItemViewSelectedEvent({itemView: this, position: null, restoredSelection}).fire();
    }

    private selectItem() {
        let selectedView = SelectedHighlighter.get().getSelectedView();

        if (selectedView === this) {
            // view is already selected
            return;
        } else if (selectedView) {
            // deselect selected item view if any
            selectedView.deselect(true);
        }

        // selecting anything should exit the text edit mode
        // do this before highlighting as this might change text component dimensions
        if (PageViewController.get().isTextEditMode()) {
            PageViewController.get().setTextEditMode(false);
        }

        this.getEl().setData('live-edit-selected', 'true');

        //this.shade();
        this.showCursor();

        if (!PageViewController.get().isLocked()) {
            this.highlightSelected();
        }

        if (this.isEmpty()) {
            this.selectPlaceholder();
        }

    }

    deselect(silent?: boolean) {
        this.getEl().removeAttribute('data-live-edit-selected');

        this.hideContextMenu();
        this.unhighlightSelected();
        //this.unshade();

        if (this.isEmpty()) {
            this.deselectPlaceholder();
        }

        if (!silent) {
            new ItemViewDeselectedEvent(this).fire();
        }
    }

    isDraggableView(): boolean {
        return !this.getType().equals(RegionItemType.get()) && !this.getType().equals(PageItemType.get());
    }

    private selectPlaceholder() {
        if (this.placeholder) {
            this.placeholder.select();
        }
    }

    private deselectPlaceholder() {
        if (this.placeholder) {
            this.placeholder.deselect();
        }
    }

    showRenderingError(url: string, errorMessage?: string) {
        if (this.placeholder) {
            this.addClass('error');
            this.placeholder.showRenderingError(url, errorMessage);
        }
    }

    getName(): string {
        return i18n('live.view.itemview.noname');
    }

    getIconUrl(content: Content): string {
        return new api.content.util.ContentIconUrlResolver().setContent(content).resolve();
    }

    getIconClass() {
        return ItemViewIconClassResolver.resolveByView(this);
    }

    showLoadingSpinner() {
        if (!this.loadMask) {
            this.loadMask = new api.ui.mask.LoadMask(this);
            this.appendChild(this.loadMask);
        }
        this.loadMask.show();
    }

    hideLoadingSpinner() {
        if (this.loadMask) {
            this.loadMask.hide();
        }
    }

    getContextMenuActions(): api.ui.Action[] {
        return this.contextMenuActions;
    }

    toItemViewArray(): ItemView[] {

        return [this];
    }

    toString(): string {
        return this.getItemId().toNumber() + ' : ' + this.getType().getShortName();
    }

    getLiveEditModel(): LiveEditModel {
        return this.liveEditModel;
    }

    getViewer(): api.ui.Viewer<any> {
        return this.viewer;
    }

    static findParentItemViewAsHTMLElement(htmlElement: HTMLElement): HTMLElement {

        let parentHTMLElement = htmlElement.parentElement;
        let parseItemId = ItemView.parseItemId(parentHTMLElement);
        while (parseItemId == null) {
            parentHTMLElement = parentHTMLElement.parentElement;
            parseItemId = ItemView.parseItemId(parentHTMLElement);
        }

        return parentHTMLElement;
    }

    onMouseOverView(listener: () => void) {
        this.mouseOverViewListeners.push(listener);
    }

    unMouseOverView(listener: () => void) {
        this.mouseOverViewListeners = this.mouseOverViewListeners.filter((current) => (current !== listener));
    }

    private notifyMouseOverView() {
        if (ItemView.debug) {
            console.log('notifying mouse over [' + this.getId() + ']');
        }
        this.mouseOverViewListeners.forEach((listener: () => void) => listener());
    }

    onMouseLeaveView(listener: () => void) {
        this.mouseOutViewListeners.push(listener);
    }

    unMouseLeaveView(listener: () => void) {
        this.mouseOutViewListeners = this.mouseOutViewListeners.filter((current) => (current !== listener));
    }

    private notifyMouseLeaveView() {
        if (ItemView.debug) {
            console.log('notifying mouse out [' + this.getId() + ']');
        }
        this.mouseOutViewListeners.forEach((listener: () => void) => listener());
    }

    protected getContextMenuTitle(): ItemViewContextMenuTitle {
        return this.contextMenuTitle;
    }

    private calcDistanceToViewport(): number {
        let dimensions = this.getEl().getDimensions();
        let menuHeight = this.contextMenu && this.contextMenu.isVisible() ? this.contextMenu.getEl().getHeight() : dimensions.height;
        let scrollTop: number = this.getDocumentScrollTop();
        let padding = 10;

        let top = (dimensions.top - padding) - scrollTop;
        let bottom = (dimensions.top + menuHeight + padding) - (scrollTop + window.innerHeight);
        let tallerThanWindow = menuHeight > window.innerHeight;

        return top <= 0 ? top : (bottom > 0 && !tallerThanWindow) ? bottom : 0;
    }

    // http://stackoverflow.com/a/872537
    private getDocumentScrollTop() {
        if (typeof pageYOffset !== 'undefined') {
            //most browsers except IE before #9
            return pageYOffset;
        } else {
            //IE 'quirks' and doctype
            let doc = (document.documentElement.clientHeight) ? document.documentElement : document.body;
            return doc.scrollTop;
        }
    }

    protected addComponentView(componentView: ItemView, index?: number, newlyCreated: boolean = false) {
        throw new Error('Must be implemented by inheritors');
    }

    protected getNewItemIndex(): number {
        throw new Error('Must be implemented by inheritors');
    }

    public createView(type: ItemType, config?: CreateItemViewConfig<ItemView, Component>): ItemView {
        if (!config) {
            const regionView = this.getRegionView();
            let newComponent = this.createComponent(type.toComponentType());
            config = new CreateItemViewConfig<ItemView, Component>()
                .setParentView(regionView)
                .setParentElement(regionView)
                .setData(newComponent);
        }
        return this.itemViewFactory.createView(type, config);
    }

    public createComponent(componentType: ComponentType): Component {

        let builder = this.createBuilder(componentType).setName(componentType.getDefaultName());

        if (api.ObjectHelper.iFrameSafeInstanceOf(builder, DescriptorBasedComponentBuilder)) {
            let descriptorBuilder = <DescriptorBasedComponentBuilder<DescriptorBasedComponent>> builder;
            descriptorBuilder.setConfig(new PropertyTree());
        }

        return builder.build();
    }

    private createBuilder(componentType: ComponentType): ComponentBuilder<Component> {
        if (ObjectHelper.iFrameSafeInstanceOf(componentType, FragmentComponentType)) {
            return new FragmentComponentBuilder();
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentType, ImageComponentType)) {
            return new ImageComponentBuilder();
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentType, LayoutComponentType)) {
            return new LayoutComponentBuilder();
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentType, PartComponentType)) {
            return new PartComponentBuilder();
        } else if (ObjectHelper.iFrameSafeInstanceOf(componentType, TextComponentType)) {
            return new TextComponentBuilder();
        } else {
            return new ComponentBuilder();
        }
    }

    private getInsertActions(liveEditModel: LiveEditModel): api.ui.Action[] {
        let isFragmentContent = liveEditModel.getContent().getType().isFragment();

        let actions = [this.createInsertSubAction('image', ImageItemType.get()),
            this.createInsertSubAction('part', PartItemType.get())];

        let isInRegion = this.getRegionView().getType().equals(RegionItemType.get());
        if (isInRegion && !this.getRegionView().hasParentLayoutComponentView() && !isFragmentContent) {
            actions.push(this.createInsertSubAction('layout', LayoutItemType.get()));
        }
        actions.push(this.createInsertSubAction('text', TextItemType.get()));
        actions.push(this.createInsertSubAction('fragment', FragmentItemType.get()));

        return actions;
    }

    hasParentLayoutComponentView(): boolean {
        const parentView = this.getParentItemView();
        return !!parentView && parentView.getType().equals(LayoutItemType.get());
    }

    protected getRegionView(): ItemView {
        return this.getParentItemView();
    }

    getPageView(): PageView {
        let itemView: ItemView = this;
        while (!PageItemType.get().equals(itemView.getType())) {
            itemView = itemView.getParentItemView();
        }
        return <PageView>itemView;
    }

    protected createInsertAction(): api.ui.Action {
        return new api.ui.Action(i18n('action.insert')).setChildActions(this.getInsertActions(this.liveEditModel)).setVisible(false);
    }

    protected createSelectParentAction(): api.ui.Action {
        let action = new api.ui.Action(i18n('live.view.selectparent'));

        action.setSortOrder(0);
        action.onExecuted(() => {
            let parentView: ItemView = this.getParentItemView();
            if (parentView) {
                this.deselect();
                parentView.select(null, ItemViewContextMenuPosition.TOP, false, true);
                parentView.scrollComponentIntoView();
            }
        });

        return action;
    }

    private createInsertSubAction(label: string, componentItemType: ItemType): api.ui.Action {
        let action = new api.ui.Action(i18n('live.view.insert.' + label)).onExecuted(() => {
            let componentView = this.createView(componentItemType);
            this.addComponentView(componentView, this.getNewItemIndex(), true);
        });

        action.setVisible(false).setIconClass(api.StyleHelper.getCommonIconCls(label));

        return action;
    }

    isChildOfItemView(itemView: ItemView) {
        if (this === itemView) {
            return false;
        }
        let parentItemView = this.getParentItemView();
        let result = false;
        while (!!parentItemView && !result) {
            result = (parentItemView === itemView);
            parentItemView = parentItemView.getParentItemView();
        }

        return result;
    }

    isContainer(): boolean {
        return this.isDraggableView() || this.getType().equals(LayoutItemType.get());
    }

    private isViewInsideSelectedContainer() {
        return SelectedHighlighter.get().isViewInsideSelectedContainer(this);
    }
}
