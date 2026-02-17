import type Q from 'q';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {GetNearestSiteRequest} from '../../resource/GetNearestSiteRequest';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {type Site} from '../../content/Site';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {type ContentId} from '../../content/ContentId';
import {type Project} from '../../settings/data/project/Project';

export class PageTemplateContentTypeLoader
    extends BaseLoader<ContentTypeSummary> {

    private contentId: ContentId;

    private project?: Project;

    constructor(contentId: ContentId, project?: Project) {
        super(new GetAllContentTypesRequest());

        this.contentId = contentId;
        this.project = project;
    }

    filterFn(contentType: ContentTypeSummary) {
        const searchString = this.getSearchString().toLowerCase();
        return contentType.getContentTypeName().toString().indexOf(searchString) !== -1 ||
               contentType.getDisplayName().toString().toLowerCase().indexOf(searchString) !== -1;
    }

    sendRequest(): Q.Promise<ContentTypeSummary[]> {
        return new GetAllContentTypesRequest().sendAndParse().then((contentTypeArray: ContentTypeSummary[]) => {
            return new GetNearestSiteRequest(this.contentId).setRequestProject(this.project).sendAndParse().then(
                (parentSite: Site) => {
                    const typesAllowedEverywhere: Record<string, ContentTypeName> = {};
                    [ContentTypeName.UNSTRUCTURED, ContentTypeName.FOLDER, ContentTypeName.SITE].forEach((contentTypeName: ContentTypeName) => {
                        typesAllowedEverywhere[contentTypeName.toString()] = contentTypeName;
                    });
                    const siteApplications: Record<string, ApplicationKey> = {};
                    parentSite.getApplicationKeys().forEach((applicationKey: ApplicationKey) => {
                        siteApplications[applicationKey.toString()] = applicationKey;
                    });

                    return contentTypeArray.filter((item: ContentTypeSummary) => {
                        const contentTypeName = item.getContentTypeName();
                        if (item.isAbstract()) {
                            return false;
                        } else if (contentTypeName.isDescendantOfMedia()) {
                            return true;
                        } else if (typesAllowedEverywhere[contentTypeName.toString()]) {
                            return true;
                        } else if (siteApplications[contentTypeName.getApplicationKey().toString()]) {
                            return true;
                        } else {
                            return false;
                        }

                    });
                });
        });
    }
}
