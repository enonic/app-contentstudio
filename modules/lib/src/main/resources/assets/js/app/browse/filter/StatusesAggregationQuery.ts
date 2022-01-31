import {AggregationQuery} from 'lib-admin-ui/query/aggregation/AggregationQuery';
import {StatusesAggregationQueryTypeWrapperJson} from './StatusesAggregationQueryTypeWrapperJson';

export class StatusesAggregationQuery
    extends AggregationQuery {

    constructor() {
        super('statuses');
    }

    toJson(): StatusesAggregationQueryTypeWrapperJson {
        const json: StatusesAggregationQueryTypeWrapperJson = <StatusesAggregationQueryTypeWrapperJson>super.toAggregationQueryJson();

        return <StatusesAggregationQueryTypeWrapperJson>{
            StatusesAggregationQuery: json
        };
    }
}
