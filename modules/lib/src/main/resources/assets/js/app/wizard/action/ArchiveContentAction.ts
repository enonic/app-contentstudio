import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openDeleteDialog} from '../../../v6/features/store/dialogs/deleteDialog.store';
import {type ContentWizardPanel} from '../ContentWizardPanel';

export class ArchiveContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.delete'), 'mod+del', true);
        this.onExecuted(() => {
            openDeleteDialog([wizardPanel.getPersistedItem()]);
        });
    }
}
