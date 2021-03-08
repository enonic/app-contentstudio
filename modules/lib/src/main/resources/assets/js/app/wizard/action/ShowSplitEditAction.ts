import {i18n} from 'lib-admin-ui/util/Messages';
import {ShowSplitEditEvent} from '../ShowSplitEditEvent';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowSplitEditAction
    extends Action {

    constructor(wizard: ContentWizardPanel) {
        super(i18n('action.split'));

        this.setEnabled(false);
        this.onExecuted(() => {
            wizard.showSplitEdit();
            new ShowSplitEditEvent().fire();
        });
    }
}
