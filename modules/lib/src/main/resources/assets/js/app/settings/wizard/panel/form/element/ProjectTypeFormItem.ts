import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsDropdownBuilder, ProjectsSelector} from './ProjectsSelector';
import {Project} from '../../../../data/project/Project';
import {ProjectConfigContext} from '../../../../data/project/ProjectConfigContext';

export class ProjectTypeFormItem
    extends ProjectFormItem {

    private projectsSelector: ProjectsSelector;

    constructor() {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const maxParents: number = isMultiInheritance ? 0 : 1;
        const inputBuilder = new ProjectsDropdownBuilder().setMaximumOccurrences(maxParents) as ProjectsDropdownBuilder;

        const projectSelector = new ProjectsSelector(inputBuilder);

        const projectFormItemBuilder = new ProjectFormItemBuilder(projectSelector)
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n(isMultiInheritance ? 'dialog.project.wizard.summary.parents.title' : 'dialog.project.wizard.summary.parent.title'));

        super(projectFormItemBuilder as ProjectFormItemBuilder);

        this.projectsSelector = this.getInput() as ProjectsSelector;

        this.addClass('project-type-form-item');
    }

    hasData(): boolean {
        return !!this.projectsSelector.getValue();
    }

    getSelectedProjects(): Project[] {
        return this.projectsSelector.getSelectedDisplayValues();
    }

    onProjectValueChanged(listener: () => void): void {
        this.projectsSelector.onValueChanged(listener);
    }
}
