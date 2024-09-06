import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {ProjectWizardPanel} from '../panel/ProjectWizardPanel';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';

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

    enableActionsForExisting(item: SettingsViewItem): Q.Promise<void> {
        return this.updateActionsEnabledState();
    }

    private updateActionsEnabledState(): Q.Promise<void> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
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
