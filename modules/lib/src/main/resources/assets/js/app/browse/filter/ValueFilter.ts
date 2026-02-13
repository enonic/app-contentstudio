import {Filter} from '@enonic/lib-admin-ui/query/filter/Filter';
import {type ValueFilterWrapperJson} from './ValueFilterWrapperJson';

export class ValueFilter
    extends Filter {

    private readonly fieldName: string;

    private readonly value: string;

    constructor(fieldName: string, value: string) {
        super();

        this.fieldName = fieldName;
        this.value = value;
    }

    toJson(): ValueFilterWrapperJson {
        return {
            ValueFilter: {fieldName: this.fieldName, value: this.value}
        };
    }

}
