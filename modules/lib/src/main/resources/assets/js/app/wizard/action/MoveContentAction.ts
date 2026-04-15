import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openMoveDialog} from '../../../v6/features/store/dialogs/moveDialog.store';
import {type ContentWizardPanel} from '../ContentWizardPanel';

export class MoveContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.move'), 'alt+m');
        this.onExecuted(() => {
            const content = wizardPanel.getPersistedItem();
            if (!content) {
                return;
            }
            openMoveDialog([content]);
        });
    }
}
