import {RenderingMode} from './RenderingMode';
import {Branch} from '../versioning/Branch';
import {type ComponentPath} from '../page/region/ComponentPath';
import {UriHelper as LibUriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {ProjectContext} from '../project/ProjectContext';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class UriHelper {

    /**
     * Adds a prefix to a site path.
     *
     * @param path path to append to base site URI.
     * @returns {string} the URI to a site path.
     */
    static addSitePrefix(path: string): string {
        const appId = CONFIG.has('appId') ? CONFIG.getString('appId') : 'com.enonic.app.contentstudio';
        return LibUriHelper.getAdminUri(LibUriHelper.joinPath(appId, 'site', LibUriHelper.relativePath(path)));
    }

    public static getPortalUri(path: string, renderingMode: RenderingMode, branch: Branch = Branch.DRAFT): string {
        const relPath: string = LibUriHelper.relativePath(path);
        const project: string = ProjectContext.get().getProject().getName();
        const uri: string = [renderingMode, project, branch, relPath].join(Path.DEFAULT_ELEMENT_DIVIDER);

        return UriHelper.addSitePrefix(uri);
    }

    public static getPathFromPortalInlineUri(portalUri: string, renderingMode: RenderingMode, branch: Branch = Branch.DRAFT): string {
        const project: string = ProjectContext.get().getProject().getName();
        const searchEntry: string = [renderingMode, project, branch].join(Path.DEFAULT_ELEMENT_DIVIDER);

        const index = portalUri.indexOf(searchEntry);
        if (index > -1) {
            return portalUri.substring(index + searchEntry.length);
        }

        return null;
    }

    public static getComponentUri(contentId: string, componentPath: ComponentPath, renderingMode: RenderingMode,
                                  branch: Branch = Branch.DRAFT): string {
        const componentPart: string = `_${Path.DEFAULT_ELEMENT_DIVIDER}component`;
        const componentPathStr: string = componentPath ? componentPath.toString().replace(/^\//, '') : '';
        const path: string = [contentId, componentPart, componentPathStr].join(Path.DEFAULT_ELEMENT_DIVIDER);
        return UriHelper.getPortalUri(path, renderingMode, branch);
    }

    public static getAdminUri(baseUrl: string, contentPath: string): string {
        const adminUrl = UriHelper.getPortalUri(contentPath, RenderingMode.ADMIN);
        return adminUrl + (adminUrl.charAt(adminUrl.length - 1) === Path.DEFAULT_ELEMENT_DIVIDER ? '' : Path.DEFAULT_ELEMENT_DIVIDER) +
               baseUrl;
    }
}
