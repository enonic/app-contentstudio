import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {type ProjectViewItem} from '../../../view/ProjectViewItem';
import {type Project} from '../../../data/project/Project';

export abstract class ProjectWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    protected parentProject?: Project[];

    setParentProjects(projects: Project[]) {
        this.parentProject = projects;
    }

}
