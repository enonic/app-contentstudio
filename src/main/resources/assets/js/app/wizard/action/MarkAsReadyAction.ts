import Action = api.ui.Action;
import i18n = api.util.i18n;
import {ContentWizardPanel} from '../ContentWizardPanel';

export class MarkAsReadyAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.markAsReady'));

        this.wizard = wizard;

        this.onExecuted(() => this.handleExecuted());
    }

    private handleExecuted() {
        this.wizard.setIsMarkedAsReady(true);
        this.wizard.saveChanges().catch(api.DefaultErrorHandler.handle);
    }
}
