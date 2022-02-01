import Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {Action} from 'lib-admin-ui/ui/Action';

export class PublishIssuesStateBar
    extends DivEl {

    private containsInvalidElement: Element;

    private excludeAllInvalidButton: ActionButton;

    private containsInProgressElement: Element;

    private excludeAllInProgressButton: ActionButton;

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
        this.excludeAllInvalidButton = new ActionButton(new Action());

        const icon: DivEl = new DivEl('state-icon invalid');
        const span1: SpanEl = new SpanEl('part1').setHtml(i18n('dialog.publish.invalidError.part1'));
        span1.setTitle(i18n('dialog.publish.invalidError.part2'));
        this.containsInvalidElement.appendChildren(icon, span1, this.excludeAllInvalidButton);
    }

    private createContainsInProgressElement() {
        this.containsInProgressElement = new H6El('state-line');
        this.excludeAllInProgressButton = new ActionButton(new Action());

        const icon: DivEl = new DivEl('state-icon in-progress');
        const span1: SpanEl = new SpanEl('part1').setHtml(i18n('dialog.publish.in-progress.part1'));
        span1.setTitle(i18n('dialog.publish.in-progress.part2'));
        this.containsInProgressElement.appendChildren(icon, span1, this.excludeAllInProgressButton);
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

    setContainsInProgress(value: boolean) {
        this.containsInProgressElement.setVisible(value);
    }

    setTotalInProgress(count: number) {
        this.excludeAllInProgressButton.setVisible(count > 0);
        this.excludeAllInProgressButton.setLabel(i18n('dialog.publish.exclude', count));
    }

    setContainsInvalid(flag: boolean) {
        this.containsInvalidElement.setVisible(flag);
    }

    setTotalInvalid(count: number) {
        this.excludeAllInvalidButton.setVisible(count > 0);
        this.excludeAllInvalidButton.setLabel(i18n('dialog.publish.exclude', count));
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

    onExcludeAllInProgressClicked(handler: () => void) {
        this.excludeAllInProgressButton.getAction().onExecuted(handler);
    }

    onExcludeAllInvalidClicked(handler: () => void) {
        this.excludeAllInvalidButton.getAction().onExecuted(handler);
    }
}
