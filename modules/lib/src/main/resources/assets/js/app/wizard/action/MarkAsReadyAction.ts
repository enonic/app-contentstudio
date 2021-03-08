import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
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
        this.wizard.saveChanges().catch(DefaultErrorHandler.handle);
    }
}
