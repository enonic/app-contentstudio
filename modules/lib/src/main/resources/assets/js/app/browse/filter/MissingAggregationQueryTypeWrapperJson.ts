import {AggregationQueryTypeWrapperJson} from 'lib-admin-ui/query/aggregation/AggregationQueryTypeWrapperJson';
import {MissingAggregationQueryJson} from './MissingAggregationQueryJson';

export interface MissingAggregationQueryTypeWrapperJson
    extends AggregationQueryTypeWrapperJson {

    MissingAggregationQuery?: MissingAggregationQueryJson;
}
