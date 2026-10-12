import { type ContentTypeSummaryJson } from '@enonic/lib-admin-ui/schema/content/ContentTypeSummaryJson';
import type { FormJson } from '@enonic/ui-types';

export interface ContentTypeJson extends ContentTypeSummaryJson {
    form: FormJson;
}
