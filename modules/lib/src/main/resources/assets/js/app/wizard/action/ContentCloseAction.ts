import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {requestWizardClose} from '../../../v6/features/store/wizardCommands.store';

export class ContentCloseAction
    extends Action {

    constructor() {
        super('Close', 'alt+w', true);

        this.onExecuted(() => {
            requestWizardClose(!this.forceExecute);
        });
    }
}
