import {WizardActions} from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {CloseAction} from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import {DeleteSettingsItemWizardAction} from './DeleteSettingsItemWizardAction';
import {SaveSettingsItemWizardAction} from './SaveSettingsItemWizardAction';
import {SettingsDataItemWizardPanel} from '../panel/SettingsDataItemWizardPanel';
import {SettingsDataViewItem} from '../../view/SettingsDataViewItem';

export abstract class SettingsDataItemWizardActions<ITEM extends SettingsDataViewItem<any>>
    extends WizardActions<ITEM> {

    protected save: SaveSettingsItemWizardAction;

    protected close: Action;

    protected delete: DeleteSettingsItemWizardAction;

    constructor(wizardPanel: SettingsDataItemWizardPanel<ITEM>) {
        super();

        this.save = new SaveSettingsItemWizardAction();
        this.delete = new DeleteSettingsItemWizardAction();
        this.close = new CloseAction(wizardPanel);

        this.save.setEnabled(false);

        this.setActions(this.save, this.delete, this.close);
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
