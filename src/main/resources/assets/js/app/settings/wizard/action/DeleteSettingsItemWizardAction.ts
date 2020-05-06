import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class DeleteSettingsItemWizardAction
    extends Action {
    constructor() {
        super(i18n('action.delete'), 'mod+del', true);
    }
}
