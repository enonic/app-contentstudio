import {FilterTypeWrapperJson} from 'lib-admin-ui/query/filter/FilterTypeWrapperJson';

export interface ExistsFilterWrapperJson
    extends FilterTypeWrapperJson {

    ExistsFilter?: { fieldName: string }
}
