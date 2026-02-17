import {type FilterTypeWrapperJson} from '@enonic/lib-admin-ui/query/filter/FilterTypeWrapperJson';

export interface ValueFilterWrapperJson
    extends FilterTypeWrapperJson {

    ValueFilter?: { fieldName: string, value: string }
}
