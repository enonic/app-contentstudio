import {AggregationTypeWrapperJson} from '@enonic/lib-admin-ui/aggregation/AggregationTypeWrapperJson';
import {ContentIdBaseItemJson} from './ContentIdBaseItemJson';
import {ResultMetadataJson} from './ResultMetadataJson';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ResultMetadataJson;
}
