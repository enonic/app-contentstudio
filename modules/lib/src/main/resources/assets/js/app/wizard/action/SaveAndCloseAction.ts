import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {requestFullWizardSave} from '../../../v6/features/store/wizardSave.store';
import {requestWizardClose} from '../../../v6/features/store/wizardCommands.store';

export class SaveAndCloseAction
    extends Action {

    constructor() {
        super('SaveAndClose', 'mod+enter', true);

        this.onExecuted(() => {
            return requestFullWizardSave().then(() => {
                requestWizardClose(false);
            });
        });
    }
}
