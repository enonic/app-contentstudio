import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Action} from 'lib-admin-ui/ui/Action';

export class ShowLiveEditAction
    extends Action {

    constructor(wizard: ContentWizardPanel) {
        super('live');

        this.setTitle(i18n('tooltip.showEditor'));
        this.setEnabled(false);
        this.onExecuted(() => {
            wizard.showLiveEdit();
            new ShowLiveEditEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        super.setEnabled(value);

        this.setTitle(value ? i18n('tooltip.showEditor') : '');

        return this;
    }
}
