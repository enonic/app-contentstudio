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

export class ContentTypesHelper {

    static getAvailableContentTypes(contentId?: ContentId, allowedContentTypes?: string[]): Q.Promise<ContentTypeSummary[]> {
        return Q.all([this.fetchAvailableTypes(contentId, allowedContentTypes), new IsAuthenticatedRequest().sendAndParse()]).spread(
            (types: ContentTypeSummary[], loginResult: LoginResult) => {
                return ContentTypesHelper.filterContentTypes(types, loginResult);
            });
    }

    private static fetchAvailableTypes(contentId?: ContentId, allowedContentTypes?: string[]): Q.Promise<ContentTypeSummary[]> {
        return new GetContentTypeDescriptorsRequest()
            .setAllowedContentTypes(allowedContentTypes)
            .setContentId(contentId)
            .sendAndParse();
    }

    private static filterContentTypes(contentTypes: ContentTypeSummary[], loginResult: LoginResult): Q.Promise<ContentTypeSummary[]> {
        const isContentAdmin: boolean = loginResult.isContentAdmin();

        return (isContentAdmin ? Q(true) : ProjectHelper.isUserProjectOwner(loginResult)).then((hasAdminRights: boolean) => {
            return Q(hasAdminRights ? contentTypes : ContentTypesHelper.getContentTypesWithoutSite(contentTypes));
        });
    }

    private static getContentTypesWithoutSite(contentTypes: ContentTypeSummary[]): ContentTypeSummary[] {
        return contentTypes.filter((contentType: ContentTypeSummary) => !contentType.isSite());
    }

    static getAggregatedTypesByContent(parent?: ContentSummary): Q.Promise<AggregateContentTypesResult> {
        return new AggregateContentTypesByPathRequest(parent?.getPath() || ContentPath.getRoot()).sendAndParse();
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
