import {ContentSummary} from '../content/ContentSummary';
import * as Q from 'q';
import {GetContentTypeDescriptorsRequest} from '../resource/GetContentTypeDescriptorsRequest';
import {ProjectHelper} from '../settings/data/project/ProjectHelper';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {AggregateContentTypesResult} from '../resource/AggregateContentTypesResult';
import {AggregateContentTypesByPathRequest} from '../resource/AggregateContentTypesByPathRequest';
import {ContentPath} from '../content/ContentPath';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentId} from '../content/ContentId';
import {Project} from '../settings/data/project/Project';

export interface GetTypesParams {
    contentId?: ContentId,
    allowedContentTypes?: string[],
    project?: Project
}

export class ContentTypesHelper {

    static getAvailableContentTypes(params?: GetTypesParams): Q.Promise<ContentTypeSummary[]> {
        return Q.all([this.fetchAvailableTypes(params), new IsAuthenticatedRequest().sendAndParse()]).spread(
            (types: ContentTypeSummary[], loginResult: LoginResult) => {
                return ContentTypesHelper.filterContentTypes(types, loginResult, params?.project);
            });
    }

    private static fetchAvailableTypes(params?: GetTypesParams): Q.Promise<ContentTypeSummary[]> {
        return new GetContentTypeDescriptorsRequest()
            .setAllowedContentTypes(params?.allowedContentTypes)
            .setContentId(params?.contentId)
            .setRequestProject(params?.project)
            .sendAndParse();
    }

    private static filterContentTypes(contentTypes: ContentTypeSummary[], loginResult: LoginResult, project?: Project): Q.Promise<ContentTypeSummary[]> {
        const isContentAdmin: boolean = loginResult.isContentAdmin();

        return (isContentAdmin ? Q(true) : ProjectHelper.isUserProjectOwner(loginResult, project)).then((hasAdminRights: boolean) => {
            return Q(hasAdminRights ? contentTypes : ContentTypesHelper.getContentTypesWithoutSite(contentTypes));
        });
    }

    private static getContentTypesWithoutSite(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
        return contentTypes.filter((contentType: ContentTypeSummary) => !contentType.isSite());
    }

    static getAggregatedTypesByContent(parent?: ContentSummary, project?: Project): Q.Promise<AggregateContentTypesResult> {
        return new AggregateContentTypesByPathRequest(parent?.getPath() || ContentPath.getRoot(), project).sendAndParse();
    }

    static isMediaChildContentAllowedByType(type: ContentTypeSummary): boolean {
        return type.isAllowChildContent() && ContentTypesHelper.isMediaChildContentAllowed(type.getAllowedChildContentTypes());
    }

    static isMediaChildContentAllowed(allowedTypes: string[]): boolean {
        return !allowedTypes ||
               allowedTypes.length === 0 ||
               allowedTypes
                   .map((typeName: string) => new ContentTypeName(typeName))
                   .some((type: ContentTypeName) => type.isMedia() || type.isDescendantOfMedia());
    }
}
