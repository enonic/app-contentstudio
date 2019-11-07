import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowLiveEditAction
    extends Action {

    constructor(wizard: ContentWizardPanel) {
        super('Live');

        this.setEnabled(false);
        this.setTitle(i18n('action.showEditor'));
        this.onExecuted(() => {
            wizard.showLiveEdit();
            new ShowLiveEditEvent().fire();
        });
    }
}
