import * as $ from 'jquery';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {LiveEditModel} from './LiveEditModel';
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
import {PageInspectedEvent} from './PageInspectedEvent';
import {ItemViewSelectedEvent} from './ItemViewSelectedEvent';
import {ItemViewContextMenuPosition} from './ItemViewContextMenuPosition';
import {TextItemType} from './text/TextItemType';
import {TextComponentView} from './text/TextComponentView';
import {Shader} from './Shader';
import {PageSelectedEvent} from './PageSelectedEvent';
import {ItemViewDeselectedEvent} from './ItemViewDeselectedEvent';
import {PageLockedEvent} from './PageLockedEvent';
import {PageUnlockedEvent} from './PageUnlockedEvent';
import {PageTextModeStartedEvent} from './PageTextModeStartedEvent';
import {Highlighter} from './Highlighter';
import {SelectedHighlighter} from './SelectedHighlighter';
import {ClickPosition} from './ClickPosition';
import {ItemViewId} from './ItemViewId';
import {ItemType} from './ItemType';
import {LayoutComponentView} from './layout/LayoutComponentView';
import {RegionItemType} from './RegionItemType';
import {CreateItemViewConfig} from './CreateItemViewConfig';
import {PageModel} from './PageModel';
import {DragAndDrop} from './DragAndDrop';
import {ItemViewFactory} from './ItemViewFactory';
import {PageViewController} from './PageViewController';
import {LiveEditPageViewReadyEvent} from './LiveEditPageViewReadyEvent';
import {PageModeChangedEvent} from './PageModeChangedEvent';
import {ModalDialog} from '../app/inputtype/ui/text/dialog/ModalDialog';
import {Content} from '../app/content/Content';
import {Component} from '../app/page/region/Component';
import {PageMode, PageTemplateDisplayName} from '../app/page/PageMode';
import {RegionPath} from '../app/page/region/RegionPath';
import {ComponentPath} from '../app/page/region/ComponentPath';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {ContentSummaryViewer} from '../app/content/ContentSummaryViewer';

export class PageViewBuilder {

    liveEditModel: LiveEditModel;

    itemViewIdProducer: ItemViewIdProducer;

    itemViewFactory: ItemViewFactory;

    element: Body;

    modifyPermissions: boolean = false;

    setLiveEditModel(value: LiveEditModel): PageViewBuilder {
        this.liveEditModel = value;
        return this;
    }

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

    setModifyPermissions(modifyPermissions: boolean): PageViewBuilder {
        this.modifyPermissions = modifyPermissions;
        return this;
    }

    build(): PageView {
        return new PageView(this);
    }
}

export class PageView
    extends ItemView {

    private pageModel: PageModel;

    private regionViews: RegionView[];

    private fragmentView: ComponentView<Component>;

    private viewsById: { [s: number]: ItemView; };

    private ignorePropertyChanges: boolean;

    private itemViewAddedListeners: { (event: ItemViewAddedEvent): void }[];

    private itemViewRemovedListeners: { (event: ItemViewRemovedEvent): void }[];

    private pageLockedListeners: { (locked: boolean): void }[];

    private resetAction: Action;

    private itemViewAddedListener: (event: ItemViewAddedEvent) => void;

    private itemViewRemovedListener: (event: ItemViewRemovedEvent) => void;

    private scrolledListener: (event: WheelEvent) => void;

    public static debug: boolean;

    private propertyChangedListener: (event: PropertyChangedEvent) => void;

    private pageModeChangedListener: (event: PageModeChangedEvent) => void;

    private customizeChangedListener: (value: boolean) => void;

    private lockedContextMenu: ItemViewContextMenu;

    private closeTextEditModeButton: Element;

    private editorToolbar: DivEl;

    private isRenderable: boolean;

    private modifyPermissions: boolean;

    constructor(builder: PageViewBuilder) {

        super(new ItemViewBuilder()
            .setLiveEditModel(builder.liveEditModel)
            .setItemViewIdProducer(builder.itemViewIdProducer)
            .setItemViewFactory(builder.itemViewFactory)
            .setViewer(new ContentSummaryViewer())
            .setType(PageItemType.get())
            .setElement(builder.element)
            .setContextMenuTitle(new PageViewContextMenuTitle(builder.liveEditModel.getContent())));

        this.modifyPermissions = builder.modifyPermissions;

        this.setPlaceholder(new PagePlaceholder(this));

        this.addPageContextMenuActions();

        this.pageModel = builder.liveEditModel.getPageModel();

        this.registerPageModel();

        this.registerPageViewController();

        this.regionViews = [];
        this.viewsById = {};
        this.itemViewAddedListeners = [];
        this.itemViewRemovedListeners = [];
        this.pageLockedListeners = [];
        this.ignorePropertyChanges = false;

        this.addClassEx('page-view');

        this.initListeners();

        this.parseItemViews();

        this.closeTextEditModeButton = this.createCloseTextEditModeEl();

        this.appendChild(this.closeTextEditModeButton);

        // lock page by default for every content that has not been modified except for page template
        const isCustomized = this.liveEditModel.getPageModel().isCustomized();
        const isFragment = !!this.fragmentView;
        const lockable = !this.pageModel.isPageTemplate() && !isCustomized && !isFragment;
        if (lockable || !this.modifyPermissions) {
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

    private registerPageModel() {
        if (PageView.debug) {
            console.log('PageView.registerPageModel', this.pageModel);
        }
        this.propertyChangedListener = (event: PropertyChangedEvent) => {
            // don't parse on regions change during reset, because it'll be done when page is loaded later
            if (event.getPropertyName() === PageModel.PROPERTY_REGIONS && !this.ignorePropertyChanges) {
                this.parseItemViews();
            }
            this.refreshEmptyState();
        };
        this.pageModel.onPropertyChanged(this.propertyChangedListener);

        this.pageModeChangedListener = (event: PageModeChangedEvent) => {
            const resetEnabled = event.getNewMode() !== PageMode.AUTOMATIC && event.getNewMode() !== PageMode.NO_CONTROLLER;
            if (PageView.debug) {
                console.log('PageView.pageModeChangedListener setting reset enabled', resetEnabled);
            }
            this.resetAction.setEnabled(resetEnabled);
        };
        this.pageModel.onPageModeChanged(this.pageModeChangedListener);

        this.customizeChangedListener = ((value) => {
            if (this.isLocked() && value) {
                this.setLocked(false);
            }
        });
        this.pageModel.onCustomizeChanged(this.customizeChangedListener);
    }

    private unregisterPageModel(pageModel: PageModel) {
        if (PageView.debug) {
            console.log('PageView.unregisterPageModel', pageModel);
        }
        pageModel.unPropertyChanged(this.propertyChangedListener);
        pageModel.unPageModeChanged(this.pageModeChangedListener);
        pageModel.unCustomizeChanged(this.customizeChangedListener);
    }

    private addPageContextMenuActions() {
        const pageModel = this.liveEditModel.getPageModel();
        const inspectAction = new Action(i18n('live.view.inspect')).onExecuted(() => {
            new PageInspectedEvent().fire();
        });

        this.resetAction = new Action(i18n('live.view.reset')).onExecuted(() => {
            if (PageView.debug) {
                console.log('PageView.reset');
            }
            this.setIgnorePropertyChanges(true);
            pageModel.reset(this);
            this.setIgnorePropertyChanges(false);
        });

        if (pageModel.getMode() === PageMode.AUTOMATIC || pageModel.getMode() === PageMode.NO_CONTROLLER) {
            this.resetAction.setEnabled(false);
        }

        this.addContextMenuActions([inspectAction, this.resetAction]);
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
                if (!this.isTextEditMode()) {
                    PageViewController.get().setTextEditMode(true);
                } else {
                    (<TextComponentView>itemView).setEditMode(true);
                    this.closeTextEditModeButton.toggleClass('active', true);
                }
                new ItemViewSelectedEvent({itemView, position: null, newlyCreated: event.isNewlyCreated(), rightClicked: true}).fire();
                itemView.giveFocus();
            } else {
                if (this.isTextEditMode()) {
                    PageViewController.get().setTextEditMode(false);
                }
                if (event.isNewlyCreated()) {
                    itemView.select(null, ItemViewContextMenuPosition.NONE, true);
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

        this.onRemoved(event => this.unregisterPageModel(this.pageModel));

        ResponsiveManager.onAvailableSizeChanged(this, (item: ResponsiveItem) => {
            if (this.isTextEditMode()) {
                this.updateVerticalSpaceForEditorToolbar();
            }
        });

        LiveEditPageViewReadyEvent.on(event => {
            if (this === event.getPageView()) {
                this.appendContainerForTextToolbar();
            }
        });
    }

    private createCloseTextEditModeEl(): Element {
        const closeButton = new AEl('close-edit-mode-button icon-close');
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
            this.appendChild(this.editorToolbar);
            this.addClass('has-toolbar-container');
            PageViewController.get().setEditorToolbar(this.editorToolbar);
        }
    }

    private hasToolbarContainer(): boolean {
        return this.hasClass('has-toolbar-container');
    }

    private setIgnorePropertyChanges(value: boolean) {
        this.ignorePropertyChanges = value;
    }

    highlightSelected() {
        if (!this.isTextEditMode() && !this.isLocked() && !this.isDragging()) {
            super.highlightSelected();
        }
    }

    showCursor() {
        if (!this.isTextEditMode() && !this.isLocked()) {
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
        Shader.get().onUnlockClicked((event: MouseEvent) => {
            if (this.isLocked()) {
                this.setLocked(false);
            }
        });

        this.onMouseOverView(() => {
            if (this.isDragging() && this.lockedContextMenu) {
                if (this.lockedContextMenu.isVisible()) {
                    this.lockedContextMenu.hide();
                }
            }
        });
    }

    select(clickPosition?: ClickPosition,
           menuPosition?: ItemViewContextMenuPosition,
           newlyCreated: boolean = false,
           rightClicked: boolean = false
    ) {
        super.select(clickPosition, menuPosition, false, rightClicked);

        new PageSelectedEvent(this, rightClicked).fire();
    }

    selectWithoutMenu(restoredSelection?: boolean) {
        super.selectWithoutMenu(restoredSelection);

        new PageSelectedEvent(this).fire();
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
        const unlockAction = new Action(i18n('live.view.page.customize'));

        unlockAction.onExecuted(() => {
            this.setLocked(false);
        });

        return [unlockAction];
    }

    selectLocked(position: ClickPosition) {
        this.setLockVisible(true);
        this.lockedContextMenu.showAt(position.x, position.y);

        new ItemViewSelectedEvent({itemView: this, position}).fire();
        new PageSelectedEvent(this).fire();
    }

    deselectLocked() {
        this.setLockVisible(false);
        this.lockedContextMenu.hide();

        new ItemViewDeselectedEvent(this).fire();
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

        if (this.isTextEditMode()) {
            if (!this.isTextEditorToolbarClicked(event) && !this.isTextEditorDialogClicked(event)) {
                PageViewController.get().setTextEditMode(false);
            }
        } else {
            super.handleClick(event);
        }
    }

    private isTextEditorToolbarClicked(event: MouseEvent) {
        const target = <HTMLElement> event.target;
        const prefix = 'cke';
        if (!!target) {
            const parent = target.parentElement;
            return (target.id.indexOf(prefix) >= 0 || target.className.indexOf(prefix) >= 0 ||
                    parent.id.indexOf(prefix) >= 0 || parent.className.indexOf(prefix) >= 0);
        }
        return false;
    }

    private isTextEditorDialogClicked(event: MouseEvent) {
        let target = <HTMLElement> event.target;
        while (target) {
            if (target.classList.contains(ModalDialog.CLASS_NAME)) {
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }

    hideContextMenu() {
        if (this.lockedContextMenu) {
            this.lockedContextMenu.hide();
        }
        return super.hideContextMenu();
    }

    isLocked() {
        return this.hasClass('locked');
    }

    setLockVisible(visible: boolean) {
        this.toggleClass('lock-visible', visible);
    }

    setLocked(locked: boolean) {
        this.toggleClass('locked', locked);

        this.hideContextMenu();

        if (locked) {
            this.shade();

            new PageLockedEvent(this).fire();
        } else {
            this.unshade();

            const templateOrCustomized = this.pageModel.isPageTemplate() || this.pageModel.isCustomized();
            if (!templateOrCustomized) {
                this.pageModel.setCustomized(true);
                this.pageModel.setTemplateContoller();
            }

            new PageUnlockedEvent(this).fire();
            new PageInspectedEvent().fire();
        }

        this.notifyPageLockChanged(locked);
        PageViewController.get().setLocked(locked);
    }

    isTextEditMode(): boolean {
        return this.hasClass('text-edit-mode');
    }

    setTextEditMode(flag: boolean) {
        PageViewController.get().setHighlightingDisabled(flag);
        this.toggleClass('text-edit-mode', flag);

        const textItemViews = this.getItemViewsByType(TextItemType.get());

        let textView: TextComponentView;
        textItemViews.forEach((view: ItemView) => {
            textView = <TextComponentView> view;
            if (textView.isEditMode() !== flag) {
                textView.setEditMode(flag);
                this.closeTextEditModeButton.toggleClass('active', flag);
            }
        });

        if (this.editorToolbar) {
            this.editorToolbar.toggleClass('visible', flag);
        }

        if (flag) {
            this.addVerticalSpaceForEditorToolbar();

            this.onScrolled(this.scrolledListener);
            new PageTextModeStartedEvent(this).fire();
        } else {
            this.removeVerticalSpaceForEditorToolbar();
            this.unScrolled(this.scrolledListener);

            Highlighter.get().updateLastHighlightedItemView();
            SelectedHighlighter.get().updateLastHighlightedItemView();
        }
    }

    private addVerticalSpaceForEditorToolbar() {
        this.getEl().setPosition('relative');
        this.updateVerticalSpaceForEditorToolbar();
        this.toggleStickyToolbar();
    }

    getPageView(): PageView {
        return this;
    }

    getCurrentContextMenu(): ItemViewContextMenu {
        return this.lockedContextMenu || super.getCurrentContextMenu();
    }

    private updateVerticalSpaceForEditorToolbar() {
        const result = this.getEditorToolbarWidth();

        if (!!result) {
            this.getEl().setTop(this.getEditorToolbarWidth() + 'px');
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

    private removeVerticalSpaceForEditorToolbar() {
        this.getEl().setPosition('');
        this.getEl().setTop('');
    }

    private getEditorToolbarWidth(): number {
        return $('.cke-toolbar-container .cke_reset_all:not([style*=\'display: none\']) .cke_top').outerHeight();
    }

    hasTargetWithinTextComponent(target: HTMLElement) {
        const textItemViews = this.getItemViewsByType(TextItemType.get());
        let result: boolean = false;

        let textView: TextComponentView;
        textItemViews.forEach((view: ItemView) => {
            textView = <TextComponentView> view;
            if (textView.getEl().contains(target)) {
                result = true;
                return;
            }
        });

        return result;
    }

    setRenderable(value: boolean): ItemView {
        this.isRenderable = value;
        this.refreshEmptyState();

        return this;
    }

    isEmpty(): boolean {

        if (this.isRenderable) {
            return false;
        }

        return !this.pageModel || this.pageModel.getMode() === PageMode.NO_CONTROLLER || this.isEmptyPageTemplate();
    }

    private isEmptyPageTemplate(): boolean {
        return this.pageModel.isPageTemplate() && !this.pageModel.getController();
    }

    getName(): string {
        const pageTemplateDisplayName = PageTemplateDisplayName;
        if (this.pageModel.hasTemplate()) {
            return this.pageModel.getTemplate().getDisplayName();
        }
        if (this.pageModel.isPageTemplate() && this.pageModel.getController()) {
            return this.pageModel.getController().getDisplayName();
        }
        if (this.pageModel.isCustomized()) {
            return this.pageModel.hasController()
                   ? this.pageModel.getController().getDisplayName()
                   : pageTemplateDisplayName[pageTemplateDisplayName.Custom];
        }
        if (this.pageModel.getMode() === PageMode.AUTOMATIC) {
            return this.pageModel.getDefaultPageTemplate().getDisplayName();
        }

        return pageTemplateDisplayName[pageTemplateDisplayName.Automatic];
    }

    getIconUrl(content: Content): string {
        return '';
    }

    getIconClass(): string {
        const largeIconCls = ' icon-large';

        if (this.pageModel.hasTemplate()) {
            return 'icon-page-template' + largeIconCls;
        }
        if (this.pageModel.isPageTemplate() && this.pageModel.getController()) {
            return 'icon-file' + largeIconCls;
        }
        if (this.pageModel.isCustomized()) {
            return 'icon-file' + largeIconCls;
        }

        return 'icon-wand' + largeIconCls;
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

    getModel(): PageModel {
        return this.pageModel;
    }

    getFragmentView(): ComponentView<Component> {
        return this.fragmentView;
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
            return <RegionView>itemView;
        }
        return null;
    }

    getComponentViewByElement(element: HTMLElement): ComponentView<Component> {

        const itemView = this.getItemViewByElement(element);

        if (ObjectHelper.iFrameSafeInstanceOf(itemView, ComponentView)) {
            return <ComponentView<Component>> itemView;
        }

        return null;
    }

    getRegionViewByPath(path: RegionPath): RegionView {

        for (let i = 0; i < this.regionViews.length; i++) {
            const regionView = this.regionViews[i];

            if (path.hasParentComponentPath()) {
                const componentView = this.getComponentViewByPath(path.getParentComponentPath());
                if (ObjectHelper.iFrameSafeInstanceOf(componentView, LayoutComponentView)) {
                    const layoutView = <LayoutComponentView>componentView;
                    layoutView.getRegionViewByName(path.getRegionName());
                }
            } else {
                if (path.getRegionName() === regionView.getRegionName()) {
                    return regionView;
                }
            }
        }

        return null;
    }

    getComponentViewByPath(path: ComponentPath): ComponentView<Component> {
        if (!path) {
            return this.fragmentView;
        }

        const firstLevelOfPath = path.getFirstLevel();

        for (let i = 0; i < this.regionViews.length; i++) {
            const regionView = this.regionViews[i];
            if (firstLevelOfPath.getRegionName() === regionView.getRegionName()) {
                if (path.numberOfLevels() === 1) {
                    return regionView.getComponentViewByIndex(firstLevelOfPath.getComponentIndex());
                } else {
                    const view = regionView.getComponentViewByIndex(firstLevelOfPath.getComponentIndex());
                    const layoutView: LayoutComponentView = <LayoutComponentView>view;
                    return layoutView.getComponentViewByPath(path.removeFirstLevel());
                }
            }
        }

        return null;
    }

    private registerItemView(view: ItemView) {

        if (PageView.debug) {
            console.debug('PageView.registerItemView: ' + view.toString());
        }

        this.viewsById[view.getItemId().toNumber()] = view;

        this.notifyItemViewAdded(view);
    }

    private unregisterItemView(view: ItemView) {

        if (PageView.debug) {
            console.debug('PageView.unregisterItemView: ' + view.toString());
        }

        delete this.viewsById[view.getItemId().toNumber()];

        this.notifyItemViewRemoved(view);
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

        if (this.liveEditModel.getPageModel().getMode() === PageMode.FRAGMENT) {
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

        const pageRegions = this.liveEditModel.getPageModel().getRegions();
        if (!pageRegions) {
            return;
        }
        const children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            const itemType = ItemType.fromElement(childElement);
            const isRegionView = ObjectHelper.iFrameSafeInstanceOf(childElement, RegionView);
            let region;
            let regionName;
            let regionView;

            if (isRegionView) {
                regionName = RegionItemType.getRegionName(childElement);
                region = pageRegions.getRegionByName(regionName);
                if (region) {
                    // reuse existing region view
                    regionView = <RegionView> childElement;
                    // update view's data
                    regionView.setRegion(region);
                    // register it again because we unregistered everything before parsing
                    this.registerRegionView(regionView);
                }

            } else if (itemType && RegionItemType.get().equals(itemType)) {
                regionName = RegionItemType.getRegionName(childElement);
                region = pageRegions.getRegionByName(regionName);

                if (region) {
                    regionView =
                        new RegionView(new RegionViewBuilder()
                            .setLiveEditModel(this.liveEditModel)
                            .setParentView(this).setRegion(region)
                            .setElement(childElement));

                    this.registerRegionView(regionView);
                }

            } else {
                this.doParseItemViews(childElement);
            }
        });
    }

    private doParseFragmentItemViews(parentElement?: Element) {

        const fragment = this.liveEditModel.getPageModel().getPage().getFragment();
        if (!fragment) {
            return;
        }
        const children = parentElement ? parentElement.getChildren() : this.getChildren();

        children.forEach((childElement: Element) => {
            const itemType = ItemType.fromElement(childElement);
            const component: Component = this.pageModel.getPage().getFragment();
            let componentView: ComponentView<Component>;

            if (itemType && itemType.isComponentType()) {
                if (component) {
                    const isComponentView = ObjectHelper.iFrameSafeInstanceOf(childElement, ComponentView);
                    if (isComponentView) {
                        const oldComponentView: ComponentView<Component> = <ComponentView<Component>>childElement;
                        oldComponentView.unregisterComponentListeners(component);
                    }

                    const itemViewConfig = new CreateItemViewConfig<PageView, Component>()
                        .setParentView(this)
                        .setData(component)
                        .setElement(childElement)
                        .setParentElement(parentElement ? parentElement : this);
                    componentView = <ComponentView<Component>>this.createView(itemType, itemViewConfig);

                    this.registerFragmentComponentView(componentView);
                }
            } else {
                this.doParseFragmentItemViews(childElement);
            }
        });
    }

    unregisterFragmentComponentView(componentView: ComponentView<Component>) {
        componentView.unItemViewAdded(this.itemViewAddedListener);
        componentView.unItemViewRemoved(this.itemViewRemovedListener);

        componentView.toItemViewArray().forEach((itemView: ItemView) => {
            this.unregisterItemView(itemView);
        });
    }

    registerFragmentComponentView(componentView: ComponentView<Component>) {
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

    onItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners.push(listener);
    }

    unItemViewAdded(listener: (event: ItemViewAddedEvent) => void) {
        this.itemViewAddedListeners = this.itemViewAddedListeners.filter((current) => (current !== listener));
    }

    private notifyItemViewAdded(itemView: ItemView) {
        const event = new ItemViewAddedEvent(itemView);
        this.itemViewAddedListeners.forEach((listener) => listener(event));
    }

    onItemViewRemoved(listener: (event: ItemViewRemovedEvent) => void) {
        this.itemViewRemovedListeners.push(listener);
    }

    unItemViewRemoved(listener: (event: ItemViewRemovedEvent) => void) {
        this.itemViewRemovedListeners = this.itemViewRemovedListeners.filter((current) => (current !== listener));
    }

    private notifyItemViewRemoved(itemView: ItemView) {
        const event = new ItemViewRemovedEvent(itemView);
        this.itemViewRemovedListeners.forEach((listener) => listener(event));
    }

    onPageLocked(listener: (event: any) => void) {
        this.pageLockedListeners.push(listener);
    }

    unPageLocked(listener: (event: any) => void) {
        this.pageLockedListeners = this.pageLockedListeners.filter((current) => (current !== listener));
    }

    private notifyPageLockChanged(locked: boolean) {
        this.pageLockedListeners.forEach((listener) => {
            listener(locked);
        });
    }

    onChange(listener: () => void) {
        this.onItemViewAdded(listener);
        this.onItemViewRemoved(listener);
        this.onPageLocked(listener);
    }

    unChange(listener: () => void) {
        this.unItemViewAdded(listener);
        this.unItemViewRemoved(listener);
        this.unPageLocked(listener);
    }
}
