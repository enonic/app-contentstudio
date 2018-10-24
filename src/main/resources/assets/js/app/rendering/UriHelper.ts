import {RenderingMode} from './RenderingMode';
import {Branch} from '../versioning/Branch';
import {ComponentPath} from '../page/region/ComponentPath';

export class UriHelper {

    public static getPortalUri(path: string, renderingMode: RenderingMode, workspace: Branch): string {
        let elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        path = api.util.UriHelper.relativePath(path);

        let workspaceName: string = Branch[workspace].toLowerCase();
        let renderingModeName: string = RenderingMode[renderingMode].toLowerCase();

        return api.util.UriHelper.getPortalUri(renderingModeName + elementDivider + workspaceName + elementDivider + path);
    }

    public static getPathFromPortalPreviewUri(portalUri: string, renderingMode: RenderingMode, workspace: Branch): string {
        let workspaceName: string = Branch[workspace].toLowerCase();
        let renderingModeName: string = RenderingMode[renderingMode].toLowerCase();

        let elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        let searchEntry = renderingModeName + elementDivider + workspaceName;

        let index = portalUri.indexOf(searchEntry);
        if (index > -1) {
            return portalUri.substring(index + searchEntry.length);
        } else {
            return null;
        }
    }

    public static getComponentUri(contentId: string, componentPath: ComponentPath, renderingMode: RenderingMode,
                                  workspace: Branch): string {
        let elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        let componentPart = elementDivider + '_' + elementDivider + 'component' + elementDivider;
        let componentPathStr = componentPath ? componentPath.toString() : '';
        return UriHelper.getPortalUri(contentId + componentPart + componentPathStr, renderingMode, workspace);
    }

    public static getAdminUri(baseUrl: string, contentPath: string): string {
        let adminUrl = UriHelper.getPortalUri(contentPath, RenderingMode.ADMIN, Branch.DRAFT);
        return adminUrl + (adminUrl.charAt(adminUrl.length - 1) === '/' ? '' : api.content.ContentPath.ELEMENT_DIVIDER) + baseUrl;
    }
}
