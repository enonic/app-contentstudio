import {AttachmentJson} from '../attachment/AttachmentJson';
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import AccessControlEntryJson = api.security.acl.AccessControlEntryJson;

export interface ContentJson
    extends ContentSummaryJson {

    data: api.data.PropertyArrayJson[];

    attachments: AttachmentJson[];

    meta: api.content.json.ExtraDataJson[];

    page: api.content.page.PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;
}
