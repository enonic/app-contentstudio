import i18n = api.util.i18n;
import SpanEl = api.dom.SpanEl;

export class PublishIssuesStateBar
    extends api.dom.DivEl {

    private containsInvalidElement: api.dom.Element;

    private containsInProgressElement: api.dom.Element;

    private containsNotPublishableElement: api.dom.Element;

    private loadFailedElement: api.dom.Element;

    constructor() {
        super('publish-dialog-issues');

        this.createContainsInvalidElement();
        this.createContainsInProgressElement();
        this.createContainsNotPublishableElement();
        this.createLoadFailedElement();
    }

    private createContainsInvalidElement() {
        this.containsInvalidElement = new api.dom.H6El('invalid');
        const span1: SpanEl = new SpanEl('invalid-part1').setHtml(i18n('dialog.publish.invalidError.part1'));
        const span2: SpanEl = new SpanEl('invalid-part2').setHtml(i18n('dialog.publish.invalidError.part2'));
        this.containsInvalidElement.appendChildren(span1, span2);
    }

    private createContainsInProgressElement() {
        this.containsInProgressElement = new api.dom.H6El('in-progress');
        const span1: SpanEl = new SpanEl('in-progress-part1').setHtml(i18n('dialog.publish.in-progress.part1'));
        const span2: SpanEl = new SpanEl('in-progress-part2').setHtml(i18n('dialog.publish.in-progress.part2'));
        this.containsInProgressElement.appendChildren(span1, span2);
    }

    private createContainsNotPublishableElement() {
        this.containsNotPublishableElement = new api.dom.H6El('not-publishable');
        const span: SpanEl = new SpanEl().setHtml(i18n('dialog.publish.notPublishable'));
        this.containsNotPublishableElement.appendChildren(span);
    }

    private createLoadFailedElement() {
        this.loadFailedElement = new api.dom.H6El('load-failed').setHtml(i18n('dialog.publish.error.loadFailed'));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.reset();
            this.appendChildren(
                this.containsInProgressElement,
                this.containsInvalidElement,
                this.containsNotPublishableElement,
                this.loadFailedElement
            );

            return rendered;
        });
    }

    showContainsInvalid() {
        this.containsInvalidElement.show();
    }

    showContainsInProgress() {
        this.containsInProgressElement.show();
    }

    showContainsNotPublishable() {
        this.containsNotPublishableElement.show();
    }

    showLoadFailed() {
        this.loadFailedElement.show();
    }

    reset() {
        this.containsInvalidElement.hide();
        this.containsInProgressElement.hide();
        this.containsNotPublishableElement.hide();
        this.loadFailedElement.hide();
    }
}
