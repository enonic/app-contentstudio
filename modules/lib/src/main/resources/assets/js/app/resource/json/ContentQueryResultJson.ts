import {AggregationTypeWrapperJson} from 'lib-admin-ui/aggregation/AggregationTypeWrapperJson';
import {ContentMetadata} from '../../content/ContentMetadata';
import {ContentIdBaseItemJson} from './ResolvePublishContentResultJson';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ContentMetadata;
}
