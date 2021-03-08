import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {RenderingMode} from './RenderingMode';
import {Branch} from '../versioning/Branch';
import {ComponentPath} from '../page/region/ComponentPath';
import {UriHelper as UIUriHelper} from 'lib-admin-ui/util/UriHelper';
import {ProjectContext} from '../project/ProjectContext';

export class UriHelper {

    public static getPortalUri(path: string, renderingMode: RenderingMode, branch: Branch = Branch.DRAFT): string {
        const relPath: string = UIUriHelper.relativePath(path);
        const project: string = ProjectContext.get().getProject().getName();
        const uri: string = [renderingMode, project, branch, relPath].join(ContentPath.ELEMENT_DIVIDER);

        return UIUriHelper.addSitePrefix(uri);
    }

    public static getPathFromPortalInlineUri(portalUri: string, renderingMode: RenderingMode, branch: Branch = Branch.DRAFT): string {
        const project: string = ProjectContext.get().getProject().getName();
        const searchEntry: string = [renderingMode, project, branch].join(ContentPath.ELEMENT_DIVIDER);

        const index = portalUri.indexOf(searchEntry);
        if (index > -1) {
            return portalUri.substring(index + searchEntry.length);
        }

        return null;
    }

    public static getComponentUri(contentId: string, componentPath: ComponentPath, renderingMode: RenderingMode,
                                  branch: Branch = Branch.DRAFT): string {
        const componentPart: string = `_${ContentPath.ELEMENT_DIVIDER}component`;
        const componentPathStr: string = componentPath ? componentPath.toString() : '';
        const path: string = [contentId, componentPart, componentPathStr].join(ContentPath.ELEMENT_DIVIDER);
        return UriHelper.getPortalUri(path, renderingMode, branch);
    }

    public static getAdminUri(baseUrl: string, contentPath: string): string {
        const adminUrl = UriHelper.getPortalUri(contentPath, RenderingMode.ADMIN);
        return adminUrl + (adminUrl.charAt(adminUrl.length - 1) === ContentPath.ELEMENT_DIVIDER ? '' : ContentPath.ELEMENT_DIVIDER) +
               baseUrl;
    }
}
