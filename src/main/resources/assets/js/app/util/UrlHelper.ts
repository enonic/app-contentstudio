import {ProjectContext} from '../project/ProjectContext';
import {Project} from '../settings/data/project/Project';

export class UrlHelper {

    static getCMSPath(project?: Project): string {
        const requestProject: Project = !!project ? project : ProjectContext.get().getProject();
        return `cms/${requestProject.getName()}/base`;
    }

}
