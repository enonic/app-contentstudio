import {SchemaJson} from 'lib-admin-ui/schema/SchemaJson';
import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';

export interface ContentTypeSummaryListJson
    extends SchemaJson {

    total: number;
    totalHits: number;
    hits: number;

    contentTypes: ContentTypeSummaryJson[];
}
