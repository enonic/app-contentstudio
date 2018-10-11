import ContentIdBaseItemJson = api.content.json.ContentIdBaseItemJson;
import AggregationTypeWrapperJson = api.aggregation.AggregationTypeWrapperJson;
import {ContentMetadata} from '../../content/ContentMetadata';

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: ContentMetadata;
}
