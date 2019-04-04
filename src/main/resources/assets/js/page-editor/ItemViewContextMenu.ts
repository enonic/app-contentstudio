import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import Action = api.ui.Action;

export enum ItemViewContextMenuOrientation {
    UP,
    DOWN
}

export interface Coordinates {
    x: number;
    y: number;
}

export interface TargetSize {
    width: number;
    height?: number;
}

export interface ShowAtOptions {
    notClicked?: boolean;
    keepOrientation?: boolean;
    targetSize?: TargetSize;
}

export class ItemViewContextMenu
    extends api.dom.DivEl {

    private title: ItemViewContextMenuTitle;

    private menu: api.ui.menu.TreeContextMenu;

    private arrow: ItemViewContextMenuArrow;

    private orientation: ItemViewContextMenuOrientation = ItemViewContextMenuOrientation.DOWN;

    private orientationListeners: { (orientation: ItemViewContextMenuOrientation): void }[] = [];

    private notClicked: boolean = false;

    private keepOrientation: boolean = false;

    private targetSize: TargetSize;

    private position: Coordinates;

    constructor(title: ItemViewContextMenuTitle, actions: Action[], showArrow: boolean = true) {
        super('menu item-view-context-menu');

        if (showArrow) {
            this.createArrow();
        }

        this.createTitle(title);

        this.createMenu(actions);

        this.initListeners();

        api.dom.Body.get().appendChild(this);
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
        this.menu = new api.ui.menu.TreeContextMenu(actions, false);

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

            this.showAt(x, y, {keepOrientation: true});
        });

        this.appendChild(this.menu);
    }

    initListeners() {
        this.onClicked((e: MouseEvent) => {
            // menu itself was clicked so do nothing
            e.preventDefault();
            e.stopPropagation();
        });
    }

    showAt(x: number, y: number, options: ShowAtOptions = {}) {
        const {notClicked = false, keepOrientation = false, targetSize} = options;

        this.notClicked = notClicked;
        this.keepOrientation = keepOrientation;

        const restrained: Coordinates = {
            x: this.restrainX(x),
            y: this.restrainY(y, notClicked, keepOrientation)
        };

        this.position = {
            x: this.calcPositionX(restrained.x),
            y: this.calcPositionY(restrained.y)
        };

        if (ItemViewContextMenu.isValidTargetSize(targetSize)) {
            this.targetSize = targetSize;
        }

        this.menu.showAt.call(this, restrained.x, restrained.y);
    }

    static isValidTargetSize(targetSize: TargetSize) {
        return !!targetSize &&
               // Restore next line, if the track of the vertical position will be tracked
               // targetSize.height != null && !isNaN(targetSize.height) &&
               targetSize.width != null && !isNaN(targetSize.width);
    }

    updatePosition(width: number, height: number) {
        const targetSize: TargetSize = {width, height};

        if (ItemViewContextMenu.isValidTargetSize(targetSize)) {
            const fx = width / this.targetSize.width;
            // const fy = height / this.targetSize.height;

            const {x, y} = this.position;

            const options = {
                notClicked: this.notClicked,
                keepOrientation: this.keepOrientation,
                targetSize
            };

            // this.showAt(x * fx, y * fy, options);
            this.showAt(x * fx, y, options);
        }
    }

    moveBy(dx: number, dy: number) {
        this.menu.moveBy.call(this, dx, dy);
    }

    setActions(actions: api.ui.Action[]) {
        this.menu.setActions(actions);
    }

    getMenu(): api.ui.menu.TreeContextMenu {
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
        api.dom.Body.get().onMouseMove(dragListener);
        api.dom.Body.get().onMouseUp(upListener);
    }

    private stopDrag(dragListener: (e: MouseEvent) => void, upListener: (e: MouseEvent) => void) {
        api.dom.Body.get().unMouseMove(dragListener);
        api.dom.Body.get().unMouseUp(upListener);
    }

    private restrainX(x: number): number {
        const parentEl = this.getParentElement().getEl();

        const width = this.getEl().getWidth();
        const halfWidth = width / 2;
        const arrowHalfWidth = this.arrow ? this.arrow.getWidth() / 2 : 0;
        const desiredX = x - halfWidth;
        const minX = parentEl.getMarginLeft();
        const maxX = parentEl.getWidthWithMargin() - parentEl.getMarginRight() - width;

        let resultX = desiredX;
        let deltaX;
        let arrowPos;

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
        if (!arrowPos) {
            arrowPos = halfWidth;
        }
        if (this.arrow) {
            this.arrow.getEl().setLeftPx(arrowPos || halfWidth);
        }
        return resultX;
    }

    private calcPositionX(restrainedX: number) {
        const halfWidth = this.getEl().getWidth() / 2;
        return restrainedX + halfWidth;
    }

    private calcPositionY(restrainedY: number) {
        const arrowHeight = this.arrow ? this.arrow.getHeight() : 0;
        const height = this.getEl().getHeight();

        if (this.orientation === ItemViewContextMenuOrientation.DOWN) {
            return restrainedY - arrowHeight - (this.notClicked ? 0 : 1);
        } else { // (this.orientation === ItemViewContextMenuOrientation.UP)
            return restrainedY + arrowHeight + height + (this.notClicked ? 0 : 1);
        }
    }

    private restrainY(y: number, notClicked?: boolean, keepOrientation?: boolean): number {
        let orientation = keepOrientation ? this.orientation : ItemViewContextMenuOrientation.DOWN;
        let arrowHeight = this.arrow ? this.arrow.getHeight() : 0;
        let height = this.getEl().getHeight();
        let minY = 0;
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
    extends api.dom.DivEl {
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
