import {Project, ProjectBuilder} from '../data/project/Project';
import {ProjectsTreeRequest} from './ProjectsTreeRequest';
import {ProjectsTreeItem} from '../data/project/ProjectsTreeItem';
import {ProjectHelper} from '../data/project/ProjectHelper';
import Q from 'q';

declare const CONFIG;

export class ProjectsTreeBuilder {

    private readonly availableProjects: Project[];

    private readonly projectsTree: Project[];

    private projectsWithoutParent: Project[];

    constructor(availableProjects: Project[]) {
        this.availableProjects = availableProjects;
        this.projectsTree = [...this.availableProjects];
    }

    build(): Q.Promise<Project[]> {
        this.projectsWithoutParent = this.getProjectsWithoutParents();

        return this.fetchTree(this.projectsWithoutParent.pop()).then(() => {
            return this.filterDefaultProjectIfNeeded(this.projectsTree).sort(ProjectHelper.sortProjects);
        });
    }

    private fetchTree(project: Project): Q.Promise<void> {
        if (!project) {
            return Q(null);
        }

        if (this.isDefaultOrHasParent(project)) {
            return this.fetchTree(this.projectsWithoutParent.pop());
        }

        return new ProjectsTreeRequest(project.getName()).sendAndParse().then((projectsTreeItems: ProjectsTreeItem[]) => {
            this.addMissingParentProjects(projectsTreeItems);
            return this.fetchTree(this.projectsWithoutParent.pop());
        });
    }

    private addMissingParentProjects(projectsTreeItems: ProjectsTreeItem[]) {
        this.availableProjects.forEach((projectWithoutParent: Project) => {
            this.addParents(projectWithoutParent, projectsTreeItems);
        });
    }

    private addParents(project: Project, projectsTreeItems: ProjectsTreeItem[]) {
        if (this.isDefaultOrHasParent(project)) {
            return;
        }

        const parentProjectsTreeItem: ProjectsTreeItem =
            projectsTreeItems.find((item: ProjectsTreeItem) => item.getName() === project.getParent());

        if (!parentProjectsTreeItem) {
            return;
        }

        const notAvailableParentProject: Project = new ProjectBuilder().setName(parentProjectsTreeItem.getName()).setParent(
            parentProjectsTreeItem.getParent()).build();

        this.projectsTree.push(notAvailableParentProject);

        this.addParents(notAvailableParentProject, projectsTreeItems);
    }

    private isDefaultOrHasParent(project: Project): boolean {
        return ProjectHelper.isDefault(project) || this.projectsTree.some((p: Project) => project.getParent() === p.getName());
    }

    private getProjectsWithoutParents(): Project[] {
        return this.availableProjects.filter(
            (p1: Project) => !!p1.getParent() && !this.availableProjects.some((p2: Project) => p1.getParent() === p2.getName()));
    }

    private filterDefaultProjectIfNeeded(projects: Project[]): Project[] {
        const hideDefault: boolean = CONFIG.hideDefaultProject === 'true';

        if (!hideDefault) {
            return projects;
        }

        return projects.filter((project: Project) => !this.isFromDefaultTree(project));
    }

    private isFromDefaultTree(project: Project): boolean {
        return ProjectHelper.isDefault(project) || this.hasDefaultParent(project);
    }

    private hasDefaultParent(project: Project): boolean {
        let parent: Project = this.getParent(project);

        while (parent) {
            if (ProjectHelper.isDefault(parent)) {
                return true;
            }

            parent = this.getParent(parent);
        }

        return false;
    }

    private getParent(project: Project): Project {
        return this.projectsTree.find((p: Project) => p.getName() === project.getParent());
    }
}
