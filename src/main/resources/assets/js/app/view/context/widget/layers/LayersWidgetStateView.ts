export abstract class LayersWidgetStateView
    extends api.dom.DivEl {

    protected header: api.dom.Element;

    protected subHeader: api.dom.Element;

    protected button: api.ui.button.ActionButton;

    protected constructor(className: string) {
        super(className);

        this.initElements();
    }

    protected initElements() {
        this.header = new api.dom.H6El('header');
        this.header.setHtml(this.getHeaderText());
        this.subHeader = new api.dom.SpanEl('sub-header');
        this.subHeader.setHtml(this.getSubHeaderText());
        this.button = new api.ui.button.ActionButton(this.getAction());
    }

    doRender(): Q.Promise<boolean> {
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
