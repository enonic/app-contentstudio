import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {Project} from '../../../data/project/Project';

export abstract class ProjectWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    protected parentProject?: Project[];

    setParentProjects(projects: Project[]) {
        this.parentProject = projects;
    }

}
