import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {ProjectContext} from '../project/ProjectContext';
import {Project} from '../settings/data/project/Project';
import {UrlAction} from '../UrlAction';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class UrlHelper {

    static toolUriPropertyName = 'toolUri';

    static getCmsRestUri(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('rest-v2', 'cs', UriHelper.relativePath(path)));
    }

    static getCMSPath(contentRootPath?: string, project?: Project): string {
        const requestProject: Project = project || ProjectContext.get().getProject();
        return `cms/${requestProject.getName()}${contentRootPath ? `/${contentRootPath}` : ''}`;
    }

    static getCMSPathForContentRoot(project?: Project): string {
        return UrlHelper.getCMSPath('content', project);
    }

    static getCMSPathWithProject(projectName: string, contentRootPath?: string): string {
        const requestProject: string = projectName ? projectName : ProjectContext.get().getProject().getName();
        return `cms/${requestProject}${contentRootPath ? `/${contentRootPath}` : ''}`;
    }

    static createContentBrowseUrl(project?: string): string {
        if (!project) {
            return UrlHelper.getProjectContextUrl(`${UrlAction.BROWSE}`);
        }
        return UrlHelper.getPrefixedUrl(`${project}/${UrlAction.BROWSE}`);
    }

    static createContentEditUrl(contentId: string, action: string = UrlAction.EDIT): string {
        return UrlHelper.getProjectContextUrl(`${action}/${contentId}`, '');
    }

    static getProjectContextUrl(path: string, separator: string = '#'): string {
        const project = ProjectContext.get().getProject().getName();
        return UrlHelper.getPrefixedUrl(`${project}/${path}`, separator);
    }

    static getPrefixedUrl(url: string, separator: string = '#'): string {
        return `${CONFIG.getString(UrlHelper.toolUriPropertyName)}${separator}/${url}`;
    }

    static isContentBrowseUrlMatch(): boolean {
        return window.location.hash.endsWith(UrlAction.BROWSE);
    }

    static buildWidgetUri(widgetUrl: string): string {
        return `${CONFIG.getString(UrlHelper.toolUriPropertyName)}/${widgetUrl}`;
    }
}
