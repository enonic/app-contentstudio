import { type AggregationTypeWrapperJson } from '@enonic/lib-admin-ui/aggregation/AggregationTypeWrapperJson';
import { type ContentIdBaseItemJson } from '../../../v6/entities/content/api/ContentIdBaseItemJson';
import { type ResultMetadataJson } from '../../../v6/shared/api/ResultMetadataJson';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {
    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ResultMetadataJson;
}
