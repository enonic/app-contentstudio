import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {ProjectWizardPanel} from '../ProjectWizardPanel';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';

export class ProjectWizardActions
    extends SettingsDataItemWizardActions<ProjectViewItem> {

    private wizardPanel: ProjectWizardPanel;

    constructor(wizardPanel: ProjectWizardPanel) {
        super(wizardPanel);

        this.wizardPanel = wizardPanel;
    }

    enableActionsForNew() {
        this.save.setEnabled(this.wizardPanel.isRendered() && this.wizardPanel.isValid());
        this.delete.setEnabled(false);
    }

    enableActionsForExisting(item: SettingsViewItem) {
        this.updateActionsEnabledState();
    }

    private updateActionsEnabledState() {
        this.wizardPanel.getLoginResult().then((loginResult: LoginResult) => {
            const persistedItem: ProjectViewItem = this.wizardPanel.getPersistedItem();
            this.delete.setEnabled(persistedItem.isDeleteAllowed(loginResult));
            this.save.setEnabled(
                this.wizardPanel.isValid() && this.wizardPanel.hasUnsavedChanges() && this.wizardPanel.isEditAllowed(loginResult)
            );
        });
    }

}
