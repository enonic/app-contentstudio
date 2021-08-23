import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {ProjectContext} from '../project/ProjectContext';
import {Project} from '../settings/data/project/Project';

export class UrlHelper {

    static getCmsRestUri(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('rest-v2', 'cs', UriHelper.relativePath(path)));
    }

    static getCMSPath(): string {
        const requestProject: Project = ProjectContext.get().getProject();
        return `cms/${requestProject.getName()}/base`;
    }

    static getCMSPathWithProject(projectName: string): string {
        const requestProject: string = !!projectName ? projectName : ProjectContext.get().getProject().getName();
        return `cms/${requestProject}/base`;
    }

}
