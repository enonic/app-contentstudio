import {type Content} from '../../content/Content';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {openDuplicateDialog} from '../../../v6/features/store/dialogs/duplicateDialog.store';

export class DuplicateContentAction
    extends Action {

    constructor(wizardPanel: WizardPanel<Content>) {
        super(i18n('action.duplicate'));
        this.onExecuted(() => {
            openDuplicateDialog([wizardPanel.getPersistedItem()]);
        });
    }
}
