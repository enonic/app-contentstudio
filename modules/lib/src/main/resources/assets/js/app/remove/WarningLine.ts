import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export interface WarningLineConfig {
    ignoreHandler: () => void;
}

export class WarningLine
    extends DivEl {

    private icon: DivEl;

    private warning: SpanEl;

    private ignoreButton: ActionButton;

    constructor({ignoreHandler}: WarningLineConfig) {
        super('warning-line');

        this.initElements();
        this.initListeners(ignoreHandler);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.icon, this.warning, this.ignoreButton);

            return rendered;
        });
    }

    protected initElements() {
        this.icon = new SpanEl('warning-icon');

        this.warning = new SpanEl('warning-text');
        this.setDefaultWarningText();

        const ignoreAction = new Action(i18n('dialog.archive.warning.ignore'));
        this.ignoreButton = new ActionButton(ignoreAction);
        this.ignoreButton.addClass('ignore-button');
    }

    protected initListeners(ignoreHandler: () => void) {
        this.ignoreButton.getAction().onExecuted(() => {
            ignoreHandler();
            this.hide();
        });
    }

    updateCount(count: number): void {
        this.warning.getEl().setAttribute('data-count', `(${count})`);
    }

    setIgnoreEnabled(enabled: boolean): void {
        this.ignoreButton.setEnabled(enabled);
    }

    getIcon(): SpanEl {
        return this.icon;
    }

    setWarningText(text: string): void {
        this.warning.setHtml(text);
    }

    setDefaultWarningText(): void {
        this.warning.setHtml(i18n('dialog.archive.warning.text'));
    }

    setIconClass(iconCls: string): void {
        this.icon.setClass(`warning-icon ${iconCls}`);
    }

    setDefaultIconClass(): void {
        this.setIconClass('icon-big-plus');
    }

}
