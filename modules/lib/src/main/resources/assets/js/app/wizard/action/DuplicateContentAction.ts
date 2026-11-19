import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { type ContentWizardPanel } from '../ContentWizardPanel';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { openDuplicateDialog } from '../../../v6/features/duplicate/model/duplicateDialog.store';

export class DuplicateContentAction extends Action {
    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.duplicate'));
        this.onExecuted(() => {
            openDuplicateDialog([wizardPanel.getPersistedSummary()]);
        });
    }
}
