import {AttachmentJson} from '../attachment/AttachmentJson';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import {PageJson} from '../page/PageJson';
import {AccessControlEntryJson} from '../access/AccessControlEntryJson';
import {PropertyArrayJson} from 'lib-admin-ui/data/PropertyArrayJson';
import {ContentSummaryJson} from './ContentSummaryJson';
import {ValidationErrorJson} from 'lib-admin-ui/ValidationErrorJson';

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
