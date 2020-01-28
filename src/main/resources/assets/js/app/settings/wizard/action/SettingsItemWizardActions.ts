import {WizardActions} from 'lib-admin-ui/app/wizard/WizardActions';
import {Action} from 'lib-admin-ui/ui/Action';
import {CloseAction} from 'lib-admin-ui/app/wizard/CloseAction';
import {SettingsItem} from '../../data/SettingsItem';
import {DeleteSettingsItemWizardAction} from './DeleteSettingsItemWizardAction';
import {SettingsItemWizardPanel} from '../SettingsItemWizardPanel';
import {SaveSettingsItemWizardAction} from './SaveSettingsItemWizardAction';
import {ProjectItem} from '../../data/ProjectItem';

export class SettingsItemWizardActions
    extends WizardActions<SettingsItem> {

    private save: SaveSettingsItemWizardAction;

    private close: Action;

    private delete: DeleteSettingsItemWizardAction;

    constructor(wizardPanel: SettingsItemWizardPanel<SettingsItem>) {
        super();

        this.save = new SaveSettingsItemWizardAction();
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
        this.delete.setEnabled(item.getId() !== ProjectItem.DEFAULT);
    }

    getDeleteAction(): DeleteSettingsItemWizardAction {
        return this.delete;
    }

    getSaveAction(): SaveSettingsItemWizardAction {
        return this.save;
    }

    getCloseAction(): Action {
        return this.close;
    }

}
