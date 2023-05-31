import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
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
import {DataChangedEvent, DataChangedType} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ItemViewTreeGridWrapper} from '../../page-editor/ItemViewTreeGridWrapper';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';

export class PageComponentsView
    extends DivEl {

    private static LOCKED_CLASS: string = 'locked';
    private static COLLAPSED_CLASS: string = 'collapsed';
    private static COLLAPSE_BUTTON_ICON_CLASS: string = 'icon-down-arrow';
    private static PCV_COLLAPSED_KEY: string = 'contentstudio:pcv:collapsed';

    private content: Content;
    private pageView: PageView;
    private liveEditPage: LiveEditPageProxy;
    private contextMenu: ItemViewContextMenu;

    private responsiveItem: ResponsiveItem;

    private tree: PageComponentsTreeGrid;
    private header: Element;
    private modal: boolean;
    private draggable: boolean;
    private selectedItemId: string;
    private dockedParent: Element;
    private toggleCollapsedStateButton: Button;

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

    constructor(liveEditPage: LiveEditPageProxy) {
        super('page-components-view');

        this.liveEditPage = liveEditPage;

        this.currentUserHasCreateRights = null;

        this.initElements();

        this.setupListeners();

        this.setModal(false);

        this.initKeyBoardBindings();

        this.bindMouseListeners();
    }

    private initElements(): void {
        this.toggleCollapsedStateButton =
            new Button().addClass(`minimize-button ${PageComponentsView.COLLAPSE_BUTTON_ICON_CLASS}`).setTitle(
                i18n('field.hideComponent')) as Button;

        this.toggleCollapsedStateButton.onClicked((event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            this.toggleCollapsedState();
        });

        this.header = new DivEl('header');
        this.header.setHtml(i18n('field.components'));

        this.responsiveItem = ResponsiveManager.onAvailableSizeChanged(Body.get(), (item: ResponsiveItem) => {
            if (!this.isVisible()) {
                return;
            }
            const smallSize = item.isInRangeOrSmaller(ResponsiveRanges._360_540);

            if (!smallSize && this.isVisible()) {
                this.constrainToParent();
            }
            if (item.isRangeSizeChanged()) {
                this.setModal(smallSize);
            }
        });


        const headerWrapper = new DivEl('header-wrapper');
        headerWrapper.appendChildren(this.header, this.toggleCollapsedStateButton);
        this.appendChildren(headerWrapper);
    }

    private setupListeners(): void {
        this.onHidden(() => this.hideContextMenu());

        this.onShown(() => {
            if (this.pageView?.isLocked()) {
                this.addClass(PageComponentsView.LOCKED_CLASS);
            }
        });

        this.whenRendered(() => this.initLiveEditEvents());

        this.header.onDblClicked(() => {
            this.toggleCollapsedState();
        });
    }

    show(): void {
        KeyBindings.get().bindKeys(this.keyBinding);
        super.show();

        if (this.tree) {
            this.tree.getGrid().resizeCanvas();
        }
    }

    dock(): void {
        this.setDraggable(false);
        this.dockedParent?.appendChild(this);
    }

    undock(): void {
        this.dockedParent = this.getParentElement();
        this.setDraggable(true);
        Body.get().appendChild(this);

        if (localStorage.getItem(PageComponentsView.PCV_COLLAPSED_KEY)) {
            if (!this.isCollapsed()) {
                this.collapse();
            }
        } else {
            this.constrainToParent();
        }
    }

    hide(): void {
        super.hide();
        KeyBindings.get().unbindKeys(this.keyBinding);
    }

    setPageView(pageView: PageView): void {
        this.removeClass(PageComponentsView.LOCKED_CLASS);

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

        this.pageView.onRemoved((): void => {
            ResponsiveManager.unAvailableSizeChangedByItem(this.responsiveItem);
        });

        this.pageView.onPageLocked(this.pageLockedHandler.bind(this));
    }

    private initLock(): void {
        this.unContextMenu(this.lockedViewClickHandler);
        this.unClicked(this.lockedViewClickHandler);

        if (this.pageView.isLocked()) {
            this.addClass(PageComponentsView.LOCKED_CLASS);
        }

        this.onContextMenu(this.lockedViewClickHandler);
        this.onClicked(this.lockedViewClickHandler);
    }

    setContent(content: Content): void {
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
        this.liveEditPage.onItemViewSelected((event: ItemViewSelectedEvent): void => {
            if (!event.isNewlyCreated() && !this.pageView.isLocked()) {
                this.selectedItemId = event.getItemView().getItemId().toString();
                this.selectItemById();

                if (event.getPosition()) { // scroll to item if it was selected in preview
                    this.tree.scrollToItem(this.selectedItemId);
                }
            }
        });

        this.liveEditPage.onItemViewDeselected((event: ItemViewDeselectedEvent): void => {
            this.tree.deselectNodes([event.getItemView().getItemId().toString()]);
            this.selectedItemId = null;
        });

        this.liveEditPage.onComponentAdded((event: ComponentAddedEvent): void => {
            this.addComponent(event).then(() => {
                this.handleComponentAdded(event);
            });
        });

        this.liveEditPage.onComponentRemoved((event: ComponentRemovedEvent): void => {
            this.tree.deleteNodeByDataId(event.getComponentView().getItemId().toString());
            this.highlightInvalidItems();
        });

        this.liveEditPage.onComponentLoaded((event: ComponentLoadedEvent): void => {
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

        this.liveEditPage.onComponentReset((event: ComponentResetEvent): void => {
            const oldDataId: string = event.getOldComponentView().getItemId().toString();

            this.tree.refreshComponentNode(event.getNewComponentView(), event.getOldComponentView(), true);

            this.removeFromInvalidItems(oldDataId);
        });

        this.liveEditPage.onBeforeLoad(() => {
            this.addClass('loading');
        });

        this.liveEditPage.onLoaded(() => {
            this.removeClass('loading');
        });
    }

    private addComponent(event: ComponentAddedEvent): Q.Promise<boolean> {
        this.tree.addComponentToParent(event.getComponentView(), event.getParentRegionView());
        return this.tree.expandNodeByDataId(event.getParentRegionView().getItemId().toString());
    }

    private handleComponentAdded(event: ComponentAddedEvent): void {
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

    private createTree(content: Content, pageView: PageView): void {
        this.tree = new PageComponentsTreeGrid(content, pageView);

        this.clickListener = (event, data): void => {
            const elem: ElementHelper = new ElementHelper(event.target);

            this.hideContextMenu();

            if (elem.hasClass('toggle')) {
                // do nothing if expand toggle is clicked
                return;
            }

            Highlighter.get().hide();

            if (this.isMenuIconClicked(data.cell)) {
                this.showContextMenu(data.row, {x: event.pageX, y: event.pageY});
            }
        };

        this.dblClickListener = (event, data): void => {
            if (this.pageView.isLocked()) {
                return;
            }

            const clickedItemView: ItemView = this.tree.getGrid().getDataView().getItem(data.row).getData().getItemView();
            const isTextComponent: boolean = ObjectHelper.iFrameSafeInstanceOf(clickedItemView, TextComponentView);

            if (isTextComponent) {
                this.editTextComponent(clickedItemView);
            }
        };

        this.tree.getGrid().subscribeOnClick(this.clickListener);

        this.tree.getGrid().subscribeOnDblClick(this.dblClickListener);

        this.tree.getGrid().subscribeOnMouseEnter((event, data): void => {
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
            const currentSelection: ItemViewTreeGridWrapper[] = this.tree.getCurrentSelection();
            const selectedItem: ItemViewTreeGridWrapper = currentSelection[0];

            if (selectedItem) {
                // only if iframe is visible
                if (!selectedItem.getItemView().isSelected() && this.liveEditPage.getIFrame()?.isVisible()) {
                    this.selectItem(selectedItem.getItemView());
                }

                if (!!this.contextMenu && !this.contextMenu.belongsToItemView(selectedItem.getItemView())) {
                    this.hideContextMenu();
                }
            }
        });

        this.tree.getGrid().subscribeOnContextMenu((event): void => {
            event.stopPropagation();
            event.preventDefault();

            const cell: Slick.Cell = this.tree.getGrid().getCellFromEvent(event);

            this.showContextMenu(cell.row, {x: event.pageX, y: event.pageY});
        });

        this.appendChild(this.tree);

        this.tree.onLoaded((): void => {
            this.subscribeOnFragmentLoadError();
        });

        this.tree.onDataChanged((event: DataChangedEvent<ItemViewTreeGridWrapper>) => {
            if (event.getType() !== DataChangedType.UPDATED) {
                this.constrainToParent();
            }
        });

        this.tree.getGrid().subscribeOnDrag((): void => {
            this.addClass('dragging');
        });

        this.tree.getGrid().subscribeOnDragEnd((): void => {
            this.removeClass('dragging');
        });

        this.tree.setNodeExpandedHandler(() => this.constrainToParent()); // not letting PCV to overflow the page
    }

    private highlightInvalidItems(): void {
        this.tree.setInvalid(this.invalidItemIds);
    }

    private removeFromInvalidItems(itemId: string): void {
        this.invalidItemIds = this.invalidItemIds.filter((curr) => {
            return curr !== itemId;
        });
        this.highlightInvalidItems();
    }

    private addToInvalidItems(itemId: string): void {
        this.invalidItemIds.push(itemId);
        this.highlightInvalidItems();
    }

    private isMenuIcon(element: HTMLElement): boolean {
        return element?.className?.indexOf('menu-icon') > -1;
    }

    private subscribeOnFragmentLoadError(): void {
        this.tree.getGrid().getDataView().getItems().map((dataItem) => {
            return dataItem.getData().getItemView();
        }).filter((itemView: ItemView) => {
            return ObjectHelper.iFrameSafeInstanceOf(itemView, FragmentComponentView);
        }).forEach((fragmentComponentView: FragmentComponentView) => {
            this.bindFragmentLoadErrorHandler(fragmentComponentView);
        });
    }

    private bindTreeFragmentNodeUpdateOnComponentLoaded(fragmentComponentView: FragmentComponentView): void {
        fragmentComponentView.onFragmentContentLoaded((e) => {
            this.tree.updateNodeByData(new ItemViewTreeGridWrapper(e.getFragmentComponentView()));
        });
    }

    private bindFragmentLoadErrorHandler(fragmentComponentView: FragmentComponentView): void {
        fragmentComponentView.onFragmentLoadError((e) => {
            this.addToInvalidItems(e.getFragmentComponentView().getItemId().toString());
        });
    }

    private initKeyBoardBindings(): void {
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

    private bindMouseListeners(): void {
        this.lockedViewClickHandler = this.lockedViewClickHandler.bind(this);
    }

    private selectItem(item: ItemView): void {
        item.selectWithoutMenu();
        this.tree.scrollToItem(item.getItemId().toString());
    }

    private selectItemById(): void {
        this.tree.selectNode(this.selectedItemId, true);
    }

    isDraggable(): boolean {
        return this.draggable;
    }

    setDraggable(draggable: boolean): PageComponentsView {
        const body = Body.get();

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

    private constrainToParent(offset?: { top: number; left: number }): void {
        const el = this.getEl();

        if (!this.draggable) {
            el.setMaxHeight('');
            return;
        }

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

        el.setMaxHeightPx(parentEl.getHeight() - 48);

        const top =
                Math.max(parentOffset.top, Math.min(elOffset.top, parentOffset.top + parentEl.getHeight() - el.getHeightWithBorder()), 48);
        const left =
            Math.max(parentOffset.left, Math.min(elOffset.left, parentOffset.left + parentEl.getWidth() - el.getWidthWithBorder()), 48);

        el.setTop(`${top}px`);
        el.setLeft(`${left}px`);
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

    private pageLockedHandler(lock: boolean): void {
        this.toggleClass(PageComponentsView.LOCKED_CLASS, lock);
        if (this.tree) {
            this.tree.reload();
        }
    }

    private lockedViewClickHandler(event: MouseEvent): void {
        const isUnlocked = !(this.pageView.isLocked() && this.modifyPermissions);

        if (isUnlocked) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        if (this.contextMenu?.isVisible()) {
            this.hideContextMenu();
        } else {
            this.showContextMenu(null, {x: event.pageX, y: event.pageY});
        }
    }

    private isMenuIconClicked(cellNumber: number): boolean {
        return cellNumber === 1;
    }

    private showContextMenu(row: number, clickPosition: ClickPosition): void {
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

        SaveAsTemplateAction.get().updateVisibility();

        // show menu at position
        let x = clickPosition.x;
        let y = clickPosition.y;

        this.contextMenu.showAt(x, y, false);
    }

    private setMenuOpenStyleOnMenuIcon(row: number): void {
        let stylesHash = {};
        stylesHash[row] = {menu: 'menu-open'};
        this.tree.getGrid().setCellCssStyles('menu-open', stylesHash);
    }

    private removeMenuOpenStyleFromMenuIcon(): void {
        this.tree.getGrid().removeCellCssStyles('menu-open');
    }

    private hideContextMenu(): void {
        if (this.contextMenu?.isVisible()) {
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

    onBeforeInsertAction(listener: (event: any) => void): void {
        this.beforeInsertActionListeners.push(listener);
    }

    unBeforeInsertAction(listener: (event: any) => void): void {
        this.beforeInsertActionListeners = this.beforeInsertActionListeners.filter((currentListener: (event: any) => void) => {
            return listener !== currentListener;
        });
    }

    private notifyBeforeInsertAction(): void {
        this.beforeInsertActionListeners.forEach((listener: (event: any) => void) => {
            listener.call(this);
        });
    }

    private editTextComponent(textComponent: ItemView): void {
        const contextMenuActions: Action[] = textComponent.getContextMenuActions();
        let editAction: Action;

        contextMenuActions.some((action: Action) => {
            if (action.getLabel() === i18n('action.edit')) {
                editAction = action;
                return true;
            }
        });

        editAction?.execute();
    }

    getEl(): ElementHelper {
        return super.getEl();
    }

    private toggleCollapsedState(): void {
        this.isCollapsed() ? this.expand() : this.collapse();
    }

    private isCollapsed(): boolean {
        return this.hasClass(PageComponentsView.COLLAPSED_CLASS);
    }

    private collapse(): void {
        localStorage.setItem(PageComponentsView.PCV_COLLAPSED_KEY, 'true');
        this.toggleCollapsedStateButton.setTitle(i18n('field.showComponent'));
        this.toggleClass(PageComponentsView.COLLAPSED_CLASS, true);
        this.hideContextMenu();
    }

    private expand(): void {
        localStorage.removeItem(PageComponentsView.PCV_COLLAPSED_KEY);
        this.toggleCollapsedStateButton.setTitle(i18n('field.hideComponent'));
        this.toggleClass(PageComponentsView.COLLAPSED_CLASS, false);
        this.constrainToParent(); // not letting PCV to overflow the page
        this.tree.getGrid().resizeCanvas();
    }
}
