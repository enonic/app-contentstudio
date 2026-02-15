import {type AggregationTypeWrapperJson} from '@enonic/lib-admin-ui/aggregation/AggregationTypeWrapperJson';
import {type ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {type ResultMetadataJson} from './ResultMetadataJson';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ResultMetadataJson;
}
