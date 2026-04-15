import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWizardLiveEdit} from '../../../v6/features/store/wizardViewMode.store';
import {ShowLiveEditEvent} from '../ShowLiveEditEvent';

export class ShowLiveEditAction
    extends Action {

    constructor() {
        super('live');

        this.setTitle(i18n('tooltip.showEditor'));
        this.setEnabled(false);
        this.onExecuted(() => {
            showWizardLiveEdit();
            new ShowLiveEditEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        this.setTitle(value ? i18n('tooltip.showEditor') : '');
        super.setEnabled(value);

        return this;
    }
}
