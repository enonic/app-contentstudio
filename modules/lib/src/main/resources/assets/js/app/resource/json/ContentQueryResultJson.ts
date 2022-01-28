import {AggregationTypeWrapperJson} from 'lib-admin-ui/aggregation/AggregationTypeWrapperJson';
import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {ResultMetadataJson} from './ResultMetadataJson';
import {StatusesJson} from './StatusesJson';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ResultMetadataJson;
    statuses: StatusesJson;
}
