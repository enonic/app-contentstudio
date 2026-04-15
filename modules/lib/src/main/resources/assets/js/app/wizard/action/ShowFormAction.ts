import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWizardForm} from '../../../v6/features/store/wizardViewMode.store';
import {ShowContentFormEvent} from '../ShowContentFormEvent';

export class ShowFormAction
    extends Action {

    constructor() {
        super('Form');

        this.setTitle(i18n('tooltip.hideEditor'));
        this.setEnabled(true);

        this.onExecuted(() => {
            showWizardForm();
            new ShowContentFormEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        this.setTitle(value ? i18n('tooltip.hideEditor') : '');

        super.setEnabled(value);

        return this;
    }
}
