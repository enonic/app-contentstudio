import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeIconUrlResolver} from './ContentTypeIconUrlResolver';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';

export class ContentTypeSummaryViewer
    extends NamesAndIconViewer<ContentTypeSummary> {

    private contentTypeIconUrlResolver: ContentTypeIconUrlResolver;

    constructor() {
        super();
        this.contentTypeIconUrlResolver = new ContentTypeIconUrlResolver();
    }

    resolveDisplayName(object: ContentTypeSummary): string {
        return object.getDisplayName();
    }

    resolveSubName(object: ContentTypeSummary): string {
        return object.getName();
    }

    resolveIconUrl(object: ContentTypeSummary): string {
        return this.contentTypeIconUrlResolver.resolve(object);
    }

}
