import Action = api.ui.Action;
import i18n = api.util.i18n;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import {ContentWizardPanel} from '../ContentWizardPanel';

export class MarkAsReadyAction
    extends Action {

    private wizard: ContentWizardPanel;
    private confirmDialog: ConfirmationDialog;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.markAsReady'));

        this.wizard = wizard;
        this.confirmDialog = new ConfirmationDialog().setQuestion(i18n('dialog.markAsReady.question'));

        this.onExecuted(this.handleExecuted.bind(this));
    }

    private handleExecuted() {

        this.confirmDialog.setYesCallback(() => {
            this.wizard.setIsMarkedAsReady(true);
            this.wizard.saveChanges().catch(api.DefaultErrorHandler.handle);
        }).open();
    }
}
