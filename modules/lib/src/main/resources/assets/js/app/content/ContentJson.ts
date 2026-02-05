import {AttachmentJson} from '../attachment/AttachmentJson';
import {MixinJson} from '../resource/json/MixinJson';
import {PageJson} from '../page/PageJson';
import {AccessControlEntryJson} from '../access/AccessControlEntryJson';
import {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {ContentSummaryJson} from './ContentSummaryJson';
import {ValidationErrorJson} from '@enonic/lib-admin-ui/ValidationErrorJson';

export interface ContentJson
    extends ContentSummaryJson {

    data: PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: MixinJson[];

    page: PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;

    validationErrors: ValidationErrorJson[];
}
