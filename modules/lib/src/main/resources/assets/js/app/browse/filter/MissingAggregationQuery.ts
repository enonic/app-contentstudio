import {AggregationQuery} from 'lib-admin-ui/query/aggregation/AggregationQuery';
import {MissingAggregationQueryTypeWrapperJson} from './MissingAggregationQueryTypeWrapperJson';
import {MissingAggregationQueryJson} from './MissingAggregationQueryJson';

export class MissingAggregationQuery extends AggregationQuery {

    private fieldName: string;

    toJson(): MissingAggregationQueryTypeWrapperJson {

        let json: MissingAggregationQueryJson = <MissingAggregationQueryJson>super.toAggregationQueryJson();
        json.fieldName = this.getFieldName();

        return <MissingAggregationQueryTypeWrapperJson> {
            MissingAggregationQuery: json
        };
    }

    public setFieldName(fieldName: string) {
        this.fieldName = fieldName;
    }

    public getFieldName(): string {
        return this.fieldName;
    }
}
