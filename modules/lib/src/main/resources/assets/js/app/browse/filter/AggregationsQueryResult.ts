import {type Aggregation} from '@enonic/lib-admin-ui/aggregation/Aggregation';
import {type ResultMetadata} from '../../resource/ResultMetadata';

export class AggregationsQueryResult {

    private readonly aggregations: Aggregation[];

    private readonly metadata: ResultMetadata;

    constructor(aggregations: Aggregation[], metadata: ResultMetadata) {
        this.aggregations = aggregations;
        this.metadata = metadata;
    }

    getAggregations(): Aggregation[] {
        return this.aggregations.slice();
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

}
