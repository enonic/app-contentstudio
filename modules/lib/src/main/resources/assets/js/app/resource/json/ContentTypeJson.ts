import {ContentTypeSummaryJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {FormJson} from 'lib-admin-ui/form/json/FormJson';

export interface ContentTypeJson
    extends ContentTypeSummaryJson {

    form: FormJson;
}
