import {RichDropdown} from 'lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {Project} from '../../../../data/project/Project';
import {ProjectViewer} from '../../../viewer/ProjectViewer';
import * as Q from 'q';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ProjectsLoader} from './ProjectsLoader';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ProjectsChainBlock} from '../../../../dialog/ProjectsChainBlock';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

export class ProjectsDropdown extends RichDropdown<Project> {

    private projectsChainBlock: ProjectsChainBlock;

    constructor() {
        super({
            optionDisplayValueViewer: new ProjectViewer(),
            inputPlaceholderText: `<${i18n('settings.field.project.parent.notset')}>`,
            dataIdProperty: 'value'
        });

        this.projectsChainBlock = new ProjectsChainBlock();
    }

    protected createLoader(): ProjectsLoader {
        return new ProjectsLoader();
    }

    protected createOption(project: Project): Option<Project> {
        return {value: project.getName(), displayValue: project};
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('parent-selector');

            return rendered;
        });
    }

    selectProject(project: Project) {
        if (!project) {
            return;
        }

        this.selectOption(this.createOption(project), true);
    }

    showProjectsChain(parentName?: string) {
        if (!parentName) {
            this.doShowProjectsChain([]);
            return;
        }

        this.getAllProjects().then((projects: Project[]) => {
            const projectsChain: Project[] = this.buildProjectsChain(parentName, projects);
            this.doShowProjectsChain(projectsChain);
        }).catch(DefaultErrorHandler.handle);
    }

    private doShowProjectsChain(projects: Project[]) {
        this.projectsChainBlock.setProjectsChain(projects);
        this.prependChild(this.projectsChainBlock);
    }

    private getAllProjects(): Q.Promise<Project[]> {
        if (this.loader.isLoaded()) {
            return Q(this.loader.getResults());
        }

        return this.loader.load();
    }

    private buildProjectsChain(parentName: string, allProjects: Project[]): Project[] {
        const parentProjects: Project[] = [];

        let parentProjectName: string = parentName;

        while (parentProjectName) {
                const parentProject: Project = allProjects.find((project: Project) => project.getName() === parentProjectName);

                if (parentProject) {
                    parentProjects.unshift(parentProject);
                    parentProjectName = parentProject.getParent();
                } else {
                    parentProjectName = null;
                }
        }

        return parentProjects;
    }
}
