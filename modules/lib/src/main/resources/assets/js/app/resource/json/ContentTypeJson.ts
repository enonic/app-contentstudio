import {type ContentTypeSummaryJson} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import {type FormJson} from '@enonic/lib-admin-ui/form/json/FormJson';

export interface ContentTypeJson
    extends ContentTypeSummaryJson {

    form: FormJson;
}
