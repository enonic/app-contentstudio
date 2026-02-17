import {type ContentSummary} from '../content/ContentSummary';
import Q from 'q';
import {GetContentTypeDescriptorsRequest} from '../resource/GetContentTypeDescriptorsRequest';
import {ProjectHelper} from '../settings/data/project/ProjectHelper';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type AggregateContentTypesResult} from '../resource/AggregateContentTypesResult';
import {AggregateContentTypesByPathRequest} from '../resource/AggregateContentTypesByPathRequest';
import {ContentPath} from '../content/ContentPath';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentId} from '../content/ContentId';
import {type Project} from '../settings/data/project/Project';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';

export interface GetTypesParams {
    contentId?: ContentId,
    allowedContentTypes?: string[],
    project?: Project
}

export class ContentTypesHelper {

    static getAvailableContentTypes(params?: GetTypesParams): Q.Promise<ContentTypeSummary[]> {
        return this.fetchAvailableTypes(params).then((types: ContentTypeSummary[]) => {
                return ContentTypesHelper.filterContentTypes(types, params?.project);
            });
    }

    private static fetchAvailableTypes(params?: GetTypesParams): Q.Promise<ContentTypeSummary[]> {
        return new GetContentTypeDescriptorsRequest()
            .setAllowedContentTypes(params?.allowedContentTypes)
            .setContentId(params?.contentId)
            .setRequestProject(params?.project)
            .sendAndParse();
    }

    private static filterContentTypes(contentTypes: ContentTypeSummary[], project?: Project): Q.Promise<ContentTypeSummary[]> {
        const isContentAdmin: boolean = AuthHelper.isContentAdmin();

        return (isContentAdmin ? Q(true) : ProjectHelper.isUserProjectOwner(project)).then((hasAdminRights: boolean) => {
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
