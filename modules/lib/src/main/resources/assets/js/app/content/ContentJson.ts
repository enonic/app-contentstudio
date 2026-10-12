import { type AttachmentJson } from '../attachment/AttachmentJson';
import { type MixinJson } from '../resource/json/MixinJson';
import { type PageJson } from '../page/PageJson';
import { type AccessControlEntryJson } from '../access/AccessControlEntryJson';
import type { PropertyTreeJson } from '@enonic/ui-types';
import { type ContentSummaryJson } from './ContentSummaryJson';
import { type ValidationErrorJson } from '@enonic/lib-admin-ui/ValidationErrorJson';

export interface ContentJson extends ContentSummaryJson {
    data: PropertyTreeJson;

    attachments: AttachmentJson[];

    meta: MixinJson[];

    page: PageJson;

    permissions: AccessControlEntryJson[];

    inheritPermissions: boolean;

    validationErrors: ValidationErrorJson[];
}
