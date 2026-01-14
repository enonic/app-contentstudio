import * as $ from 'jquery';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ItemViewIdProducer} from './ItemViewIdProducer';
import {ItemView, ItemViewBuilder} from './ItemView';
import {RegionView, RegionViewBuilder} from './RegionView';
import {ComponentView} from './ComponentView';
import {ItemViewAddedEvent} from './ItemViewAddedEvent';
import {ItemViewRemovedEvent} from './ItemViewRemovedEvent';
import {ItemViewContextMenu} from './ItemViewContextMenu';
import {PageItemType} from './PageItemType';
import {PageViewContextMenuTitle} from './PageViewContextMenuTitle';
import {PagePlaceholder} from './PagePlaceholder';
import {ItemViewSelectedEventConfig, SelectComponentEvent} from './event/outgoing/navigation/SelectComponentEvent';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {TextItemType} from './text/TextItemType';
import {TextComponentView} from './text/TextComponentView';
import {PageLockedEvent} from './event/outgoing/manipulation/PageLockedEvent';
import {PageUnlockedEvent} from './event/outgoing/manipulation/PageUnlockedEvent';
import {Highlighter} from './Highlighter';
import {SelectedHighlighter} from './SelectedHighlighter';
import {ClickPosition} from './ClickPosition';
import {ItemViewId} from './ItemViewId';
import {ItemType} from './ItemType';
import {LayoutComponentView} from './layout/LayoutComponentView';
import {RegionItemType} from './RegionItemType';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {DragAndDrop} from './DragAndDrop';
import {ItemViewFactory} from './ItemViewFactory';
import {PageViewController} from './PageViewController';
import {LiveEditPageViewReadyEvent} from './LiveEditPageViewReadyEvent';
import {ModalDialog} from '../app/inputtype/ui/text/dialog/ModalDialog';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {SaveAsTemplateEvent} from './SaveAsTemplateEvent';
import {LiveEditParams} from './LiveEditParams';
import {PageResetEvent} from './event/outgoing/manipulation/PageResetEvent';
import {ComponentInspectedEvent} from './ComponentInspectedEvent';

export class PageViewBuilder {

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    liveEditParams: LiveEditParams;

    element: Body;

    setItemViewIdProducer(value: ItemViewIdProducer): PageViewBuilder {
        this.itemViewIdProducer = value;
        return this;
    }

    setItemViewFactory(value: ItemViewFactory): PageViewBuilder {
        this.itemViewFactory = value;
        return this;
    }

    setElement(value: Body): PageViewBuilder {
        this.element = value;
        return this;
    }

    setLiveEditParams(value: LiveEditParams): PageViewBuilder {
        this.liveEditParams = value;
        return this;
    }

    build(): PageView {
        return new PageView(this);
    }
}

export class PageView
    extends ItemView {

    private regionViews: RegionView[];

    private fragmentView: ComponentView;

    private viewsById: Record<number, ItemView>;

    private resetAction: Action;

    private itemViewAddedListener: (event: ItemViewAddedEvent) => void;

    private itemViewRemovedListener: (event: ItemViewRemovedEvent) => void;

    private scrolledListener: (event: WheelEvent) => void;

    public static debug: boolean;

    private lockedContextMenu: ItemViewContextMenu;

    private closeTextEditModeButton: Element;

    private editorToolbar: DivEl;

    private modifyPermissions: boolean;

    constructor(builder: PageViewBuilder) {
        super(new ItemViewBuilder()
            .setLiveEditParams(builder.liveEditParams)
            .setItemViewIdProducer(builder.itemViewIdProducer)
            .setItemViewFactory(builder.itemViewFactory)
            .setType(PageItemType.get())
            .setElement(builder.element)
            .setContextMenuTitle(new PageViewContextMenuTitle(builder.liveEditParams.displayName)));

        this.setPlaceholder(new PagePlaceholder(this));
        this.addPageContextMenuActions();
        this.registerPageViewController();

        this.regionViews = [];
        this.viewsById = {};
        this.modifyPermissions = builder.liveEditParams.modifyPermissions;

        this.addClassEx('page-view');

        this.initListeners();

        this.parseItemViews();

        this.closeTextEditModeButton = this.createCloseTextEditModeEl();

        this.appendChild(this.closeTextEditModeButton);

        if (builder.liveEditParams.locked ||
            (ObjectHelper.isDefined(builder.liveEditParams.modifyPermissions) && !builder.liveEditParams.modifyPermissions)) {
            this.setLocked(true);
        }
    }

    private registerPageViewController() {
        const ctrl = PageViewController.get();
        const textEditModeListener = this.setTextEditMode.bind(this);

        ctrl.onTextEditModeChanged(textEditModeListener);

        this.onRemoved(event => {
            ctrl.unTextEditModeChanged(textEditModeListener);
        });
    }

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    public createDraggable(item: JQuery) {
        return DragAndDrop.get().createDraggable(item);
    }

    public destroyDraggable(item: JQuery) {
        return DragAndDrop.get().destroyDraggable(item);
    }

    public setModifyPermissions(modifyPermissions: boolean): void {
        this.modifyPermissions = modifyPermissions;

        if (!modifyPermissions) {
            this.setLocked(true);
        }
    }

    private addPageContextMenuActions() {
        const actions: Action[] = [];

        actions.push(new Action(i18n('live.view.inspect')).onExecuted(() => {
            new ComponentInspectedEvent(this.getPath()).fire();
        }));

        this.resetAction = new Action(i18n('live.view.reset')).onExecuted(() => {
            if (PageView.debug) {
                console.log('PageView.reset');
            }
            new PageResetEvent().fire();
        });

        actions.push(this.resetAction);

        if (!this.getLiveEditParams().isResetEnabled) {
            this.resetAction.setEnabled(false);
        }

        if (!this.liveEditParams.isPageTemplate) {
            actions.push(new Action(i18n('action.saveAsTemplate')).onExecuted(() => {
                new SaveAsTemplateEvent().fire();
            }));
        }

        this.addContextMenuActions(actions);
    }

    private initListeners() {

        this.scrolledListener = (event: WheelEvent) => {
            this.toggleStickyToolbar();
        };

        this.itemViewAddedListener = (event: ItemViewAddedEvent) => {
            // register the view and all its child views (i.e layout with regions)
            const itemView = event.getView();
            itemView.toItemViewArray().forEach((value: ItemView) => {
                this.registerItemView(value);
            });

            // adding anything except text should exit the text edit mode
            if (itemView.getType().equals(TextItemType.get())) {
                if (event.isNewlyCreated()) {
                    new SelectComponentEvent({path: itemView.getPath(), position: null, rightClicked: true}).fire();

                    if (!PageViewController.get().isTextEditMode()) {
                        PageViewController.get().setTextEditMode(true);
                    }

                    itemView.giveFocus();
                } else {
                    //
                }
            } else {
                if (PageViewController.get().isTextEditMode()) {
                    PageViewController.get().setTextEditMode(false);
                }
                if (event.isNewlyCreated()) {
                    const config = {path: itemView.getPath(), position: null, newlyCreated: true} as ItemViewSelectedEventConfig;
                    itemView.select(config, ItemViewContextMenuPosition.NONE);
                    itemView.focusPlaceholderIfEmpty();
                }
            }
        };
        this.itemViewRemovedListener = (event: ItemViewRemovedEvent) => {
            // register the view and all its child views (i.e layout with regions)
            event.getView().toItemViewArray().forEach((itemView: ItemView) => {
                this.unregisterItemView(itemView);
            });
        };

        this.listenToMouseEvents();

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (PageViewController.get().isTextEditMode()) {
                this.updateVerticalSpaceForEditorToolbar();
            }
        });

        LiveEditPageViewReadyEvent.on(() => {
            this.appendContainerForTextToolbar();
        });
    }

    private createCloseTextEditModeEl(): Element {
        const closeButton: ButtonEl = new ButtonEl();
        closeButton.addClass('close-edit-mode-button icon-close');

        closeButton.onClicked((event: MouseEvent) => {
            PageViewController.get().setTextEditMode(false);
            event.stopPropagation();
            return false;
        });

        return closeButton;
    }

    private isPageScrolled() {
        return this.getEl().getScrollTop() > 0 || this.getEl().getParent().getScrollTop() > 0;
    }

    private toggleStickyToolbar() {
        if (!this.isPageScrolled()) {
            this.editorToolbar.removeClass('sticky-toolbar');
        } else if (!this.editorToolbar.hasClass('sticky-toolbar')) {
            this.editorToolbar.addClass('sticky-toolbar');
        }
    }

    appendContainerForTextToolbar() {
        if (!this.hasToolbarContainer()) {
            this.editorToolbar = new DivEl('cke-toolbar-container').setId('cke-toolbar-container').setContentEditable(true);
            this.editorToolbar.hide();
            this.appendChild(this.editorToolbar);
            this.addClass('has-toolbar-container');
            PageViewController.get().setEditorToolbar(this.editorToolbar);
        }
    }

    private hasToolbarContainer(): boolean {
        return this.hasClass('has-toolbar-container');
    }

    highlightSelected() {
        if (!PageViewController.get().isTextEditMode() && !this.isLocked() && !this.isDragging()) {
            super.highlightSelected();
        }
    }

    showCursor() {
        if (!PageViewController.get().isTextEditMode() && !this.isLocked()) {
            super.showCursor();
        }
    }

    shade() {
        if (!this.isEmpty()) {
            super.shade();
        }
    }

    unshade() {
        if (!this.isLocked()) {
            super.unshade();
        }
    }

    private listenToMouseEvents() {
        this.onMouseOverView(() => {
            if (this.isDragging() && this.lockedContextMenu) {
                if (this.lockedContextMenu.isVisible()) {
                    this.lockedContextMenu.hide();
                }
            }
        });
    }

    getPath(): ComponentPath {
        return ComponentPath.root();
    }

    select(config?: ItemViewSelectedEventConfig, menuPosition?: ItemViewContextMenuPosition) {
        if (config) {
            config.rightClicked = false;
        }

        super.select(config, menuPosition);
    }

    showContextMenu(clickPosition?: ClickPosition, menuPosition?: ItemViewContextMenuPosition) {
        if (!this.isLocked()) {
            super.showContextMenu(clickPosition, menuPosition);
        }
    }

    createLockedContextMenu() {
        return new ItemViewContextMenu(this.getContextMenuTitle(), this.getLockedMenuActions());
    }

    getLockedMenuActions(): Action[] {
        const unlockAction = new Action(i18n('action.page.settings'));

        unlockAction.onExecuted(() => {
            new ComponentInspectedEvent(ComponentPath.root()).fire()
        });

        return [unlockAction];
    }

    selectLocked(position: ClickPosition) {
        this.setLockVisible(true);
        this.lockedContextMenu.showAt(position.x, position.y);
    }

    deselectLocked() {
        this.setLockVisible(false);
        this.lockedContextMenu.hide();
    }

    handleShaderClick(event: MouseEvent) {
        if (this.isLocked() && this.modifyPermissions) {
            if (!this.lockedContextMenu) {
                this.lockedContextMenu = this.createLockedContextMenu();
            }
            if (this.lockedContextMenu.isVisible()) {
                this.deselectLocked();
            } else {
                this.selectLocked({x: event.pageX, y: event.pageY});
            }
        } else if (!this.isSelected() || event.which === 3) {
            this.handleClick(event);
        } else {
            this.deselect();
        }
    }

    handleClick(event: MouseEvent) {
        event.stopPropagation();

        if (PageViewController.get().isTextEditMode()) {
            if (!this.isTextEditorToolbarClicked(event) && !this.isTextEditorDialogClicked(event)) {
                PageViewController.get().setTextEditMode(false);
            }
        } else {
            super.handleClick(event);
        }
    }

    private isTextEditorToolbarClicked(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const prefix = 'cke';
        if (!!target) {
            const parent = target.parentElement;
            return (target.id.indexOf(prefix) >= 0 || target.className.indexOf(prefix) >= 0 ||
                    parent.id.indexOf(prefix) >= 0 || parent.className.indexOf(prefix) >= 0);
        }
        return false;
    }

    private isTextEditorDialogClicked(event: MouseEvent) {
        let target = event.target as HTMLElement;
        while (target) {
            if (target.classList.contains(ModalDialog.CLASS_NAME)) {
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }

    hideContextMenu() {
        this.lockedContextMenu?.hide();

        return super.hideContextMenu();
    }

    isLocked() {
        return this.hasClass('locked');
    }

    setLockVisible(visible: boolean) {
        this.toggleClass('lock-visible', visible);
    }

    setLocked(locked: boolean): void {
        if (locked === this.isLocked()) {
            return;
        }

        this.toggleClass('locked', locked);

        this.hideContextMenu();

        if (locked) {
            this.shade();

            new PageLockedEvent().fire();
        } else {
            this.unshade();

            new PageUnlockedEvent().fire();
            new ComponentInspectedEvent(this.getPath()).fire();
        }

        PageViewController.get().setLocked(locked);
    }

    private setTextEditMode(editMode: boolean): void {
        this.editorToolbar?.setVisible(editMode);
        PageViewController.get().setHighlightingDisabled(editMode);
        this.toggleClass('text-edit-mode', editMode);
        this.closeTextEditModeButton.toggleClass('active', editMode);

        if (editMode) {
            this.addVerticalSpaceForEditorToolbar();
            this.onScrolled(this.scrolledListener);
        } else {
            this.removeVerticalSpaceForEditorToolbar();
            this.unScrolled(this.scrolledListener);

            Highlighter.get().updateLastHighlightedItemView();
            SelectedHighlighter.get().updateLastHighlightedItemView();
        }
    }

    getPageView(): PageView {
        return this;
    }

    getPageViewController(): PageViewController {
        return PageViewController.get();
    }

    getCurrentContextMenu(): ItemViewContextMenu {
        return this.lockedContextMenu || super.getCurrentContextMenu();
    }

    private updateVerticalSpaceForEditorToolbar() {
        const result = this.getEditorToolbarWidth();

        if (!!result) {
            this.getEl().setTopPx(this.getEditorToolbarWidth()).setLeft('0');
        } else {
            this.waitUntilEditorToolbarShown();
        }

    }

    private waitUntilEditorToolbarShown() {
        let intervalId;
        let toolbarHeight;
        let attempts = 0;

        intervalId = setInterval(() => {
            attempts++;
            toolbarHeight = this.getEditorToolbarWidth();
            if (!!toolbarHeight) {
                this.getEl().setTop(toolbarHeight + 'px');
                clearInterval(intervalId);
            } else if (attempts > 10) {
                clearInterval(intervalId);
            }
        }, 50);

    }

    private addVerticalSpaceForEditorToolbar() {
        this.getEl()
            .setPosition('fixed')
            .setHeight('calc(100% - ' + this.getEditorToolbarWidth() + 'px)')
            .setMinHeight('unset');
        this.getEl().getHTMLElement().style.overflow = 'auto';
        this.updateVerticalSpaceForEditorToolbar();
        this.toggleStickyToolbar();
    }

    private removeVerticalSpaceForEditorToolbar() {
        this.getEl()
            .setPosition('')
            .setTop('')
            .setLeft('')
            .setHeight('')
            .setMinHeight('');

        this.getEl().getHTMLElement().style.overflow = '';
    }

    private getEditorToolbarWidth(): number {
        return $('.cke-toolbar-container .cke_reset_all:not([style*=\'display: none\']) .cke_top').outerHeight();
    }

    hasTargetWithinTextComponent(target: HTMLElement) {
        const textItemViews = this.getItemViewsByType(TextItemType.get());
        let result: boolean = false;

        let textView: TextComponentView;
        textItemViews.forEach((view: ItemView) => {
            textView = view as TextComponentView;
            if (textView.getEl().contains(target)) {
                result = true;
                return;
            }
        });

        return result;
    }

    isEmpty(): boolean {
        return this.getLiveEditParams().isPageEmpty;
    }

    getName(): string {
        return this.getLiveEditParams().pageName;
    }

    getIconClass(): string {
        return this.getLiveEditParams().pageIconClass;
    }

    getParentItemView(): ItemView {
        return null;
    }

    setParentItemView(itemView: ItemView) {
        throw new Error(i18n('live.view.page.error.noparent'));
    }

    private registerRegionView(regionView: RegionView) {
        this.regionViews.push(regionView);

        regionView.onItemViewAdded(this.itemViewAddedListener);
        regionView.onItemViewRemoved(this.itemViewRemovedListener);
    }

    unregisterRegionView(regionView: RegionView) {
        const index = this.regionViews.indexOf(regionView);
        if (index > -1) {
            this.regionViews.splice(index, 1);

            regionView.unItemViewAdded(this.itemViewAddedListener);
            regionView.unItemViewRemoved(this.itemViewRemovedListener);
        }
    }

    getRegions(): RegionView[] {
        return this.regionViews;
    }

    toItemViewArray(): ItemView[] {

        let array: ItemView[] = [];
        array.push(this);
        this.regionViews.forEach((regionView: RegionView) => {
            let itemViews = regionView.toItemViewArray();
            array = array.concat(itemViews);
        });
        return array;
    }

    hasSelectedView(): boolean {
        return !!SelectedHighlighter.get().getSelectedView();
    }

    getSelectedView(): ItemView {
        for (let id in this.viewsById) {
            if (this.viewsById.hasOwnProperty(id) && this.viewsById[id].isSelected()) {
                return this.viewsById[id];
            }
        }
        return null;
    }

    getItemViewById(id: ItemViewId): ItemView {
        assertNotNull(id, i18n('live.view.itemview.error.idisnull'));
        return this.viewsById[id.toNumber()];
    }

    getItemViewsByType(type: ItemType): ItemView[] {
        const views: ItemView[] = [];
        for (let key in this.viewsById) {
            if (this.viewsById.hasOwnProperty(key)) {
                const view = this.viewsById[key];
                if (type.equals(view.getType())) {
                    views.push(view);
                }
            }
        }
        return views;
    }

    getItemViewByElement(element: HTMLElement): ItemView {
        assertNotNull(element, i18n('live.view.itemview.error.elementisnull'));

        const itemId = ItemView.parseItemId(element);
        if (!itemId) {
            return null;
        }

        const itemView = this.getItemViewById(itemId);
        assertNotNull(itemView, i18n('live.view.itemview.error.notfound', itemId.toString()));

        return itemView;
    }

    getRegionViewByElement(element: HTMLElement): RegionView {

        const itemView = this.getItemViewByElement(element);

        if (ObjectHelper.iFrameSafeInstanceOf(itemView, RegionView)) {
            return itemView as RegionView;
        }
        return null;
    }

    getComponentViewByElement(element: HTMLElement): ComponentView {

        const itemView = this.getItemViewByElement(element);

        if (ObjectHelper.iFrameSafeInstanceOf(itemView, ComponentView)) {
            return itemView as ComponentView;
        }

        return null;
    }

    getComponentViewByPath(path: ComponentPath): ItemView {
        if (this.fragmentView) {
            return this.getFragmentComponentViewByPath(path);
        }

        return this.getPageComponentViewByPath(path);
    }

    private getFragmentComponentViewByPath(path: ComponentPath): ItemView {
        if (path.isRoot()) {
            return this.fragmentView;
        }

        if (this.fragmentView instanceof LayoutComponentView) {
            return this.fragmentView.getComponentViewByPath(path);
        }

        return null;
    }

    private getPageComponentViewByPath(path: ComponentPath): ItemView {
        if (path.isRoot()) {
            return this;
        }

        let result: ItemView = null;

        this.regionViews.some((regionView: RegionView) => {
            if (regionView.getPath().equals(path)) {
                result = regionView;
            } else {
                result = regionView.getComponentViewByPath(path);
            }

            return !!result;
        });

        return result;
    }

    private registerItemView(view: ItemView) {
        if (PageView.debug) {
            console.debug('PageView.registerItemView: ' + view.toString());
        }

        this.viewsById[view.getItemId().toNumber()] = view;
    }

    private unregisterItemView(view: ItemView) {
        if (PageView.debug) {
            console.debug('PageView.unregisterItemView: ' + view.toString());
        }

        delete this.viewsById[view.getItemId().toNumber()];
    }

    private parseItemViews() {
        // unregister existing views
        for (let itemView in this.viewsById) {
            if (this.viewsById.hasOwnProperty(itemView)) {
                this.unregisterItemView(this.viewsById[itemView]);
            }
        }

        // unregister existing regions
        this.regionViews.forEach((regionView: RegionView) => {
            this.unregisterRegionView(regionView);
        });

        this.regionViews = [];
        this.viewsById = {};

        if (this.getLiveEditParams().isFragment) {
            this.insertChild(new DivEl(), 0);
            this.doParseFragmentItemViews();
        } else {
            this.doParseItemViews();
            // register everything that was parsed
            this.toItemViewArray().forEach((value: ItemView) => {
                this.registerItemView(value);
            });
        }

    }

    private doParseItemViews(parentElement?: Element) {
        const children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            const itemType = ItemType.fromElement(childElement);
            let regionView;

            if (itemType && RegionItemType.get().equals(itemType)) {
                regionView =
                    new RegionView(new RegionViewBuilder()
                        .setParentView(this)
                        .setName(RegionItemType.getRegionName(childElement))
                        .setElement(childElement));

                this.registerRegionView(regionView);
            } else {
                this.doParseItemViews(childElement);
            }
        });
    }

    private doParseFragmentItemViews(parentElement?: Element) {
        const children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            const itemType = ItemType.fromElement(childElement);

            if (itemType?.isComponentType()) {
                const itemViewConfig = new CreateItemViewConfig<PageView>()
                    .setParentView(this)
                    .setElement(childElement)
                    .setLiveEditParams(this.liveEditParams)
                    .setParentElement(parentElement ? parentElement : this);

                const componentView: ComponentView = this.createView(itemType, itemViewConfig) as ComponentView;
                this.registerFragmentComponentView(componentView);
            } else {
                this.doParseFragmentItemViews(childElement);
            }
        });
    }

    unregisterFragmentComponentView(componentView: ComponentView) {
        componentView.unItemViewAdded(this.itemViewAddedListener);
        componentView.unItemViewRemoved(this.itemViewRemovedListener);

        componentView.toItemViewArray().forEach((itemView: ItemView) => {
            this.unregisterItemView(itemView);
        });
    }

    registerFragmentComponentView(componentView: ComponentView) {
        componentView.onItemViewAdded(this.itemViewAddedListener);
        componentView.onItemViewRemoved(this.itemViewRemovedListener);

        componentView.toItemViewArray().forEach((value: ItemView) => {
            this.registerItemView(value);
        });

        if (componentView instanceof LayoutComponentView) {
            componentView.getRegions().forEach((regionView) => {
                this.registerRegionView(regionView);
            });
        }

        this.fragmentView = componentView;
    }

    isRendered(): boolean {
        return true;
    }
}
