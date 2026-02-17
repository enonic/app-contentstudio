import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {type ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TreeContextMenu} from '@enonic/lib-admin-ui/ui/menu/TreeContextMenu';

export enum ItemViewContextMenuOrientation {
    UP,
    DOWN
}

interface Coordinates {
    x: number;
    y: number;
}

export class ItemViewContextMenu
    extends DivEl {

    private title: ItemViewContextMenuTitle;

    private menu: TreeContextMenu;

    private arrow: ItemViewContextMenuArrow;

    private orientation: ItemViewContextMenuOrientation = ItemViewContextMenuOrientation.DOWN;

    private orientationListeners: ((orientation: ItemViewContextMenuOrientation) => void)[] = [];

    private outsideClickListener: (event: MouseEvent) => void;

    constructor(title: ItemViewContextMenuTitle, actions: Action[], showArrow: boolean = true) {
        super('menu item-view-context-menu');

        if (showArrow) {
            this.createArrow();
        }

        this.createTitle(title);

        this.createMenu(actions);

        this.initListeners();

        Body.get().appendChild(this);
    }

    createArrow() {
        this.arrow = new ItemViewContextMenuArrow();
        this.appendChild(this.arrow);
    }

    createTitle(title: ItemViewContextMenuTitle) {
        this.title = title;

        if (this.title) {
            let lastPosition: Coordinates;

            const dragListener = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                const x = e.pageX;
                const y = e.pageY;

                this.moveBy(x - lastPosition.x, y - lastPosition.y);
                lastPosition = {x, y};
            };

            const upListener = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                this.stopDrag(dragListener, upListener);
            };

            this.title.onMouseDown((e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                lastPosition = {
                    x: e.pageX,
                    y: e.pageY
                };

                this.startDrag(dragListener, upListener);
            });

            this.onHidden(() => {
                // stop drag if the element was hidden while dragging
                this.stopDrag(dragListener, upListener);
            });

            this.appendChild(this.title);
        }
    }

    createMenu(actions: Action[]) {
        this.menu = new TreeContextMenu(actions, false);

        this.menu.onItemClicked(() => {
            this.hide();
        });

        this.menu.onItemExpanded((heightChange: number) => {
            const isDown = this.orientation === ItemViewContextMenuOrientation.DOWN;
            const el = this.getEl();
            const arrowHeight = this.arrow ? this.arrow.getHeight() : 0;

            // Cursor is positioned 1px above/below the menu
            const y = isDown ?
                      (el.getTopPx() - arrowHeight - 1) :
                      (el.getTopPx() + el.getHeightWithBorder() - heightChange + arrowHeight + 1);
            const x = el.getLeftPx() + el.getWidth() / 2;

            this.showAt(x, y, false, true);
        });

        this.appendChild(this.menu);
    }

    initListeners() {
        this.onClicked((e: MouseEvent) => {
            // menu itself was clicked so do nothing
            e.stopPropagation();
            e.preventDefault();
        });

        this.outsideClickListener = (event: MouseEvent) => {
            if (!this.getEl().contains(event.target as HTMLElement)) {
                // click outside menu
                this.hide();
            }
        };
    }

    showAt(x: number, y: number, notClicked: boolean = false, keepOrientation: boolean = false) {
        this.menu.showAt.call(this, this.restrainX(x), this.restrainY(y, notClicked, keepOrientation));
        Body.get().onClicked(this.outsideClickListener);
    }

    show(): void {
        super.show();
        Body.get()?.onClicked(this.outsideClickListener);
    }

    hide(): void {
        super.hide();
        Body.get()?.unClicked(this.outsideClickListener);
    }

    moveBy(dx: number, dy: number) {
        this.menu.moveBy.call(this, dx, dy);
    }

    setActions(actions: Action[]) {
        this.menu.setActions(actions);
    }

    getMenu(): TreeContextMenu {
        return this.menu;
    }

    private setOrientation(orientation: ItemViewContextMenuOrientation) {
        if (this.orientation !== orientation) {
            this.orientation = orientation;
            if (this.arrow) {
                this.arrow.toggleVerticalPosition(orientation === ItemViewContextMenuOrientation.DOWN);
            }
            this.notifyOrientationChanged(orientation);
        }
    }

    private notifyOrientationChanged(orientation: ItemViewContextMenuOrientation) {
        this.orientationListeners.forEach((listener) => {
            listener(orientation);
        });
    }

    onOrientationChanged(listener: (orientation: ItemViewContextMenuOrientation) => void) {
        this.orientationListeners.push(listener);
    }

    unOrientationChanged(listener: (orientation: ItemViewContextMenuOrientation) => void) {
        this.orientationListeners = this.orientationListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private startDrag(dragListener: (e: MouseEvent) => void, upListener: (e: MouseEvent) => void) {
        Body.get()?.onMouseMove(dragListener);
        Body.get()?.onMouseUp(upListener);
    }

    private stopDrag(dragListener: (e: MouseEvent) => void, upListener: (e: MouseEvent) => void) {
        Body.get()?.unMouseMove(dragListener);
        Body.get()?.unMouseUp(upListener);
    }

    private restrainX(x: number): number {
        const parentEl = this.getParentElement().getEl();

        const width = this.getEl().getWidth();
        const halfWidth = width / 2;
        const arrowHalfWidth = this.arrow ? this.arrow.getWidth() / 2 : 0;
        const desiredX = x - halfWidth;
        let resultX = desiredX;
        let deltaX;
        let arrowPos;
        const minX = parentEl.getMarginLeft();
        const maxX = parentEl.getWidthWithMargin() - parentEl.getMarginRight() - width;

        if (desiredX < minX) {
            deltaX = minX - desiredX;
            arrowPos = Math.max(arrowHalfWidth, halfWidth - deltaX);
            resultX = minX;
        }
        if (desiredX > maxX) {
            deltaX = maxX - desiredX;
            arrowPos = Math.min(halfWidth - deltaX, width - arrowHalfWidth);
            resultX = maxX;
        }
        if (this.arrow && arrowPos) {
            this.arrow.getEl().setLeftPx(arrowPos);
        }
        return resultX;
    }

    private restrainY(y: number, notClicked?: boolean, keepOrientation?: boolean): number {
        let orientation = keepOrientation ? this.orientation : ItemViewContextMenuOrientation.DOWN;
        const arrowHeight = this.arrow ? this.arrow.getHeight() : 0;
        const height = this.getEl().getHeight();
        const minY = 0;
        let maxY;
        let desiredY;

        if (notClicked) {
            maxY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        } else {
            maxY = Math.max(document.body.scrollTop, document.documentElement.scrollTop) + window.innerHeight;
        }

        if (orientation === ItemViewContextMenuOrientation.DOWN) {
            // account for arrow
            desiredY = y + arrowHeight + (notClicked ? 0 : 1);
            if (desiredY + height > maxY) {
                orientation = ItemViewContextMenuOrientation.UP;
            }
        }
        if (orientation === ItemViewContextMenuOrientation.UP) {
            // subtract my full height to display above target
            desiredY = y - arrowHeight - height - (notClicked ? 0 : 1);
            if (desiredY < minY) {
                orientation = ItemViewContextMenuOrientation.DOWN;
            }
        }
        this.setOrientation(orientation);
        return desiredY;
    }

}

export class ItemViewContextMenuArrow
    extends DivEl {
    private static clsBottom: string = 'bottom';
    private static clsTop: string = 'top';
    private static clsLeft: string = 'left';
    private static clsRight: string = 'right';

    constructor() {
        super('item-view-context-menu-arrow ' + ItemViewContextMenuArrow.clsBottom);
    }

    toggleVerticalPosition(bottom: boolean) {
        this.toggleClass(ItemViewContextMenuArrow.clsBottom, bottom);
        this.toggleClass(ItemViewContextMenuArrow.clsTop, !bottom);
    }

    getWidth(): number {
        if (this.hasClass(ItemViewContextMenuArrow.clsTop) || this.hasClass(ItemViewContextMenuArrow.clsBottom)) {
            return 14;
        } else if (this.hasClass(ItemViewContextMenuArrow.clsLeft) || this.hasClass(ItemViewContextMenuArrow.clsRight)) {
            return 7;
        }
    }

    getHeight(): number {
        if (this.hasClass(ItemViewContextMenuArrow.clsTop) || this.hasClass(ItemViewContextMenuArrow.clsBottom)) {
            return 7;
        } else if (this.hasClass(ItemViewContextMenuArrow.clsLeft) || this.hasClass(ItemViewContextMenuArrow.clsRight)) {
            return 14;
        }
    }
}
