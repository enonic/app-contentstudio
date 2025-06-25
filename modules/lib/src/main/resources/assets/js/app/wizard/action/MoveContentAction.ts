import {WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {openMoveDialog} from '../../../v6/features/store/dialogs/moveDialog.store';
import {Content} from '../../content/Content';

export class MoveContentAction
    extends Action {

    constructor(wizardPanel: WizardPanel<Content>) {
        super(i18n('action.move'), 'alt+m');
        this.onExecuted(() => {
            const content = wizardPanel.getPersistedItem();
            openMoveDialog(content ? 1 : 0);
        });
    }
}
