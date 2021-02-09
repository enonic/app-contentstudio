import {Element} from 'lib-admin-ui/dom/Element';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {Body} from 'lib-admin-ui/dom/Body';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';

export class Shader {

    private static CLS_NAME: string = 'shader';

    private target: Element;
    private scrollEnabled: boolean = true;

    private pageShader: Element;
    private northShader: Element;
    private eastShader: Element;
    private southShader: Element;
    private westShader: Element;

    private shaders: Element[];

    private clickListeners: { (event: MouseEvent): void }[] = [];
    private unlockClickedListeners: { (event: MouseEvent): void }[] = [];
    private mouseEnterListeners: { (event: MouseEvent): void }[] = [];
    private mouseLeaveListeners: { (event: MouseEvent): void }[] = [];
    private mouseMoveListeners: { (event: MouseEvent): void }[] = [];

    private static INSTANCE: Shader;

    private static debug: boolean = false;

    constructor() {
        this.pageShader = this.createShaderDiv('page');
        this.northShader = this.createShaderDiv('north');
        this.eastShader = this.createShaderDiv('east');
        this.southShader = this.createShaderDiv('south');
        this.westShader = this.createShaderDiv('west');

        this.shaders = [this.pageShader, this.northShader, this.eastShader, this.southShader, this.westShader];

        let body = Body.get();
        body.appendChildren.apply(body, this.shaders);
        body.onMouseWheel((event: MouseEvent) => {
            if (this.target && this.isVisible()) {
                if (Shader.debug) {
                    console.log('Shader.onMouseWheel, scroll enabled = ' + this.scrollEnabled);
                }
                if (!this.scrollEnabled) {
                    // swallow event to prevent scrolling
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // give the page some time to reflect scroll
                    setTimeout(() => this.resizeToElement(this.target), 5);
                }
            }
        });

        this.shaders.forEach((shader: Element) => {
            shader.onClicked((event: MouseEvent) => this.handleClick(event));
            shader.onContextMenu((event: MouseEvent) => this.handleClick(event));
            shader.onMouseEnter((event: MouseEvent) => this.notifyMouseEntered(event));
            shader.onMouseLeave((event: MouseEvent) => this.notifyMouseLeft(event));
            shader.onMouseMove((event: MouseEvent) => this.notifyMouseMove(event));
        });
    }

    private createShaderDiv(cls: string): DivEl {
        return new DivEl(Shader.CLS_NAME + ' ' + cls, StyleHelper.getCurrentPrefix());
    }

    public static get(): Shader {
        if (!Shader.INSTANCE) {
            Shader.INSTANCE = new Shader();
        }
        return Shader.INSTANCE;
    }

    public setScrollEnabled(enabled: boolean): Shader {
        this.scrollEnabled = enabled;
        return this;
    }

    shade(element: Element): void {
        if (!element) {
            this.hide();
            return;
        }

        if (ClassHelper.getClassName(element) === 'PageView') {
            this.resizeToPage();
        } else {
            this.resizeToElement(element);
        }
    }

    hide(): void {
        this.target = undefined;
        this.shaders.forEach((shader: Element) => shader.hide());
    }

    isVisible(): boolean {
        return this.shaders.some((shader: Element) => shader.isVisible());
    }

    onUnlockClicked(listener: (event: MouseEvent) => void) {
        this.unlockClickedListeners.push(listener);
    }

    unUnlockClicked(listener: (event: MouseEvent) => void) {
        this.unlockClickedListeners = this.unlockClickedListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    onMouseEnter(listener: (event: MouseEvent) => void) {
        this.mouseEnterListeners.push(listener);
    }

    unMouseEnter(listener: (event: MouseEvent) => void) {
        this.mouseEnterListeners = this.mouseEnterListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyMouseEntered(event: MouseEvent) {
        this.mouseEnterListeners.forEach((listener) => {
            listener(event);
        });
    }

    onMouseLeave(listener: (event: MouseEvent) => void) {
        this.mouseLeaveListeners.push(listener);
    }

    unMouseLeave(listener: (event: MouseEvent) => void) {
        this.mouseLeaveListeners = this.mouseLeaveListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyMouseLeft(event: MouseEvent) {
        this.mouseLeaveListeners.forEach((listener) => {
            listener(event);
        });
    }

    onMouseMove(listener: (event: MouseEvent) => void) {
        this.mouseMoveListeners.push(listener);
    }

    unMouseMove(listener: (event: MouseEvent) => void) {
        this.mouseMoveListeners = this.mouseMoveListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyMouseMove(event: MouseEvent) {
        this.mouseMoveListeners.forEach((listener) => {
            listener(event);
        });
    }

    onClicked(listener: (event: MouseEvent) => void) {
        this.clickListeners.push(listener);
    }

    unClicked(listener: (event: MouseEvent) => void) {
        this.clickListeners = this.clickListeners.filter((curr) => {
            return listener !== curr;
        });
    }

    private notifyClicked(event: MouseEvent) {
        this.clickListeners.forEach((listener) => {
            listener(event);
        });
    }

    private handleClick(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        this.notifyClicked(event);
    }

    private showShaderIfNecessary(shader: Element, x: number, y: number, width: number, height: number) {
        let shaderEl = shader.getEl();
        shaderEl.setTopPx(y).setLeftPx(x).setWidthPx(width).setHeightPx(height);
        // show only shaders having both width and height
        shader.setVisible(width > 0 && height > 0);
    }

    private resizeToPage(): void {
        if (Shader.debug) {
            console.log('Shader.resizeToPage');
        }
        this.target = undefined;
        this.pageShader.getEl().setTopPx(0).setRightPx(0).setBottomPx(0).setLeftPx(0);
        this.pageShader.show();
    }

    private resizeToElement(element: Element): void {

        this.target = element;

        let win = WindowDOM.get();
        let bodyEl = Body.get().getEl();
        // check if body is bigger than window to account for scroll
        let documentWidth = Math.max(win.getWidth(), bodyEl.getWidth());
        let documentHeight = Math.max(win.getHeight(), bodyEl.getHeight());

        let dimensions = element.getEl().getDimensions();
        let x1 = Math.max(0, dimensions.left);
        let y1 = Math.max(0, dimensions.top);
        let x2 = Math.min(documentWidth, dimensions.left + dimensions.width);
        let y2 = Math.min(documentHeight, dimensions.top + dimensions.height);

        if (Shader.debug) {
            console.log('Shader.resizeToElement(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ')', element);
        }

        this.showShaderIfNecessary(this.northShader, 0, 0, documentWidth, y1);
        this.showShaderIfNecessary(this.eastShader, x2, y1, documentWidth - x2, y2 - y1);
        this.showShaderIfNecessary(this.southShader, 0, y2, documentWidth, documentHeight - y2);
        this.showShaderIfNecessary(this.westShader, 0, y1, x1, y2 - y1);
    }
}
