import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class SaveSettingsItemWizardAction
    extends Action {

    constructor() {
        super(i18n('action.save'), 'mod+s', true);

        this.onExecuted(() => {
            this.setEnabled(false);
        });
    }
}
