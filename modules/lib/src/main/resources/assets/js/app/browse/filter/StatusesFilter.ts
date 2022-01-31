import {Filter} from 'lib-admin-ui/query/filter/Filter';
import {FilterTypeWrapperJson} from 'lib-admin-ui/query/filter/FilterTypeWrapperJson';

export class StatusesFilter
    extends Filter {

    private readonly statuses: string[];

    constructor(statuses: string[]) {
        super();

        this.statuses = statuses;
    }

    toJson(): FilterTypeWrapperJson {
        let json = {
            statuses: this.statuses
        };

        return <FilterTypeWrapperJson> {
            StatusesFilter: json
        };
    }
}
