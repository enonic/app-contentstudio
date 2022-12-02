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

export class ContentTypesHelper {

    static getAvailableContentTypes(parent?: ContentSummary): Q.Promise<ContentTypeSummary[]> {
        return Q.all([this.fetchAvailableTypes(parent), new IsAuthenticatedRequest().sendAndParse()]).spread(
            (types: ContentTypeSummary[], loginResult: LoginResult) => {
                return ContentTypesHelper.filterContentTypes(types, loginResult);
            });
    }

    private static fetchAvailableTypes(parent?: ContentSummary): Q.Promise<ContentTypeSummary[]> {
        return new GetContentTypeDescriptorsRequest()
            .setContentId(parent?.getContentId())
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
}
