import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {GetContentTypesByContentRequest} from '../../resource/GetContentTypesByContentRequest';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';

export class ContentTypeSummaryLoader
    extends BaseLoader<ContentTypeSummaryListJson, ContentTypeSummary> {

    constructor(contentId: ContentId) {
        super(contentId ? new GetContentTypesByContentRequest(contentId) : new GetAllContentTypesRequest());
    }

    filterFn(contentType: ContentTypeSummary) {
        return contentType.getContentTypeName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
