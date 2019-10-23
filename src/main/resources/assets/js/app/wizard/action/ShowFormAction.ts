import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowFormAction
    extends Action {

    constructor(wizard: ContentWizardPanel) {
        super('Form');

        this.setEnabled(true);
        this.setTitle(i18n('action.hideEditor'));
        this.onExecuted(() => {
            wizard.showForm();
            new ShowContentFormEvent().fire();
        });
    }
}
