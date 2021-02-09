import {Element, ElementFromHelperBuilder} from 'lib-admin-ui/dom/Element';
import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ElementDimensions, ItemView} from './ItemView';
import {HighlighterStyle} from './ItemTypeConfig';
import {Body} from 'lib-admin-ui/dom/Body';

export enum HighlighterMode {
    RECTANGLE,
    CROSSHAIR
}

export class Highlighter
    extends Element {

    private rectangle: Element;

    private path: Element;

    private static INSTANCE: Highlighter;

    private lastHighlightedItemView: ItemView;

    private mode: HighlighterMode;

    constructor(type?: HighlighterMode) {
        // Needs to be a SVG element as the css has pointer-events:none
        // CSS pointer-events only works for SVG in IE
        let svgCls = StyleHelper.getCls('highlighter');
        let html = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" class="${svgCls}" style="top:-5000px;left:-5000px">
                        <rect width="150" height="150"/>
                        <path d=""/>
                    </svg>`;

        super(ElementFromHelperBuilder.fromString(html));

        this.setMode(type || HighlighterMode.RECTANGLE);

        this.rectangle = this.getChildren()[0];
        this.path = this.getChildren()[1];

        Body.get().appendChild(this);
    }

    public static get(): Highlighter {
        if (!Highlighter.INSTANCE) {
            Highlighter.INSTANCE = new Highlighter();
        }
        return Highlighter.INSTANCE;
    }

    highlightItemView(itemView: ItemView): void {
        if (!itemView) {
            this.hide();
            return;
        }
        let dimensions = itemView.getEl().getDimensions();
        let style = itemView.getType().getConfig().getHighlighterStyle();

        this.resize(dimensions, this.preProcessStyle(style, itemView.isEmpty()));
        this.show();

        this.lastHighlightedItemView = itemView;
    }

    highlightElement(dimensions: ElementDimensions, style: HighlighterStyle): void {
        this.resize(dimensions, style);
        this.show();
    }

    updateLastHighlightedItemView() {
        this.highlightItemView(this.lastHighlightedItemView);
    }

    setMode(mode: HighlighterMode): Highlighter {
        if (this.mode != null) {
            this.getEl().removeClass(HighlighterMode[this.mode].toLowerCase());
        }
        this.mode = mode;
        if (mode != null) {
            this.getEl().addClass(HighlighterMode[mode].toLowerCase());
        }
        return this;
    }

    isViewInsideSelectedContainer(itemView: ItemView): boolean {
        if (!this.lastHighlightedItemView) {
            return false;
        }

        return this.lastHighlightedItemView.isContainer() &&
               itemView.isChildOfItemView(this.lastHighlightedItemView);
    }

    getSelectedView(): ItemView {
        return this.lastHighlightedItemView;
    }

    unselect() {
        this.hide();
        this.lastHighlightedItemView = null;
    }

    protected preProcessStyle(style: HighlighterStyle, isEmptyView: boolean): HighlighterStyle {
        return {
            stroke: 'rgba(0, 0, 0, 1)',
            strokeDasharray: style.strokeDasharray,
            fill: 'transparent'
        };
    }

    private resize(dimensions: ElementDimensions, style: HighlighterStyle): void {
        let w = Math.round(dimensions.width);
        let h = Math.round(dimensions.height);
        let strokeW;
        let top = Math.round(dimensions.top);
        let left = Math.round(dimensions.left);

        switch (this.mode) {
        case HighlighterMode.RECTANGLE:
            this.rectangle.getEl()
                .setAttribute('width', w + '')
                .setAttribute('height', h + '')
                .setStroke(style.stroke)
                .setStrokeDasharray(style.strokeDasharray)
                .setFill(style.fill);

            this.getEl().setWidthPx(w).setHeightPx(h).setTopPx(top).setLeftPx(left);
            break;
        case HighlighterMode.CROSSHAIR:
            let bodyEl = Body.get().getEl();
            let screenH = bodyEl.getHeight();
            let screenW = bodyEl.getWidth();

            strokeW = parseInt(window.getComputedStyle(this.path.getHTMLElement(), null).getPropertyValue('stroke-width'), 10);

            this.path.getEl()
                .setAttribute('d',
                    this.generatePath(strokeW / 2, top + strokeW / 2,
                        w - strokeW, h - strokeW,
                        screenW - strokeW, screenH - strokeW, left))
                .setStroke(style.stroke)
                .setStrokeDasharray(style.strokeDasharray)
                .setFill('transparent');

            this.rectangle.getEl()
                .setAttribute('width', w + '')
                .setAttribute('height', h + '')
                .setAttribute('x', '0')
                .setAttribute('y', top + '')
                .setStroke(style.stroke)
                .setFill(style.fill);

            this.getEl().setWidthPx(screenW).setHeightPx(screenH).setTopPx(0).setLeftPx(left);
            break;
        }
    }

    private generatePath(x: number, y: number, w: number, h: number, screenW: number, screenH: number, left: number): string {
        return `M ${x} 0 v ${screenH} m ${w} 0 v -${screenH} M ${screenW + left} ${y} h -${screenW + 2 * left} m 0 ${h} h ${screenW +
                                                                                                                            2 * left}`;
    }

}
