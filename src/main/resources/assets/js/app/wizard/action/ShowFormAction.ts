import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowFormAction
    extends Action {

    constructor(wizard: ContentWizardPanel) {
        super('Form');

        this.setEnabled(true);
        this.onExecuted(() => {
            wizard.showForm();
            new ShowContentFormEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        super.setEnabled(value);

        this.setTitle(value ? i18n('tooltip.hideEditor') : '');

        return this;
    }
}
