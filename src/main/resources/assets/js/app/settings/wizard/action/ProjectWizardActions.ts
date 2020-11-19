import {SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {ProjectWizardPanel} from '../panel/ProjectWizardPanel';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {ProjectListRequest} from '../../resource/ProjectListRequest';
import {Project} from '../../data/project/Project';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

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
        this.wizardPanel.getLoginResult().then((loginResult: LoginResult) => {
            this.save.setEnabled(this.isEditAllowed(loginResult));
            this.toggleDeleteAction(loginResult);
        });
    }

    private isEditAllowed(loginResult: LoginResult): boolean {
        return this.wizardPanel.isValid() && this.wizardPanel.hasUnsavedChanges() && this.wizardPanel.isEditAllowed(loginResult);
    }

    private toggleDeleteAction(loginResult: LoginResult) {
        const isDeleteAllowed: boolean = this.wizardPanel.getPersistedItem().isDeleteAllowed(loginResult);

        if (isDeleteAllowed) {
            const projectName: string = this.wizardPanel.getPersistedItem().getData().getName();

            new ProjectListRequest().sendAndParse().then((projects: Project[]) => {
                this.delete.setEnabled(projects.every((p: Project) => p.getParent() !== projectName));
            }).catch(DefaultErrorHandler.handle);
        } else {
            this.delete.setEnabled(isDeleteAllowed);
        }
    }

}
