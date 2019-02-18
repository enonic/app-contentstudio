import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {CompareStatus} from '../content/CompareStatus';
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import i18n = api.util.i18n;

export interface ConfirmContentDeleteDialogConfig
    extends ModalDialogConfig {

    totalItemsToDelete: number;

    deleteRequest: DeleteContentRequest;

    yesCallback: (exclude?: CompareStatus[]) => void;
}

export class ConfirmContentDeleteDialog
    extends api.ui.dialog.ModalDialog {

    private confirmDeleteButton: api.ui.dialog.DialogButton;

    private confirmDeleteAction: api.ui.Action;

    private input: api.ui.text.TextInput;

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

        this.input.onValueChanged((event: api.ValueChangedEvent) => {
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
            this.appendChildToHeader(new api.dom.H6El('confirm-delete-subtitle').setHtml(i18n('dialog.confirmDelete.subname')));

            const confirmationText = new api.dom.PEl('confirm-delete-text')
                .setHtml(i18n('dialog.confirmDelete.enterAmount', this.config.totalItemsToDelete), false);
            const confirmationDiv = new api.dom.DivEl('confirm-delete-block').appendChildren(confirmationText, this.input);
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
        this.confirmDeleteAction = new api.ui.Action(i18n('action.confirm'));
        this.confirmDeleteAction.setIconClass('confirm-delete-action');
        this.confirmDeleteAction.setEnabled(false);

        this.confirmDeleteButton = this.addAction(this.confirmDeleteAction, true, true);
    }

    private initConfirmationInput() {
        this.input = api.ui.text.TextInput.middle('text').setForbiddenCharsRe(/[^0-9]/);
    }

    private isInputEmpty(): boolean {
        return this.input.getValue() === '';
    }

    private isCorrectNumberEntered(): boolean {
        return this.input.getValue() === this.config.totalItemsToDelete.toString();
    }
}
