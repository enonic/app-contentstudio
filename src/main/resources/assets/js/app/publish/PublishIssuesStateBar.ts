import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {H6El} from 'lib-admin-ui/dom/H6El';

export class PublishIssuesStateBar
    extends DivEl {

    private containsInvalidElement: Element;

    private containsInProgressElement: Element;

    private containsNotPublishableElement: Element;

    private loadFailedElement: Element;

    constructor() {
        super('publish-dialog-issues');

        this.createContainsInvalidElement();
        this.createContainsInProgressElement();
        this.createContainsNotPublishableElement();
        this.createLoadFailedElement();
    }

    private createContainsInvalidElement() {
        this.containsInvalidElement = new H6El('state-line');
        const icon: DivEl = new DivEl('state-icon invalid');
        const span1: SpanEl = new SpanEl('part1').setHtml(i18n('dialog.publish.invalidError.part1'));
        const span2: SpanEl = new SpanEl('part2').setHtml(i18n('dialog.publish.invalidError.part2'));
        this.containsInvalidElement.appendChildren(icon, span1, span2);
    }

    private createContainsInProgressElement() {
        this.containsInProgressElement = new H6El('state-line');
        const icon: DivEl = new DivEl('state-icon in-progress');
        const span1: SpanEl = new SpanEl('part1').setHtml(i18n('dialog.publish.in-progress.part1'));
        const span2: SpanEl = new SpanEl('part2').setHtml(i18n('dialog.publish.in-progress.part2'));
        this.containsInProgressElement.appendChildren(icon, span1, span2);
    }

    private createContainsNotPublishableElement() {
        this.containsNotPublishableElement = new H6El('not-publishable');
        const span: SpanEl = new SpanEl().setHtml(i18n('dialog.publish.notPublishable'));
        this.containsNotPublishableElement.appendChildren(span);
    }

    private createLoadFailedElement() {
        this.loadFailedElement = new H6El('load-failed').setHtml(i18n('dialog.publish.error.loadFailed'));
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

    setContainsInvalidVisible(flag: boolean) {
        this.containsInvalidElement.setVisible(flag);
    }

    setContainsInProgressVisible(flag: boolean) {
        this.containsInProgressElement.setVisible(flag);
    }

    setContainsNotPublishableVisible(flag: boolean) {
        this.containsNotPublishableElement.setVisible(flag);
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
