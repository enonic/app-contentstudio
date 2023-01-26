import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {GetContentTypesByContentRequest} from '../../resource/GetContentTypesByContentRequest';
import {GetAllContentTypesRequest} from '../../resource/GetAllContentTypesRequest';
import {ContentId} from '../../content/ContentId';
import {Project} from '../../settings/data/project/Project';

export class ContentTypeSummaryLoader
    extends BaseLoader<ContentTypeSummary> {

    constructor(contentId: ContentId, project?: Project) {
        super(contentId ? new GetContentTypesByContentRequest(contentId).setRequestProject(project) : new GetAllContentTypesRequest());
    }

    filterFn(contentType: ContentTypeSummary) {
        const searchString: string = this.getSearchString().toLowerCase().trim();
        if (searchString.length === 0) {
            return true;
        }
        return contentType.getDisplayName().toLowerCase().indexOf(searchString) !== -1 ||
                contentType.getContentTypeName().toString().indexOf(searchString) !== -1;
    }

}
