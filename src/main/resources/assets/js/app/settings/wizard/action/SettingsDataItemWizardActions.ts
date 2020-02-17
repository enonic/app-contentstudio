import {WizardActions} from 'lib-admin-ui/app/wizard/WizardActions';
import {Action} from 'lib-admin-ui/ui/Action';
import {CloseAction} from 'lib-admin-ui/app/wizard/CloseAction';
import {DeleteSettingsItemWizardAction} from './DeleteSettingsItemWizardAction';
import {SaveSettingsItemWizardAction} from './SaveSettingsItemWizardAction';
import {Project} from '../../data/project/Project';
import {SettingsDataItemWizardPanel} from '../SettingsDataItemWizardPanel';
import {SettingsViewItem} from '../../view/SettingsViewItem';
import {SettingsDataViewItem} from '../../view/SettingsDataViewItem';

export class SettingsDataItemWizardActions<ITEM extends SettingsDataViewItem<any>>
    extends WizardActions<ITEM> {

    private save: SaveSettingsItemWizardAction;

    private close: Action;

    private delete: DeleteSettingsItemWizardAction;

    constructor(wizardPanel: SettingsDataItemWizardPanel<ITEM>) {
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

    enableActionsForExisting(item: SettingsViewItem) {
        this.save.setEnabled(false);
        this.delete.setEnabled(item.getId() !== Project.DEFAULT_PROJECT_NAME);
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
