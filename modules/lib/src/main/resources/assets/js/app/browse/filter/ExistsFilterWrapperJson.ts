import {type FilterTypeWrapperJson} from '@enonic/lib-admin-ui/query/filter/FilterTypeWrapperJson';

export interface ExistsFilterWrapperJson
    extends FilterTypeWrapperJson {

    ExistsFilter?: { fieldName: string }
}
