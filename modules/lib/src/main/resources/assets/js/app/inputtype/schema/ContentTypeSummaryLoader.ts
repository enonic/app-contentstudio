import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {GetContentTypesByContentRequest} from '../../resource/GetContentTypesByContentRequest';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {ContentId} from '../../content/ContentId';

export class ContentTypeSummaryLoader
    extends BaseLoader<ContentTypeSummary> {

    constructor(contentId: ContentId) {
        super(contentId ? new GetContentTypesByContentRequest(contentId) : new GetAllContentTypesRequest());
    }

    filterFn(contentType: ContentTypeSummary) {
        return contentType.getContentTypeName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
    }

}
