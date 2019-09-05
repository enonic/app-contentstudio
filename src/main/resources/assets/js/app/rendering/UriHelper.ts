import {RenderingMode} from './RenderingMode';
import {Branch} from '../versioning/Branch';
import {ComponentPath} from '../page/region/ComponentPath';
import {RepositoryId} from '../repository/RepositoryId';
import {RepositoryHelper} from '../repository/RepositoryHelper';
import {ContentLayer} from '../content/ContentLayer';
import {LayerContext} from '../layer/LayerContext';

export class UriHelper {

    public static getPortalUri(path: string, renderingMode: RenderingMode, repositoryId: RepositoryId, branch: Branch): string {
        const elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        path = api.util.UriHelper.relativePath(path);

        const repositoryName: string = RepositoryHelper.getContentRepoName(repositoryId);

        const branchName: string = UriHelper.getBranchName(branch);
        const renderingModeName: string = RenderingMode[renderingMode].toLowerCase();

        return api.util.UriHelper.addSitePrefix(
            renderingModeName + elementDivider + repositoryName + elementDivider + branchName + elementDivider + path);
    }

    private static getBranchName(branch: Branch): string {
        const currentLayer: ContentLayer = LayerContext.get().getCurrentLayer();

        if (currentLayer.isBaseLayer()) {
            return branch;
        }

        return `${branch}-${currentLayer.getName()}`;
    }

    public static getPathFromPortalInlineUri(portalUri: string, renderingMode: RenderingMode, repositoryId: RepositoryId,
                                             workspace: Branch): string {
        const repositoryName: string = RepositoryHelper.getContentRepoName(repositoryId);
        const renderingModeName: string = RenderingMode[renderingMode].toLowerCase();

        const elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        const searchEntry = renderingModeName + elementDivider + repositoryName + elementDivider + workspace;

        const index = portalUri.indexOf(searchEntry);
        if (index > -1) {
            return portalUri.substring(index + searchEntry.length);
        } else {
            return null;
        }
    }

    public static getComponentUri(contentId: string, componentPath: ComponentPath, renderingMode: RenderingMode, repositoryId: RepositoryId,
                                  workspace: Branch): string {
        const elementDivider = api.content.ContentPath.ELEMENT_DIVIDER;
        const componentPart = elementDivider + '_' + elementDivider + 'component' + elementDivider;
        const componentPathStr = componentPath ? componentPath.toString() : '';
        return UriHelper.getPortalUri(contentId + componentPart + componentPathStr, renderingMode, repositoryId, workspace);
    }

    public static getAdminUri(baseUrl: string, contentPath: string): string {
        const adminUrl = UriHelper.getPortalUri(contentPath, RenderingMode.ADMIN, RepositoryId.CONTENT_REPO_ID, Branch.DRAFT);
        return adminUrl + (adminUrl.charAt(adminUrl.length - 1) === '/' ? '' : api.content.ContentPath.ELEMENT_DIVIDER) + baseUrl;
    }
}
