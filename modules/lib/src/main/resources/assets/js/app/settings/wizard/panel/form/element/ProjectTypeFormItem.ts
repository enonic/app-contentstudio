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
            .setLabel(i18n(isMultiInheritance ? 'settings.field.project.parents' : 'settings.field.project.parent'));

        super(projectFormItemBuilder as ProjectFormItemBuilder);

        this.projectsSelector = this.getInput() as ProjectsSelector;
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

    setSelectedProjects(projects: Project[]): void {
        if (projects.length) {
            this.projectsSelector.updateAndSelectProjects(projects);
        }
    }
}
