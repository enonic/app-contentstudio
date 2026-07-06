import { type ResultAsync } from 'neverthrow';
import { type AttachmentJson } from '../../../../app/attachment/AttachmentJson';
import { Attachments } from '../../../../app/attachment/Attachments';
import { type ContentId } from '../../../../app/content/ContentId';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Fetch the attachments of a content item. Resolves `undefined` when the content
 * has none.
 * Used by: widgets/context-panel detailsWidgets.store.
 */
export function fetchContentAttachments(contentId: ContentId): ResultAsync<Attachments | undefined, AppError> {
    const url = `${getCmsApiUrl('getAttachments')}?id=${encodeURIComponent(contentId.toString())}`;

    return requestJson<AttachmentJson[]>(url).map((json) =>
        json.length > 0 ? Attachments.create().fromJson(json).build() : undefined,
    );
}
