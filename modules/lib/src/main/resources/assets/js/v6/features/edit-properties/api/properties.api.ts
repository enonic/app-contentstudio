import { ResultAsync } from 'neverthrow';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type ContentId } from '../../../../app/content/ContentId';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Update content metadata (owner). The owner is omitted from the payload when cleared.
 * Used by: features/edit-properties/model/editPropertiesDialog.store.
 */
export function updateContentMetadata(contentId: ContentId, owner?: PrincipalKey): ResultAsync<void, AppError> {
    const url = getCmsApiUrl('updateMetadata');

    const payload = {
        contentId: contentId.toString(),
        ...(owner != null && { owner: owner.toString() }),
    };

    return requestJson<unknown>(url, { method: 'POST', body: payload }).map(() => undefined);
}

/**
 * Update the content language. The language is omitted from the payload when cleared.
 * Used by: features/edit-properties/model/editPropertiesDialog.store.
 */
export function updateContentLanguage(contentId: ContentId, language?: string): ResultAsync<void, AppError> {
    const url = getCmsApiUrl('updateLanguage');

    const payload = {
        contentId: contentId.toString(),
        ...(language != null && { language }),
    };

    return requestJson<unknown>(url, { method: 'POST', body: payload }).map(() => undefined);
}
