import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {CompareStatus} from '../content/CompareStatus';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export interface ConfirmContentDeleteDialogConfig
    extends ModalDialogWithConfirmationConfig {

    totalItemsToDelete: number;

    deleteRequest: DeleteContentRequest;

    yesCallback: (exclude?: CompareStatus[]) => void;
}

export class ConfirmContentDeleteDialog
    extends ModalDialogWithConfirmation {

    private confirmDeleteButton: DialogButton;

    private confirmDeleteAction: Action;

    private input: TextInput;

    protected config: ConfirmContentDeleteDialogConfig;

    constructor(deleteConfig: ConfirmContentDeleteDialogConfig) {
        super(deleteConfig);

        this.getEl().addClass('confirm-delete-dialog');
    }

    protected initElements() {
        super.initElements();

        this.initConfirmDeleteAction();
        this.initConfirmationInput();
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.input);
    }

    protected initListeners() {
        super.initListeners();

        this.confirmDeleteAction.onExecuted(() => {
            this.close();
            this.config.yesCallback();
        });

        this.input.onValueChanged((event: ValueChangedEvent) => {
            if (this.isInputEmpty()) {
                this.input.removeClass('invalid valid');
                this.confirmDeleteAction.setEnabled(false);
                return;
            }

            if (this.isCorrectNumberEntered()) {
                this.input.removeClass('invalid').addClass('valid');
                this.confirmDeleteAction.setEnabled(true);
                setTimeout(() => {
                    this.confirmDeleteButton.giveFocus();
                }, 0);
            } else {
                this.input.removeClass('valid').addClass('invalid');
                this.confirmDeleteAction.setEnabled(false);
            }

        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(new H6El('confirm-delete-subtitle').setHtml(i18n('dialog.confirmDelete.subname')));

            const confirmationText = new PEl('confirm-delete-text');
            confirmationText.appendChildren<any>(
                SpanEl.fromText(i18n('dialog.confirmDelete.enterAmount')),
                SpanEl.fromText(`${this.config.totalItemsToDelete}`).addClass('confirm-delete-number'),
                SpanEl.fromText(i18n('dialog.confirmDelete.enterAmount.ending'))
            );
            const confirmationDiv = new DivEl('confirm-delete-block').appendChildren(confirmationText, this.input);
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
        this.remove();
    }

    private initConfirmDeleteAction() {
        this.confirmDeleteAction = new Action(i18n('action.confirm'));
        this.confirmDeleteAction.setIconClass('confirm-delete-action');
        this.confirmDeleteAction.setEnabled(false);

        this.confirmDeleteButton = this.addAction(this.confirmDeleteAction, true, true);
    }

    private initConfirmationInput() {
        this.input = TextInput.middle('text').setForbiddenCharsRe(/[^0-9]/);
    }

    private isInputEmpty(): boolean {
        return this.input.getValue() === '';
    }

    private isCorrectNumberEntered(): boolean {
        return this.input.getValue() === this.config.totalItemsToDelete.toString();
    }
}
