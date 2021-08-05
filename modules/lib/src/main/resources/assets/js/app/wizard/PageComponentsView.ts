import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {ElementHelper} from 'lib-admin-ui/dom/ElementHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from 'lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from 'lib-admin-ui/dom/Body';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Action} from 'lib-admin-ui/ui/Action';
import {LiveEditPageProxy} from './page/LiveEditPageProxy';
import {PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {SaveAsTemplateAction} from './action/SaveAsTemplateAction';
import {PageView} from '../../page-editor/PageView';
import {ItemViewContextMenu} from '../../page-editor/ItemViewContextMenu';
import {Highlighter} from '../../page-editor/Highlighter';
import {ItemViewSelectedEvent} from '../../page-editor/ItemViewSelectedEvent';
import {ItemViewDeselectedEvent} from '../../page-editor/ItemViewDeselectedEvent';
import {ComponentAddedEvent} from '../../page-editor/ComponentAddedEvent';
import {TextComponentView} from '../../page-editor/text/TextComponentView';
import {FragmentComponentView} from '../../page-editor/fragment/FragmentComponentView';
import {LayoutComponentView} from '../../page-editor/layout/LayoutComponentView';
import {ComponentRemovedEvent} from '../../page-editor/ComponentRemovedEvent';
import {ComponentLoadedEvent} from '../../page-editor/ComponentLoadedEvent';
import {ComponentResetEvent} from '../../page-editor/ComponentResetEvent';
import {ItemView} from '../../page-editor/ItemView';
import {ComponentView} from '../../page-editor/ComponentView';
import {ClickPosition} from '../../page-editor/ClickPosition';
import {PageViewController} from '../../page-editor/PageViewController';
import {Content} from '../content/Content';
import {DataChangedEvent, DataChangedType} from 'lib-admin-ui/ui/treegrid/DataChangedEvent';
import {ResponsiveRanges} from 'lib-admin-ui/ui/responsive/ResponsiveRanges';
import {KeyBinding} from 'lib-admin-ui/ui/KeyBinding';
import {H3El} from 'lib-admin-ui/dom/H3El';
import {CloseButton} from 'lib-admin-ui/ui/button/CloseButton';
import {H2El} from 'lib-admin-ui/dom/H2El';
import {DragHelper} from 'lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {ItemViewTreeGridWrapper} from '../../page-editor/ItemViewTreeGridWrapper';

export class PageComponentsView
    extends DivEl {

    private content: Content;
    private pageView: PageView;
    private liveEditPage: LiveEditPageProxy;
    private contextMenu: ItemViewContextMenu;

    private responsiveItem: ResponsiveItem;

    private tree: PageComponentsTreeGrid;
    private header: H3El;
    private modal: boolean;
    private floating: boolean;
    private draggable: boolean;
    private selectedItemId: string;

    private beforeInsertActionListeners: { (event: any): void }[] = [];

    private mouseDownListener: (event: MouseEvent) => void;
    private mouseUpListener: (event?: MouseEvent) => void;
    private mouseMoveListener: (event: MouseEvent) => void;
    private clickListener: (event: any, data: any) => void;
    private dblClickListener: (event: any, data: any) => void;
    private mouseDown: boolean = false;
    public static debug: boolean = false;

    private invalidItemIds: string[] = [];

    private currentUserHasCreateRights: Boolean;

    private keyBinding: KeyBinding[];

    private beforeActionHandler: (action: Action) => void;

    private afterActionHandler: (action: Action) => void;

    private modifyPermissions: boolean = false;

    constructor(liveEditPage: LiveEditPageProxy, private saveAsTemplateAction: SaveAsTemplateAction) {
        super('page-components-view');

        this.liveEditPage = liveEditPage;

        this.currentUserHasCreateRights = null;

        this.initElements();

        this.setupListeners();

        this.setModal(false).setFloating(true).setDraggable(true);

        this.initKeyBoardBindings();

        this.bindMouseListeners();
    }

    private initElements() {
        const closeButton = new CloseButton();
        closeButton.onClicked((event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            this.hide();
        });

        this.header = new H2El('header');
        this.header.setHtml(i18n('field.components'));

        this.responsiveItem = ResponsiveManager.onAvailableSizeChanged(Body.get(), (item: ResponsiveItem) => {
            const smallSize = item.isInRangeOrSmaller(ResponsiveRanges._360_540);
            const compactSize = item.isInRangeOrSmaller(ResponsiveRanges._720_960);
            this.toggleClass('compact', compactSize);
            if (this.tree) {
                this.tree.toggleCompact(compactSize);
            }
            if (!smallSize && this.isVisible()) {
                this.constrainToParent();
            }
            if (item.isRangeSizeChanged()) {
                this.setModal(smallSize).setDraggable(!smallSize);
            }
            if (this.tree && compactSize) {
                this.tree.getGrid().resizeCanvas();
            }
        });

        this.appendChildren(<Element>closeButton, this.header);
    }

    private setupListeners() {
        this.onHidden(() => this.hideContextMenu());

        this.onRemoved(() => {
            if (this.contextMenu) {
                this.contextMenu.remove();
            }
        });

        this.onShown(() => {
            this.constrainToParent();
            this.getHTMLElement().style.display = '';
            if (this.pageView && this.pageView.isLocked()) {
                this.addClass('locked');
            }
        });

        this.onAdded(() => this.initLiveEditEvents());
    }

    show() {
        KeyBindings.get().bindKeys(this.keyBinding);
        super.show();

        if (this.tree) {
            this.tree.getGrid().resizeCanvas();
        }
    }

    hide() {
        super.hide();
        KeyBindings.get().unbindKeys(this.keyBinding);
    }

    setPageView(pageView: PageView) {

        this.removeClass('locked');

        this.pageView = pageView;
        if (!this.tree && this.content && this.pageView) {

            this.createTree(this.content, this.pageView);
            this.initLock();

        } else if (this.tree) {

            this.tree.deselectAll();
            Highlighter.get().hide();

            this.tree.setPageView(pageView).then(() => {
                this.initLock();
                if (this.selectedItemId) {
                    this.selectItemById();
                }
            });
        }

        this.pageView.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChangedByItem(this.responsiveItem);
        });

        this.pageView.onPageLocked(this.pageLockedHandler.bind(this));
    }

    private initLock() {
        this.unContextMenu(this.lockedViewClickHandler);
        this.unClicked(this.lockedViewClickHandler);

        if (this.pageView.isLocked()) {
            this.addClass('locked');
        }

        this.onContextMenu(this.lockedViewClickHandler);
        this.onClicked(this.lockedViewClickHandler);
    }

    setContent(content: Content) {
        this.content = content;
        if (!this.tree && this.content && this.pageView) {
            this.createTree(this.content, this.pageView);
        }
    }

    setModifyPermissions(modifyPermissions: boolean): boolean {
        this.modifyPermissions = modifyPermissions;
        return this.modifyPermissions;
    }

    private initLiveEditEvents() {
        this.liveEditPage.onItemViewSelected((event: ItemViewSelectedEvent) => {
            if (!event.isNewlyCreated() && !this.pageView.isLocked()) {
                this.selectedItemId = event.getItemView().getItemId().toString();
                this.selectItemById();
            }
        });

        this.liveEditPage.onItemViewDeselected((event: ItemViewDeselectedEvent) => {
            this.tree.deselectNodes([event.getItemView().getItemId().toString()]);
            this.selectedItemId = null;
        });

        this.liveEditPage.onComponentAdded((event: ComponentAddedEvent) => {
            this.addComponent(event).then(() => {
                this.handleComponentAdded(event);
            });
        });

        this.liveEditPage.onComponentRemoved((event: ComponentRemovedEvent) => {
            this.tree.deleteNodeByDataId(event.getComponentView().getItemId().toString());
            this.highlightInvalidItems();
        });

        this.liveEditPage.onComponentLoaded((event: ComponentLoadedEvent) => {
            this.tree.refreshComponentNode(event.getNewComponentView(), event.getOldComponentView());
            this.tree.scrollToItem(event.getNewComponentView().getItemId().toString());

            if (ObjectHelper.iFrameSafeInstanceOf(event.getNewComponentView(), FragmentComponentView)) {
                this.bindTreeFragmentNodeUpdateOnComponentLoaded(<FragmentComponentView>event.getNewComponentView());
                this.bindFragmentLoadErrorHandler(<FragmentComponentView>event.getNewComponentView());
                return;
            }

            if (ObjectHelper.iFrameSafeInstanceOf(event.getNewComponentView(), LayoutComponentView)) {
                const componentDataId = event.getNewComponentView().getItemId().toString();
                this.tree.expandNodeByDataId(componentDataId);
                return;
            }
        });

        this.liveEditPage.onComponentReset((event: ComponentResetEvent) => {
            const oldDataId: string = event.getOldComponentView().getItemId().toString();

            this.tree.refreshComponentNode(event.getNewComponentView(), event.getOldComponentView(), true);

            this.removeFromInvalidItems(oldDataId);
        });
    }

    private addComponent(event: ComponentAddedEvent): Q.Promise<boolean> {
        this.tree.addComponentToParent(event.getComponentView(), event.getParentRegionView());
        return this.tree.expandNodeByDataId(event.getParentRegionView().getItemId().toString());
    }

    private handleComponentAdded(event: ComponentAddedEvent) {
        if (event.getComponentView().isSelected()) {
            this.tree.selectNode(event.getComponentView().getItemId().toString());
        }

        if (this.tree.hasChildren(new ItemViewTreeGridWrapper(event.getComponentView()))) {
            const componentDataId = event.getComponentView().getItemId().toString();

            if (event.isDragged()) {
                this.tree.collapseNodeByDataId(componentDataId);
            } else {
                this.tree.expandNodeByDataId(componentDataId);
            }
        }

        this.constrainToParent();
        this.highlightInvalidItems();
    }

    private createTree(content: Content, pageView: PageView) {
        this.tree = new PageComponentsTreeGrid(content, pageView);

        this.clickListener = (event, data) => {
            let elem = new ElementHelper(event.target);

            this.hideContextMenu();

            if (elem.hasClass('toggle')) {
                // do nothing if expand toggle is clicked
                return;
            }

            Highlighter.get().hide();

            if (this.isMenuIconClicked(data.cell)) {
                this.showContextMenu(data.row, {x: event.pageX, y: event.pageY});
            }

            if (this.isModal()) {
                this.hide();
            }
        };

        this.dblClickListener = (event, data) => {
            if (this.pageView.isLocked()) {
                return;
            }

            let clickedItemView: ItemView = this.tree.getGrid().getDataView().getItem(data.row).getData().getItemView();
            let isTextComponent = ObjectHelper.iFrameSafeInstanceOf(clickedItemView, TextComponentView);

            if (isTextComponent) {
                this.editTextComponent(clickedItemView);
            }
        };

        this.tree.getGrid().subscribeOnClick(this.clickListener);

        this.tree.getGrid().subscribeOnDblClick(this.dblClickListener);

        this.tree.getGrid().subscribeOnMouseEnter((event, data) => {

            if (DragHelper.get().isVisible()) {
                return;
            }

            let rowElement = event.target;
            let selected = false;

            while (!rowElement.classList.contains('slick-row')) {
                if (rowElement.classList.contains('selected')) {
                    selected = true;
                }

                rowElement = rowElement.parentElement;
            }

            if (!this.pageView.isLocked()) {
                this.highlightRow(rowElement, selected);
                if (this.isMenuIcon(event.target) && BrowserHelper.isIOS()) {
                    this.showContextMenu(new ElementHelper(rowElement).getSiblingIndex(), {x: event.pageX, y: event.pageY});
                }
            }
        });

        this.tree.getGrid().subscribeOnMouseLeave((event, data) => {
            Highlighter.get().hide();
        });

        this.tree.onSelectionChanged(() => {
            const fullSelection: number = this.tree.getTotalSelected();
            const currentSelection: ItemViewTreeGridWrapper[] = this.tree.getCurrentSelection();

            if (fullSelection > 0 && this.isModal()) {
                this.hide();
            }

            const selectedItem: ItemViewTreeGridWrapper = currentSelection[0];

            if (selectedItem) {
                if (!selectedItem.getItemView().isSelected()) {
                    this.selectItem(selectedItem.getItemView());
                }

                if (!!this.contextMenu && !this.contextMenu.belongsToItemView(selectedItem.getItemView())) {
                    this.hideContextMenu();
                }
            }
        });

        this.tree.getGrid().subscribeOnContextMenu((event) => {
            event.stopPropagation();
            event.preventDefault();

            let cell = this.tree.getGrid().getCellFromEvent(event);

            this.showContextMenu(cell.row, {x: event.pageX, y: event.pageY});
        });

        this.appendChild(this.tree);

        this.tree.onRemoved((event) => this.tree.getGrid().unsubscribeOnClick(this.clickListener));
        this.tree.onRemoved((event) => this.tree.getGrid().unsubscribeOnDblClick(this.dblClickListener));

        this.tree.onLoaded(() => {
            this.subscribeOnFragmentLoadError();
        });

        this.tree.onDataChanged((event: DataChangedEvent<ItemViewTreeGridWrapper>) => {
            if (event.getType() !== DataChangedType.UPDATED) {
                this.constrainToParent();
            }
        });

        this.tree.getGrid().subscribeOnDrag(() => {
            this.addClass('dragging');
        });

        this.tree.getGrid().subscribeOnDragEnd(() => {
            this.removeClass('dragging');
        });
    }

    private highlightInvalidItems() {
        this.tree.setInvalid(this.invalidItemIds);
    }

    private removeFromInvalidItems(itemId: string) {
        this.invalidItemIds = this.invalidItemIds.filter((curr) => {
            return curr !== itemId;
        });
        this.highlightInvalidItems();
    }

    private addToInvalidItems(itemId: string) {
        this.invalidItemIds.push(itemId);
        this.highlightInvalidItems();
    }

    private isMenuIcon(element: HTMLElement): boolean {
        return !!element && !!element.className && element.className.indexOf('menu-icon') > -1;
    }

    private subscribeOnFragmentLoadError() {
        this.tree.getGrid().getDataView().getItems().map((dataItem) => {
            return dataItem.getData().getItemView();
        }).filter((itemView: ItemView) => {
            return ObjectHelper.iFrameSafeInstanceOf(itemView, FragmentComponentView);
        }).forEach((fragmentComponentView: FragmentComponentView) => {
            this.bindFragmentLoadErrorHandler(fragmentComponentView);
        });
    }

    private bindTreeFragmentNodeUpdateOnComponentLoaded(fragmentComponentView: FragmentComponentView) {
        fragmentComponentView.onFragmentContentLoaded((e) => {
            this.tree.updateNodeByData(new ItemViewTreeGridWrapper(e.getFragmentComponentView()));
        });
    }

    private bindFragmentLoadErrorHandler(fragmentComponentView: FragmentComponentView) {
        fragmentComponentView.onFragmentLoadError((e) => {
            this.addToInvalidItems(e.getFragmentComponentView().getItemId().toString());
        });
    }

    private initKeyBoardBindings() {
        const removeHandler = () => {
            const itemViewWrapper: ItemViewTreeGridWrapper = this.tree.getFirstSelectedItem();

            if (itemViewWrapper) {
                if (ObjectHelper.iFrameSafeInstanceOf(itemViewWrapper, ComponentView)) {
                    itemViewWrapper.getItemView().deselect();
                    itemViewWrapper.getItemView().remove();
                }
            }
            return true;
        };
        this.keyBinding = [
            new KeyBinding('del', removeHandler),
            new KeyBinding('backspace', removeHandler)
        ];

    }

    private bindMouseListeners() {
        this.lockedViewClickHandler = this.lockedViewClickHandler.bind(this);
    }

    private selectItem(item: ItemView) {
        item.selectWithoutMenu();
        this.tree.scrollToItem(item.getItemId().toString());
    }

    private selectItemById() {
        this.tree.selectNode(this.selectedItemId, true);
        this.tree.getGrid().focus();
    }

    isDraggable(): boolean {
        return this.draggable;
    }

    setDraggable(draggable: boolean): PageComponentsView {
        let body = Body.get();
        if (!this.draggable && draggable) {
            let lastPos;
            if (!this.mouseDownListener) {
                this.mouseDownListener = (event: MouseEvent) => {
                    if (PageComponentsView.debug) {
                        console.log('mouse down', this.mouseDown, event);
                    }
                    if (!this.mouseDown && event.buttons === 1) {
                        // left button was clicked
                        event.preventDefault();
                        event.stopPropagation();
                        this.mouseDown = true;
                        lastPos = {
                            x: event.clientX,
                            y: event.clientY
                        };
                    }
                };
            }
            if (!this.mouseUpListener) {
                this.mouseUpListener = (event?: MouseEvent) => {
                    if (PageComponentsView.debug) {
                        console.log('mouse up', this.mouseDown, event);
                    }
                    if (this.mouseDown) {
                        // left button was released
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }

                        this.mouseDown = false;
                    }
                };
            }
            if (!this.mouseMoveListener) {
                this.mouseMoveListener = (event: MouseEvent) => {
                    if (this.mouseDown) {
                        if (event.buttons !== 1) {
                            // button was probably released outside browser window
                            this.mouseUpListener();
                            return;
                        }
                        event.preventDefault();
                        event.stopPropagation();

                        let el = this.getEl();
                        let newPos = {
                            x: event.clientX,
                            y: event.clientY
                        };
                        let offset = el.getOffset();
                        let newOffset = {
                            top: offset.top + newPos.y - lastPos.y,
                            left: offset.left + newPos.x - lastPos.x
                        };

                        this.constrainToParent(newOffset);

                        lastPos = newPos;

                        this.hideContextMenu();
                    }
                };
            }
            this.header.onMouseDown(this.mouseDownListener);
            body.onMouseUp(this.mouseUpListener);
            body.onMouseMove(this.mouseMoveListener);
        } else if (this.draggable && !draggable) {
            this.header.unMouseDown(this.mouseDownListener);
            body.unMouseUp(this.mouseUpListener);
            body.unMouseMove(this.mouseMoveListener);
        }
        this.toggleClass('draggable', draggable);
        this.draggable = draggable;
        return this;
    }

    private constrainToParent(offset?: { top: number; left: number }) {
        const el = this.getEl();
        const elOffset = offset || el.getOffset();
        let parentEl;
        let parentOffset;

        if (this.getParentElement()) {
            parentEl = this.getParentElement().getEl();
            parentOffset = parentEl.getOffset();
        } else {
            parentEl = WindowDOM.get();
            parentOffset = {
                top: 0,
                left: 0
            };
        }

        el.setMaxHeightPx(parentEl.getHeight());

        el.setOffset({
            top: Math.max(parentOffset.top, Math.min(elOffset.top, parentOffset.top + parentEl.getHeight() - el.getHeightWithBorder())),
            left: Math.max(parentOffset.left, Math.min(elOffset.left, parentOffset.left + parentEl.getWidth() - el.getWidthWithBorder()))
        });
    }

    isFloating(): boolean {
        return this.floating;
    }

    setFloating(floating: boolean): PageComponentsView {
        this.toggleClass('floating', floating);
        this.floating = floating;
        return this;
    }

    isModal(): boolean {
        return this.modal;
    }

    setModal(modal: boolean): PageComponentsView {
        this.toggleClass('modal', modal);
        if (this.tree) {
            // tree may not be yet initialized
            this.tree.getGrid().resizeCanvas();
        }
        this.modal = modal;
        return this;
    }

    private pageLockedHandler(lock: boolean) {
        this.toggleClass('locked', lock);
        if (this.tree) {
            this.tree.reload();
        }
    }

    private lockedViewClickHandler(event: MouseEvent) {
        const isUnlocked = !(this.pageView.isLocked() && this.modifyPermissions);

        if (isUnlocked) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        if (this.contextMenu && this.contextMenu.isVisible()) {
            this.hideContextMenu();
        } else {
            this.showContextMenu(null, {x: event.pageX, y: event.pageY});
        }
    }

    private isMenuIconClicked(cellNumber: number): boolean {
        return cellNumber === 1;
    }

    private showContextMenu(row: number, clickPosition: ClickPosition) {
        let node = this.tree.getGrid().getDataView().getItem(row);
        let itemView: ItemView;
        let pageView: PageView;

        if (node) {
            itemView = node.getData().getItemView();
            pageView = itemView.getPageView();
        } else {
            pageView = this.pageView;
        }
        let contextMenuActions: Action[];

        if (pageView.isLocked()) {
            contextMenuActions = pageView.getLockedMenuActions();
        } else {
            contextMenuActions = itemView.getContextMenuActions();
        }

        if (!this.contextMenu) {
            this.contextMenu = new ItemViewContextMenu(null, contextMenuActions, false);
            this.contextMenu.onHidden(this.removeMenuOpenStyleFromMenuIcon.bind(this));
        } else {
            this.contextMenu.setActions(contextMenuActions);
        }
        this.contextMenu.setItemView(itemView || pageView);

        if (this.beforeActionHandler) {
            this.contextMenu.getMenu().unBeforeAction(this.beforeActionHandler);
        } else {
            this.beforeActionHandler = (action: Action) => {

                PageViewController.get().setContextMenuDisabled(true);
                if (action.hasParentAction() && action.getParentAction().getLabel() === i18n('widget.components.insert')) {
                    this.notifyBeforeInsertAction();
                }
            };
        }

        if (this.afterActionHandler) {
            this.contextMenu.getMenu().unAfterAction(this.afterActionHandler);
        } else {
            this.afterActionHandler = (action: Action) => {
                const isViewVisible = (this.getHTMLElement().offsetHeight > 0);
                this.hidePageComponentsIfInMobileView(action);

                if (isViewVisible && action.hasParentAction() && action.getParentAction().getLabel() === i18n('live.view.selectparent')) {
                    this.tree.getFirstSelectedItem().getItemView().hideContextMenu();
                }

                setTimeout(() => {
                    PageViewController.get().setContextMenuDisabled(false);
                    if (!isViewVisible) { // if PCV not visible, for example fragment created, hide highlighter

                        Highlighter.get().hide();
                    }
                }, 500);
            };
        }

        this.contextMenu.getMenu().onBeforeAction(this.beforeActionHandler);
        this.contextMenu.getMenu().onAfterAction(this.afterActionHandler);

        this.setMenuOpenStyleOnMenuIcon(row);

        this.saveAsTemplateAction.updateVisibility();

        // show menu at position
        let x = clickPosition.x;
        let y = clickPosition.y;

        this.contextMenu.showAt(x, y, false);
    }

    private hidePageComponentsIfInMobileView(action: Action) {
        if (BrowserHelper.isMobile() &&
            ((action.hasParentAction() && action.getParentAction().getLabel() === i18n('action.insert'))
             || action.getLabel() === i18n('action.inspect')
             || action.getLabel() === i18n('action.edit')
             || action.getLabel() === i18n('action.duplicate'))) {
            this.hide();
        }
    }

    private setMenuOpenStyleOnMenuIcon(row: number) {
        let stylesHash = {};
        stylesHash[row] = {menu: 'menu-open'};
        this.tree.getGrid().setCellCssStyles('menu-open', stylesHash);
    }

    private removeMenuOpenStyleFromMenuIcon() {
        this.tree.getGrid().removeCellCssStyles('menu-open');
    }

    private hideContextMenu() {
        if (this.contextMenu && this.contextMenu.isVisible()) {
            this.contextMenu.hide();
        }
    }

    private highlightRow(rowElement: HTMLElement, selected: boolean): void {
        if (selected) {
            Highlighter.get().hide();
        } else {
            const elementHelper = new ElementHelper(rowElement);
            const dimensions = elementHelper.getDimensions();
            const data: ItemViewTreeGridWrapper = this.tree.getDataByRow(new ElementHelper(rowElement).getSiblingIndex());

            if (data) {
                if (!BrowserHelper.isMobile()) {
                    Highlighter.get().highlightElement(dimensions,
                        data.getItemView().getType().getConfig().getHighlighterStyle());
                }
                if (BrowserHelper.isIOS()) {
                    this.selectItem(data.getItemView());
                }
            }
        }
    }

    onBeforeInsertAction(listener: (event: any) => void) {
        this.beforeInsertActionListeners.push(listener);
    }

    unBeforeInsertAction(listener: (event: any) => void) {
        this.beforeInsertActionListeners = this.beforeInsertActionListeners.filter((currentListener: (event: any) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyBeforeInsertAction() {
        this.beforeInsertActionListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private editTextComponent(textComponent: ItemView) {
        let contextMenuActions: Action[] = textComponent.getContextMenuActions();

        let editAction: Action;

        contextMenuActions.some((action: Action) => {
            if (action.getLabel() === i18n('action.edit')) {
                editAction = action;
                return true;
            }
        });

        if (editAction) {
            this.hide();
            editAction.execute();
        }
    }
}
