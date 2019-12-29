import {WizardActions} from 'lib-admin-ui/app/wizard/WizardActions';
import {Action} from 'lib-admin-ui/ui/Action';
import {SaveAction} from 'lib-admin-ui/app/wizard/SaveAction';
import {CloseAction} from 'lib-admin-ui/app/wizard/CloseAction';
import {SettingsItem} from '../../data/SettingsItem';
import {DeleteSettingsItemWizardAction} from './DeleteSettingsItemWizardAction';
import {SettingsItemWizardPanel} from '../SettingsItemWizardPanel';

export class SettingsItemWizardActions
    extends WizardActions<SettingsItem> {

    private save: Action;

    private close: Action;

    private delete: Action;

    constructor(wizardPanel: SettingsItemWizardPanel<SettingsItem>) {
        super();

        this.save = new SaveAction(wizardPanel);
        this.delete = new DeleteSettingsItemWizardAction();
        this.close = new CloseAction(wizardPanel);

        this.setActions(this.save, this.delete, this.close);
    }

    enableActionsForNew() {
        this.save.setEnabled(false);
        this.delete.setEnabled(false);
    }

    enableActionsForExisting(item: SettingsItem) {
        this.save.setEnabled(false);
        this.delete.setEnabled(true);
    }

    getDeleteAction(): Action {
        return this.delete;
    }

    getSaveAction(): Action {
        return this.save;
    }

    getCloseAction(): Action {
        return this.close;
    }

}
