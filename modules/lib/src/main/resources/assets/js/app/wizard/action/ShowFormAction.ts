import {ShowContentFormEvent} from '../ShowContentFormEvent';
import {setWizardViewMode} from '../../../v6/pages/wizard/model/wizardLayout.store';
import {type ContentWizardPanel} from '../ContentWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';

export class ShowFormAction
    extends Action {

    private wizard: ContentWizardPanel;

    constructor(wizard: ContentWizardPanel) {
        super('Form');

        this.wizard = wizard;

        this.setTitle(i18n('tooltip.hideEditor'));
        this.setEnabled(true);

        this.onExecuted(() => {
            this.showForm();
            new ShowContentFormEvent().fire();
        });
    }

    setEnabled(value: boolean): Action {
        this.setTitle(value ? i18n('tooltip.hideEditor') : '');

        super.setEnabled(value);

        return this;
    }

    private showForm() {
        setWizardViewMode('form');
        this.wizard.getMainToolbar().toggleClass('live', false);
        this.wizard.toggleClass('form', true);

        this.closeLiveEdit();
    }

    private closeLiveEdit() {
        this.wizard.hideMinimizeEditButton();

        if (this.wizard.getLiveMask()?.isVisible()) {
            this.wizard.getLiveMask().hide();
        }

        if (this.wizard.isMinimized()) {
            this.wizard.toggleMinimize();
        }
    }
}
