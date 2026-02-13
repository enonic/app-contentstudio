import {Filter} from '@enonic/lib-admin-ui/query/filter/Filter';
import {type ExistsFilterWrapperJson} from './ExistsFilterWrapperJson';

export class ExistsFilter
    extends Filter {

    private readonly fieldName: string;

    constructor(fieldName: string) {
        super();

        this.fieldName = fieldName;
    }

    toJson(): ExistsFilterWrapperJson {
        return {
            ExistsFilter: {fieldName: this.fieldName}
        };
    }

}
