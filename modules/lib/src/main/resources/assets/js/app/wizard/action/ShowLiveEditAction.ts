import {ShowLiveEditEvent} from '../ShowLiveEditEvent';
import {setWizardViewMode} from '../../../v6/pages/wizard/model/wizardLayout.store';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ShowLiveEditAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super('live');

        this.wizard = wizard;

        this.setTitle(i18n('tooltip.showEditor'));
        this.setEnabled(false);
        this.onExecuted(() => {
            this.showLiveEdit();
            new ShowLiveEditEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        this.setTitle(value ? i18n('tooltip.showEditor') : '');
        super.setEnabled(value);

        return this;
    }

    private showLiveEdit() {
        setWizardViewMode(this.wizard.isInMobileViewMode() ? 'live' : 'split');
        this.wizard.getMainToolbar().toggleClass('live', true);
        this.wizard.toggleClass('form', false);

        this.openLiveEdit();
    }

    private openLiveEdit() {
        this.wizard.showMinimizeEditButton();
    }
}
