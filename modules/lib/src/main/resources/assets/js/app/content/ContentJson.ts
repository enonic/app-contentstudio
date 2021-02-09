import {AttachmentJson} from '../attachment/AttachmentJson';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import {PageJson} from '../page/PageJson';
import {AccessControlEntryJson} from '../access/AccessControlEntryJson';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {PropertyArrayJson} from 'lib-admin-ui/data/PropertyArrayJson';

export interface ContentJson
    extends ContentSummaryJson {

    data: PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: ExtraDataJson[];

    page: PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;
}
