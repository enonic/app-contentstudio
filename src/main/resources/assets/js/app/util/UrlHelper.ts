import {ProjectContext} from '../project/ProjectContext';
import {Project} from '../settings/data/project/Project';

export class UrlHelper {

    static getCMSPath(): string {
        const requestProject: Project = ProjectContext.get().getProject();
        return `cms/${requestProject.getName()}/base`;
    }

    static getCMSPathWithProject(projectName: string): string {
        const requestProject: string = !!projectName ? projectName : ProjectContext.get().getProject().getName();
        return `cms/${requestProject}/base`;
    }

}
