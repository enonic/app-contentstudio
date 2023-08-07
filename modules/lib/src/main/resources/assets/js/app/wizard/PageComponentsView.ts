import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {LiveEditPageProxy} from './page/LiveEditPageProxy';
import {PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {SaveAsTemplateAction} from './action/SaveAsTemplateAction';
import {ItemViewContextMenu} from '../../page-editor/ItemViewContextMenu';
import {Highlighter} from '../../page-editor/Highlighter';
import {ClickPosition} from '../../page-editor/ClickPosition';
import {PageViewController} from '../../page-editor/PageViewController';
import {DataChangedEvent, DataChangedType} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {ComponentPath} from '../page/region/ComponentPath';
import {TreeComponent} from './TreeComponent';
import {Page} from '../page/Page';
import {PageEventsManager} from './PageEventsManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {TextComponent} from '../page/region/TextComponent';
import {PageActionsHelper} from './PageActionsHelper';
import {Component} from '../page/region/Component';
import {Region} from '../page/region/Region';
import {PageNavigationHandler} from './PageNavigationHandler';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';
import {PageState} from './page/PageState';
import {ComponentAddedEvent} from '../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../page/region/ComponentRemovedEvent';
import {PageItem} from '../page/region/PageItem';
import {ComponentUpdatedEvent} from '../page/region/ComponentUpdatedEvent';
import {PageItemType} from '../page/region/PageItemType';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';

export class PageComponentsView
    extends DivEl implements PageNavigationHandler {

    private static LOCKED_CLASS: string = 'locked';
    private static COLLAPSED_CLASS: string = 'collapsed';
    private static COLLAPSE_BUTTON_ICON_CLASS: string = 'icon-newtab';
    private static PCV_COLLAPSED_KEY: string = 'contentstudio:pcv:collapsed';

    private liveEditPage: LiveEditPageProxy;
    private contextMenu: ItemViewContextMenu;
    private contextMenuItemPath: ComponentPath;

    private responsiveItem: ResponsiveItem;

    private tree: PageComponentsTreeGrid;
    private header: Element;
    private draggable: boolean;
    private dockedParent: Element;
    private toggleButton: Button;

    private beforeInsertActionListeners: (() => void)[] = [];

    private mouseDownListener: (event: MouseEvent) => void;
    private mouseUpListener: (event?: MouseEvent) => void;
    private mouseMoveListener: (event: MouseEvent) => void;
    private clickListener: (event: MouseEvent, data: Slick.Cell) => void;
    private dblClickListener: (event: MouseEvent, data: Slick.Cell) => void;
    private mouseDown: boolean = false;
    public static debug: boolean = false;

    private invalidItemsPaths: ComponentPath[] = [];

    private currentUserHasCreateRights: Boolean;

    private keyBinding: KeyBinding[];

    private beforeActionHandler: (action: Action) => void;

    private afterActionHandler: (action: Action) => void;

    private modifyPermissions: boolean = false;

    private lastSelectedPath: ComponentPath;

    constructor(liveEditPage: LiveEditPageProxy) {
        super('page-components-view');

        this.liveEditPage = liveEditPage;

        this.currentUserHasCreateRights = null;

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();

        this.createTree();

        this.setupListeners();

        this.setModal(false);

        this.initKeyBoardBindings();

        this.bindMouseListeners();
    }

    private initElements(): void {
        this.toggleButton =
            new Button().addClass(`minimize-button ${PageComponentsView.COLLAPSE_BUTTON_ICON_CLASS}`).setTitle(
                i18n('field.hideComponent')) as Button;

        this.toggleButton.onClicked((event: MouseEvent) => {
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
        headerWrapper.appendChildren(this.header, this.toggleButton);
        this.appendChildren(headerWrapper);
    }

    private setupListeners(): void {
        this.onHidden(() => this.hideContextMenu());

        this.onShown(() => {
            if (this.liveEditPage?.isLocked()) {
                this.addClass(PageComponentsView.LOCKED_CLASS);
            }
        });

        this.whenRendered(() => this.initLiveEditEvents());

        PageEventsManager.get().onFragmentLoadError((path: ComponentPath) => {
            this.addToInvalidItems(path);
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

        this.toggleButton.setTitle(this.isCollapsed() ? i18n('field.showComponent') : i18n('field.hideComponent'), false);
    }

    reload(): Q.Promise<void> {
        return this.tree.reload();
    }

    hide(): void {
        super.hide();
        KeyBindings.get().unbindKeys(this.keyBinding);
    }

    private initLock(): void {
        this.unContextMenu(this.lockedViewClickHandler);
        this.unClicked(this.lockedViewClickHandler);

        if (this.liveEditPage.isLocked()) {
            this.addClass(PageComponentsView.LOCKED_CLASS);
        }

        this.onContextMenu(this.lockedViewClickHandler);
        this.onClicked(this.lockedViewClickHandler);
    }

    setModifyPermissions(modifyPermissions: boolean): boolean {
        this.modifyPermissions = modifyPermissions;
        return this.modifyPermissions;
    }

    private initLiveEditEvents() {
        const eventsManager = PageEventsManager.get();

        eventsManager.onComponentLoaded((path: ComponentPath): void => {
            this.tree.reloadItemByPath(path);
        });

        eventsManager.onComponentReset((path: ComponentPath): void => {
            this.tree.resetComponentByPath(path);
            this.removeFromInvalidItems(path);
        });

        eventsManager.onBeforeLoad(() => {
            this.addClass('loading');
        });

        eventsManager.onLoaded(() => {
            this.removeClass('loading');
        });

        eventsManager.onPageLocked(() => {
            this.setLocked(true);
        });

        eventsManager.onPageUnlocked(() => {
            this.setLocked(false);
        });

        PageState.getEvents().onComponentAdded((event: ComponentAddedEvent) => {
            this.addComponent(event.getComponent()).catch(DefaultErrorHandler.handle);
        });

        PageState.getEvents().onComponentRemoved((event: ComponentRemovedEvent) => {
            this.tree.deleteItemByPath(event.getPath());
            this.highlightInvalidItems();
        });

        PageState.getEvents().onComponentUpdated((event: ComponentUpdatedEvent) => {
            this.tree.updateItemByEvent(event);
        });
    }

    private addComponent(component: Component): Q.Promise<boolean> {
        return this.tree.addComponent(component).then((item: ComponentsTreeItem) => {
            return this.tree.expandNodeByDataId(item.getId());
        });
    }

    private handleComponentAdded(event: ComponentAddedEvent): void {
        /*
        if (event.getComponentView().isSelected()) {
            this.tree.selectItemByPath(event.getPath());
        }

        if (this.tree.hasComponentChildren(event.getComponentView().getComponent())) {
            const componentDataId = event.getComponentView().getItemId().toString();

            if (event.isDragged()) {
                this.tree.collapseNodeByDataId(componentDataId);
            } else {
                this.tree.expandNodeByDataId(componentDataId);
            }
        }
        */

        this.constrainToParent();
        this.highlightInvalidItems();
    }

    private createTree(): void {
        this.tree = new PageComponentsTreeGrid();

        this.clickListener = (event: MouseEvent, data: Slick.Cell): void => {
            const elem: ElementHelper = new ElementHelper(event.target as HTMLElement);

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
            if (this.liveEditPage.isLocked()) {
                return;
            }

            const node: TreeNode<ComponentsTreeItem> = this.tree.getGrid().getDataView().getItem(data.row);
            const clickedItem: TreeComponent = node.getData()?.getComponent();
            const type: PageItemType = clickedItem?.getType();

            if (type instanceof TextComponent) {
                this.editTextComponent(this.tree.getNodePath(node));
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

            if (!this.liveEditPage.isLocked()) {
                if (this.isMenuIcon(event.target) && BrowserHelper.isIOS()) {
                    this.showContextMenu(new ElementHelper(rowElement).getSiblingIndex(), {x: event.pageX, y: event.pageY});
                }
            }
        });

        this.tree.getGrid().subscribeOnMouseLeave((event, data) => {
            Highlighter.get().hide();
        });

        this.tree.onSelectionChanged(() => {
            const currentSelection: ComponentsTreeItem[] = this.tree.getCurrentSelection();
            const selectedItem: ComponentsTreeItem = currentSelection[0];

            if (selectedItem) {
                const path: ComponentPath = this.tree.getPathByItem(selectedItem);
                if (!this.lastSelectedPath) { // not spawning event if item was selected as a result of the same event
                    PageNavigationMediator.get().notify(
                        new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(path)), this);
                }

                if (this.contextMenuItemPath && !this.contextMenuItemPath.equals(path)) {
                    this.hideContextMenu();
                }
            } else { // if item was deselected by clicking in the pcv grid then need to deselect it in the live edit
                PageNavigationMediator.get().notify(
                    new PageNavigationEvent(PageNavigationEventType.DESELECT, new PageNavigationEventData()), this);
            }

            this.lastSelectedPath = null;
        });

        this.tree.getGrid().subscribeOnContextMenu((event): void => {
            event.stopPropagation();
            event.preventDefault();

            const cell: Slick.Cell = this.tree.getGrid().getCellFromEvent(event);

            this.showContextMenu(cell.row, {x: event.pageX, y: event.pageY});
        });

        this.tree.onDataChanged((event: DataChangedEvent<ComponentsTreeItem>) => {
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

        this.appendChild(this.tree);
    }

    private highlightInvalidItems(): void {
        this.tree.setInvalid(this.invalidItemsPaths);
    }

    private removeFromInvalidItems(path: ComponentPath): void {
        this.invalidItemsPaths = this.invalidItemsPaths.filter((curr) => {
            return !curr.equals(path);
        });
        this.highlightInvalidItems();
    }

    private addToInvalidItems(path: ComponentPath): void {
        this.invalidItemsPaths.push(path);
        this.highlightInvalidItems();
    }

    private isMenuIcon(element: HTMLElement): boolean {
        return element?.className?.indexOf('menu-icon') > -1;
    }

    private initKeyBoardBindings(): void {
        const removeHandler = () => {
            const itemViewWrapper: ComponentsTreeItem = this.tree.getFirstSelectedItem();


            if (itemViewWrapper) {
                const path: ComponentPath = this.tree.getPathByItem(itemViewWrapper);
                PageEventsManager.get().notifyComponentRemoveRequested(path);
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

        // no need to update position if PCV is docked or undocked but collapsed
        if (!this.draggable || this.isCollapsed()) {
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

    setModal(modal: boolean): PageComponentsView {
        this.toggleClass('modal', modal);
        if (this.tree) {
            // tree may not be yet initialized
            this.tree.getGrid().resizeCanvas();
        }

        return this;
    }

    setLocked(lock: boolean): void {
        this.toggleClass(PageComponentsView.LOCKED_CLASS, lock);
    }

    private lockedViewClickHandler(event: MouseEvent): void {
        const isUnlocked = !(this.liveEditPage.isLocked() && this.modifyPermissions);

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
        const item: ComponentsTreeItem = this.tree.getGrid().getDataView().getItem(row)?.getData();
        this.contextMenuItemPath = item ? this.tree.getPathByItem(item) : null;

        const contextMenuActions: Action[] = this.liveEditPage.isLocked() ?
                                             this.getLockedPageActions() : this.getItemContextMenuActions(item);

        if (!this.contextMenu) {
            this.contextMenu = new ItemViewContextMenu(null, contextMenuActions, false);
            this.contextMenu.onHidden(this.removeMenuOpenStyleFromMenuIcon.bind(this));
        } else {
            this.contextMenu.setActions(contextMenuActions);
        }

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

    private getLockedPageActions(): Action[] {
        const unlockAction = new Action(i18n('live.view.page.customize'));

        unlockAction.onExecuted(() => {
            this.liveEditPage.setLocked(false);
        });

        return [unlockAction];
    }

    private getItemContextMenuActions(item: ComponentsTreeItem): Action[] {
        if (!item || !item.getComponent()) {
            return [];
        }

        const path: ComponentPath = this.tree.getPathByItem(item);
        const page: Page = PageState.getState();
        const pageItem: PageItem = path.isRoot() ? page : page.getComponentByPath(path);

        if (pageItem instanceof Page) {
            return PageActionsHelper.getPageActions();
        }

        if (pageItem instanceof Component) {
            return PageActionsHelper.getComponentActions(pageItem);
        }

        if (pageItem instanceof Region) {
            return PageActionsHelper.getRegionActions(pageItem);
        }

        return [];
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

    onBeforeInsertAction(listener: () => void): void {
        this.beforeInsertActionListeners.push(listener);
    }

    unBeforeInsertAction(listener: () => void): void {
        this.beforeInsertActionListeners = this.beforeInsertActionListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    private notifyBeforeInsertAction(): void {
        this.beforeInsertActionListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private editTextComponent(path: ComponentPath): void {
        this.liveEditPage.editTextComponentByPath(path);
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
        this.toggleClass(PageComponentsView.COLLAPSED_CLASS, true);
        this.toggleButton.setTitle(i18n('field.showComponent'), false);
        this.hideContextMenu();
    }

    private expand(): void {
        localStorage.removeItem(PageComponentsView.PCV_COLLAPSED_KEY);
        this.toggleClass(PageComponentsView.COLLAPSED_CLASS, false);
        this.toggleButton.setTitle(i18n('field.hideComponent'), false);
        this.constrainToParent(); // not letting PCV to overflow the page
        this.tree.getGrid().resizeCanvas();
    }

    handle(event: PageNavigationEvent): void {
        if (event.getType() === PageNavigationEventType.SELECT) {
            this.lastSelectedPath = event.getData().getPath();

            this.tree.selectItemByPath(event.getData().getPath()).then(() => {
                this.tree.scrollToItem(event.getData().getPath());
            }).catch(DefaultErrorHandler.handle);

            return;
        }

        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.tree.deselectAll();
        }
    }
}
