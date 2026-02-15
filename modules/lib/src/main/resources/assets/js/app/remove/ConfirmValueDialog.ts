import type Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {
    ModalDialogWithConfirmation,
    type ModalDialogWithConfirmationConfig
} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {type DialogButton} from '@enonic/lib-admin-ui/ui/dialog/DialogButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {TextInput, TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

interface ConfirmValueDialogConfig
    extends ModalDialogWithConfirmationConfig {
    inputSize?: TextInputSize;
}
export class ConfirmValueDialog
    extends ModalDialogWithConfirmation {

    private valueToCheck: string;

    private confirmButton: DialogButton;

    protected confirmAction: Action;

    private input: TextInput;

    private subheader: H6El;

    private hintEl: SpanEl;

    private yesCallback: () => void;

    private noCallback: () => void;

    constructor(config: ConfirmValueDialogConfig = {}) {
        super(config);
    }

    getConfig(): ConfirmValueDialogConfig {
        return this.config;
    }

    protected initElements() {
        super.initElements();

        this.initConfirmAction();
        this.input = new TextInput('text', this.getConfig().inputSize || TextInputSize.MIDDLE);
        this.subheader = new H6El('confirm-value-subtitle');
        this.hintEl = new SpanEl('confirm-value-data');
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.input);
    }

    protected initListeners() {
        super.initListeners();

        this.confirmAction.onExecuted(() => {
            this.close();
            if (this.yesCallback) {
                this.yesCallback();
            }
        });

        this.getCancelAction().onAfterExecute(() => {
            if (this.noCallback) {
                this.noCallback();
            }
        });

        this.input.onValueChanged(this.handleInputValueChanged.bind(this));
    }

    private handleInputValueChanged() {
        if (this.isInputEmpty()) {
            this.reset();
            return;
        }

        if (this.isCorrectValueEntered()) {
            this.input.removeClass('invalid').addClass('valid');
            this.confirmAction.setEnabled(true);
            setTimeout(() => {
                this.confirmButton.giveFocus();
            }, 0);
        } else {
            this.input.removeClass('valid').addClass('invalid');
            this.confirmAction.setEnabled(false);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('confirm-value-dialog');
            this.appendChildToHeader(this.subheader);

            const confirmationText = new PEl('confirm-value-text');
            confirmationText.appendChildren(
                SpanEl.fromText(i18n('dialog.confirmValue.enterValue')),
                this.hintEl,
                SpanEl.fromText(i18n('dialog.confirmValue.enterValue.ending'))
            );
            const confirmationDiv = new DivEl('confirm-value-block').appendChildren(confirmationText, this.input);
            this.appendChildToContentPanel(confirmationDiv);

            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    show() {
        super.show();
        this.input.giveFocus();
    }

    close() {
        super.close();
        this.reset();
        this.remove();
    }

    reset() {
        this.input.setValue('', true);
        this.input.removeClass('invalid valid');
        this.confirmAction.setEnabled(false);
    }

    private initConfirmAction() {
        this.confirmAction = new Action(i18n('action.confirm'));
        this.confirmAction.setIconClass('confirm-value-action');
        this.confirmAction.setEnabled(false);

        this.confirmButton = this.addAction(this.confirmAction, true, true);
    }

    private isInputEmpty(): boolean {
        return this.input.getValue() === '';
    }

    private isCorrectValueEntered(): boolean {
        return this.input.getValue().trim() === this.valueToCheck.trim();
    }

    setValueToCheck(value: string): ConfirmValueDialog {
        this.valueToCheck = value;
        this.hintEl.setHtml(value);
        this.input.setValue('');
        return this;
    }

    setSubheaderText(value: string): ConfirmValueDialog {
        this.subheader.setHtml(value);
        return this;
    }

    setHeaderText(value: string): ConfirmValueDialog {
        this.setHeading(value);
        return this;
    }

    setYesCallback(callback: () => void): ConfirmValueDialog {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ConfirmValueDialog {
        this.noCallback = callback;
        return this;
    }
}
