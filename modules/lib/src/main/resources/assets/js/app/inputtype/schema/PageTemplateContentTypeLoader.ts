import * as Q from 'q';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {GetNearestSiteRequest} from '../../resource/GetNearestSiteRequest';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {Site} from '../../content/Site';
import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';

export class PageTemplateContentTypeLoader
    extends BaseLoader<ContentTypeSummary> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super(new GetAllContentTypesRequest());
        this.contentId = contentId;
    }

    filterFn(contentType: ContentTypeSummary) {
        const searchString = this.getSearchString().toLowerCase();
        return contentType.getContentTypeName().toString().indexOf(searchString) !== -1 ||
               contentType.getDisplayName().toString().toLowerCase().indexOf(searchString) !== -1;
    }

    sendRequest(): Q.Promise<ContentTypeSummary[]> {
        return new GetAllContentTypesRequest().sendAndParse().then((contentTypeArray: ContentTypeSummary[]) => {
            return new GetNearestSiteRequest(this.contentId).sendAndParse().then(
                (parentSite: Site) => {
                    let typesAllowedEverywhere: { [key: string]: ContentTypeName } = {};
                    [ContentTypeName.UNSTRUCTURED, ContentTypeName.FOLDER, ContentTypeName.SITE,
                        ContentTypeName.SHORTCUT].forEach((contentTypeName: ContentTypeName) => {
                        typesAllowedEverywhere[contentTypeName.toString()] = contentTypeName;
                    });
                    let siteApplications: { [key: string]: ApplicationKey } = {};
                    parentSite.getApplicationKeys().forEach((applicationKey: ApplicationKey) => {
                        siteApplications[applicationKey.toString()] = applicationKey;
                    });

                    return contentTypeArray.filter((item: ContentTypeSummary) => {
                        let contentTypeName = item.getContentTypeName();
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
