import {AttachmentJson} from '../attachment/AttachmentJson';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import AccessControlEntryJson = api.security.acl.AccessControlEntryJson;

export interface ContentJson
    extends ContentSummaryJson {

    data: api.data.PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: ExtraDataJson[];

    page: api.content.page.PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;
}
