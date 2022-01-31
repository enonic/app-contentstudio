import {AggregationQueryTypeWrapperJson} from 'lib-admin-ui/query/aggregation/AggregationQueryTypeWrapperJson';
import {StatusesAggregationQueryJson} from './StatusesAggregationQueryJson';

export interface StatusesAggregationQueryTypeWrapperJson extends AggregationQueryTypeWrapperJson {
    StatusesAggregationQuery?: StatusesAggregationQueryJson;
}
