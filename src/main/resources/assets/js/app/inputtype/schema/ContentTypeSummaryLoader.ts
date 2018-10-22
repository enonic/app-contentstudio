import BaseLoader = api.util.loader.BaseLoader;
import ContentTypeSummaryListJson = api.schema.content.ContentTypeSummaryListJson;
import ContentId = api.content.ContentId;
import ContentTypeSummary = api.schema.content.ContentTypeSummary;
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
