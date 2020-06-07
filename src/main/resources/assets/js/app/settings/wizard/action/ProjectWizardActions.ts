import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {ProjectWizardPanel} from '../ProjectWizardPanel';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';

export class ProjectWizardActions
    extends SettingsDataItemWizardActions<ProjectViewItem> {

    private wizardPanel: ProjectWizardPanel;

    private loginResult: LoginResult;

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
        if (this.loginResult) {
            this.doActionsEnabledState();
        } else {
            new IsAuthenticatedRequest().sendAndParse().then(loginResult => {
                this.loginResult = loginResult;
                this.doActionsEnabledState();
            });
        }

    }

    private doActionsEnabledState() {
        const persistedItem: ProjectViewItem = this.wizardPanel.getPersistedItem();

        this.save.setEnabled(
            this.wizardPanel.isValid() && this.wizardPanel.hasUnsavedChanges() && this.isEditAllowed());
        this.delete.setEnabled(persistedItem.isDeleteAllowed(this.loginResult));
    }

    isEditAllowed(): boolean {
        const persistedItem: ProjectViewItem = this.wizardPanel.getPersistedItem();
        if (!persistedItem) {
            return true; // New project - edit is allowed
        }
        return persistedItem.isEditAllowed(this.loginResult);
    }

}
