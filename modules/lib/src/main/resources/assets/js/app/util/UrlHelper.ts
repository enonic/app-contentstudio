import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {getActiveProject, getActiveProjectName} from '../../v6/features/store/activeProject.store';
import {type Project} from '../settings/data/project/Project';
import {UrlAction} from '../UrlAction';

export class UrlHelper {

    static toolUriPropertyName = 'toolUri';

    static getCmsRestUri(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('rest-v2', 'cs', UriHelper.relativePath(path)));
    }

    static getCMSPath(contentRootPath?: string, project?: Readonly<Project>): string {
        const requestProject = project || getActiveProject();
        return `cms/${requestProject.getName()}${contentRootPath ? `/${contentRootPath}` : ''}`;
    }

    static getCMSPathForContentRoot(project?: Readonly<Project>): string {
        return UrlHelper.getCMSPath('content', project);
    }

    static getCMSPathWithProject(projectName: string, contentRootPath?: string): string {
        const requestProject: string = projectName ? projectName : getActiveProjectName();
        return `cms/${requestProject}${contentRootPath ? `/${contentRootPath}` : ''}`;
    }

    static createContentBrowseUrl(project?: string): string {
        if (!project) {
            return UrlHelper.getActiveProjectUrl(`${UrlAction.BROWSE}`);
        }
        return UrlHelper.getPrefixedUrl(`${project}/${UrlAction.BROWSE}`);
    }

    static createContentEditUrl(contentId: string, action: string = UrlAction.EDIT): string {
        return UrlHelper.getActiveProjectUrl(`${action}/${contentId}`, '');
    }

    static getActiveProjectUrl(path: string, separator: string = '#'): string {
        const project = getActiveProjectName();
        return UrlHelper.getPrefixedUrl(`${project}/${path}`, separator);
    }

    static getPrefixedUrl(url: string, separator: string = '#'): string {
        return `${CONFIG.getString(UrlHelper.toolUriPropertyName)}${separator}/${url}`;
    }

    static isContentBrowseUrlMatch(): boolean {
        return window.location.hash.endsWith(UrlAction.BROWSE);
    }
}
