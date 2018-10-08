import ContentIdBaseItemJson = api.content.json.ContentIdBaseItemJson;
import AggregationTypeWrapperJson = api.aggregation.AggregationTypeWrapperJson;

export interface ContentQueryResultJson<T extends ContentIdBaseItemJson> {

    aggregations: AggregationTypeWrapperJson[];
    contents: T[];
    metadata: api.content.ContentMetadata;
}
