import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ParentProjectFormInputWrapper, ProjectsSelector} from './ProjectsSelector';
import {type Project} from '../../../../data/project/Project';
import {ProjectConfigContext} from '../../../../data/project/ProjectConfigContext';

export class ParentProjectFormItem
    extends ProjectFormItem {

    private readonly projectsSelector: ProjectsSelector;

    constructor() {
        const isMultiInheritance: boolean = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance();
        const maxParents: number = isMultiInheritance ? 0 : 1;
        const projectSelector = new ProjectsSelector(maxParents);
        projectSelector.addClass('parent-selector');

        super(new ProjectFormItemBuilder(new ParentProjectFormInputWrapper(projectSelector))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n(isMultiInheritance ? 'settings.field.project.parents' : 'settings.field.project.parent')) as ProjectFormItemBuilder);


        this.projectsSelector = projectSelector;
    }

    hasData(): boolean {
        return this.projectsSelector.getSelectedItems().length > 0;
    }

    getSelectedProjects(): Project[] {
        return this.projectsSelector.getSelectedProjects();
    }

    onProjectValueChanged(listener: () => void): void {
        this.projectsSelector.onSelectionChanged(listener);
    }

    setSelectedProjects(projects: Project[]): void {
        if (projects.length) {
            this.projectsSelector.updateAndSelectProjects(projects);
        }
    }

    getProjectsSelector(): ParentProjectFormInputWrapper {
        return this.getInput() as ParentProjectFormInputWrapper;
    }

    setReadOnly(): void {
        this.projectsSelector.addClass('readonly');
        this.projectsSelector.setEnabled(false);
        this.projectsSelector.setDraggable(false);
    }
}
