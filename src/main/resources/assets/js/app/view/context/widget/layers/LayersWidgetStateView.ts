import H6El = api.dom.H6El;
import SpanEl = api.dom.SpanEl;
import ActionButton = api.ui.button.ActionButton;
import DivEl = api.dom.DivEl;

export abstract class LayersWidgetStateView
    extends DivEl {

    protected header: H6El;

    protected subHeader: SpanEl;

    protected button: ActionButton;

    protected constructor(className: string) {
        super('layers-widget-state-view '+ className);

        this.initElements();
    }

    protected initElements() {
        this.header = new H6El('header');
        this.header.setHtml(this.getHeaderText());
        this.subHeader = new SpanEl('sub-header');
        this.subHeader.setHtml(this.getSubHeaderText());
        this.button = new ActionButton(this.getAction());
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.doAppendChildren();

            return rendered;
        });
    }

    protected doAppendChildren() {
        this.appendChild(this.header);
        this.appendChild(this.subHeader);
        this.appendChild(this.button);
    }

    protected getHeaderText(): string {
        return '';
    }

    protected getSubHeaderText(): string {
        return '';
    }

    protected abstract getAction(): api.ui.Action;

}
