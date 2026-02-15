import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {type ProjectViewItem} from '../../view/ProjectViewItem';
import {SettingsDataItemWizardActions} from './SettingsDataItemWizardActions';
import {type ProjectWizardPanel} from '../panel/ProjectWizardPanel';

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

    enableActionsForExisting(item: SettingsViewItem): void {
        this.updateActionsEnabledState();
    }

    private updateActionsEnabledState(): void {
        this.save.setEnabled(this.isEditAllowed());
        this.toggleDeleteAction();
    }

    private isEditAllowed(): boolean {
        return this.wizardPanel.isValid() && this.wizardPanel.hasUnsavedChanges() && this.wizardPanel.isEditAllowed();
    }

    private toggleDeleteAction() {
        this.delete.setEnabled(this.wizardPanel.isDeleteAllowed());
    }

}
