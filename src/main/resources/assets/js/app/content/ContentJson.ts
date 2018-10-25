import {AttachmentJson} from '../attachment/AttachmentJson';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import {PageJson} from '../page/PageJson';
import {AccessControlEntryJson} from '../access/AccessControlEntryJson';
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import PropertyArrayJson = api.data.PropertyArrayJson;

export interface ContentJson
    extends ContentSummaryJson {

    data: PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: ExtraDataJson[];

    page: PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;
}
