import {type AttachmentJson} from '../attachment/AttachmentJson';
import {type ExtraDataJson} from '../resource/json/ExtraDataJson';
import {type PageJson} from '../page/PageJson';
import {type AccessControlEntryJson} from '../access/AccessControlEntryJson';
import {type PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {type ContentSummaryJson} from './ContentSummaryJson';
import {type ValidationErrorJson} from '@enonic/lib-admin-ui/ValidationErrorJson';

export interface ContentJson
    extends ContentSummaryJson {

    data: PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: ExtraDataJson[];

    page: PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;

    validationErrors: ValidationErrorJson[];
}
