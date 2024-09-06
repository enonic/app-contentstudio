import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {DragHelper} from '@enonic/lib-admin-ui/ui/DragHelper';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {ResponsiveRanges} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveRanges';
import {DataChangedEvent, DataChangedType} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ClickPosition} from '../../page-editor/ClickPosition';
import {Highlighter} from '../../page-editor/Highlighter';
import {ItemViewContextMenu} from '../../page-editor/ItemViewContextMenu';
import {PageViewController} from '../../page-editor/PageViewController';
import {Page} from '../page/Page';
import {Component} from '../page/region/Component';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageItem} from '../page/region/PageItem';
import {Region} from '../page/region/Region';
import {TextComponentType} from '../page/region/TextComponentType';
import {SaveAsTemplateAction} from './action/SaveAsTemplateAction';
import {ComponentsTreeItem} from './ComponentsTreeItem';
import {LiveEditPageProxy} from './page/LiveEditPageProxy';
import {PageState} from './page/PageState';
import {PageActionsHelper} from './PageActionsHelper';
import {PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {PageEventsManager} from './PageEventsManager';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventData} from './PageNavigationEventData';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationHandler} from './PageNavigationHandler';
import {PageNavigationMediator} from './PageNavigationMediator';
import {TreeComponent} from './TreeComponent';

enum Modifiers {
    LOCKED = 'locked',
    COLLAPSED = 'collapsed',
    ANIMATING = 'animating',
}
export class PageComponentsView
    extends DivEl
    implements PageNavigationHandler {

    private static PCV_COLLAPSED_KEY: string = 'contentstudio:pcv:collapsed';

    private liveEditPage: LiveEditPageProxy;
    private contextMenu: ItemViewContextMenu;
    private contextMenuItemPath: ComponentPath;

    private tree: PageComponentsTreeGrid;
    private header: Element;
    private draggable: boolean;
    private dockedParent: Element;
    private toggleButton: Button;
    private isUndocked: boolean;

    private mouseDownListener: (event: MouseEvent) => void;
    private mouseUpListener: (event?: MouseEvent) => void;
    private mouseMoveListener: (event: MouseEvent) => void;
    private clickListener: (event: MouseEvent, data: Slick.Cell) => void;
    private dblClickListener: (event: MouseEvent, data: Slick.Cell) => void;
    private mouseDown: boolean = false;
    public static debug: boolean = false;

    private keyBinding: KeyBinding[];

    private beforeActionHandler: (action: Action) => void;

    private afterActionHandler: (action: Action) => void;

    private lastSelectedPath: ComponentPath;

    private isToBeEnabled: boolean;

    private animationTimeout: number;

    constructor(liveEditPage: LiveEditPageProxy) {
        super('page-components-view');

        this.liveEditPage = liveEditPage;

        PageNavigationMediator.get().addPageNavigationHandler(this);

        this.initElements();

        this.createTree();

        this.setupListeners();

        this.setModal(false);

        this.initKeyBoardBindings();
    }

    private initElements(): void {
        this.toggleButton = new Button().addClass('minimize-button icon-newtab').setTitle(i18n('field.hideComponent')) as Button;

        this.toggleButton.onClicked((event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            this.toggleCollapsedState();
        });

        this.header = new DivEl('header');
        this.header.setHtml(i18n('field.components'));

        ResponsiveManager.onAvailableSizeChanged(Body.get(), (item: ResponsiveItem) => {
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
                this.addClass(Modifiers.LOCKED);
            }
        });

        this.whenRendered(() => this.initLiveEditEvents());
    }

    show(): void {
        KeyBindings.get().bindKeys(this.keyBinding);
        super.show();

        if (this.tree) {
            this.tree.getGrid().resizeCanvas();
        }
    }

    dock(): void {
        this.isUndocked = false;
        this.setDraggable(false);
        this.dockedParent?.appendChild(this);
    }

    undock(): void {
        this.isUndocked = true;
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

    setEnabled(enabled: boolean): void {
        this.isToBeEnabled = enabled;

        if (enabled) {
            if (!this.liveEditPage.isLocked()) {
                this.setLocked(false);
            }
        } else {
            this.setLocked(true);
        }
    }

    private initLiveEditEvents() {
        const eventsManager = PageEventsManager.get();

        eventsManager.onBeforeLoad(() => {
            this.addClass('loading');
        });

        eventsManager.onLoaded(() => {
            this.removeClass('loading');

            if (this.isToBeEnabled && !this.liveEditPage.isLocked()) {
                this.setLocked(false);
            }
        });

        eventsManager.onPageLocked(() => {
            this.setLocked(true);
        });

        eventsManager.onPageUnlocked(() => {
            this.setLocked(false);
        });
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

            if (clickedItem?.getType() instanceof TextComponentType) {
                const path: ComponentPath = this.tree.getNodePath(node);

                if (path) {
                    PageEventsManager.get().notifyTextComponentEditRequested(path);
                }
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
        this.toggleClass(Modifiers.LOCKED, lock);
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
            this.beforeActionHandler = () => {
                PageViewController.get().setContextMenuDisabled(true);
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
            return PageActionsHelper.getTopLevelItemActions(pageItem);
        }

        if (pageItem instanceof Component) {
            return PageActionsHelper.getComponentActions(pageItem, item.isInvalid());
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

    getEl(): ElementHelper {
        return super.getEl();
    }

    private toggleCollapsedState(): void {
        if (this.isCollapsed()) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    private isCollapsed(): boolean {
        return this.hasClass(Modifiers.COLLAPSED);
    }

    private collapse(): void {
        localStorage.setItem(PageComponentsView.PCV_COLLAPSED_KEY, 'true');
        clearTimeout(this.animationTimeout);

        this.addClass(Modifiers.COLLAPSED);
        this.addClass(Modifiers.ANIMATING);

        this.toggleButton.setTitle(i18n('field.showComponent'), false);

        this.hideContextMenu();

        this.animationTimeout = setTimeout(() => {
            this.removeClass(Modifiers.ANIMATING);
        }, 300);
    }

    private expand(): void {
        localStorage.removeItem(PageComponentsView.PCV_COLLAPSED_KEY);
        clearTimeout(this.animationTimeout);

        this.removeClass(Modifiers.COLLAPSED);
        this.addClass(Modifiers.ANIMATING);

        this.toggleButton.setTitle(i18n('field.hideComponent'), false);

        this.animationTimeout = setTimeout(() => {
            this.removeClass(Modifiers.ANIMATING);
            this.constrainToParent(); // not letting PCV to overflow the page
            this.tree.getGrid().resizeCanvas();
        }, 300);
    }

    handle(event: PageNavigationEvent): void {
        if (!PageState.getState()) { // no tree, event was triggered when clicking on the template generated page
            this.lastSelectedPath = null;
            return;
        }

        if (event.getType() === PageNavigationEventType.SELECT) {
            const path: ComponentPath = event.getData().getPath();
            this.lastSelectedPath = this.tree.isItemSelected(path) ? null : path;
            this.tree.selectItemByPath(path).then(() => {
                if (this.isUndocked && !this.isCollapsed()) {
                    this.tree.scrollToItem(path);
                }
            }).catch(DefaultErrorHandler.handle);

            return;
        }

        if (event.getType() === PageNavigationEventType.DESELECT) {
            this.tree.deselectAll();
        }
    }
}
