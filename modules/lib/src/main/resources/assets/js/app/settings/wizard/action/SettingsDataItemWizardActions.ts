import {WizardActions} from '@enonic/lib-admin-ui/app/wizard/WizardActions';
import {type Action} from '@enonic/lib-admin-ui/ui/Action';
import {CloseAction} from '@enonic/lib-admin-ui/app/wizard/CloseAction';
import {DeleteSettingsItemWizardAction} from './DeleteSettingsItemWizardAction';
import {SaveSettingsItemWizardAction} from './SaveSettingsItemWizardAction';
import {type SettingsDataItemWizardPanel} from '../panel/SettingsDataItemWizardPanel';
import {type SettingsDataViewItem} from '../../view/SettingsDataViewItem';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';

export abstract class SettingsDataItemWizardActions<ITEM extends SettingsDataViewItem<Equitable>>
    extends WizardActions<ITEM> {

    protected save: SaveSettingsItemWizardAction;

    protected close: Action;

    protected delete: DeleteSettingsItemWizardAction;

    protected constructor(wizardPanel: SettingsDataItemWizardPanel<ITEM>) {
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
