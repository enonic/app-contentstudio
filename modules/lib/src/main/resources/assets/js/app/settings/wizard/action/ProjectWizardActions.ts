import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {ProjectWizardPanel} from '../panel/ProjectWizardPanel';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';

export class ProjectWizardActions
    extends SettingsDataItemWizardActions<ProjectViewItem> {

    private readonly wizardPanel: ProjectWizardPanel;

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
        new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.save.setEnabled(this.isEditAllowed(loginResult));
            this.toggleDeleteAction(loginResult);
        });
    }

    private isEditAllowed(loginResult: LoginResult): boolean {
        return this.wizardPanel.isValid() && this.wizardPanel.hasUnsavedChanges() && this.wizardPanel.isEditAllowed(loginResult);
    }

    private toggleDeleteAction(loginResult: LoginResult) {
        this.delete.setEnabled(this.wizardPanel.isDeleteAllowed(loginResult));
    }

}
