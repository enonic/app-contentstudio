import {ContentTypeSummaryJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface ContentTypeJson
    extends ContentTypeSummaryJson {

    form: FormJson;
}
