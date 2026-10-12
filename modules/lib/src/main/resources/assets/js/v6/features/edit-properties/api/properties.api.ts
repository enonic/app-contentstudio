import { ResultAsync } from 'neverthrow';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { type Content } from '../../../../app/content/Content';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { parseContent } from '../../../entities/content/lib/parseContent';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Update content metadata (owner). The owner is omitted from the payload when cleared.
 * Used by: features/edit-properties/model/editPropertiesDialog.store.
 */
export function updateContentMetadata(contentId: ContentId, owner?: PrincipalKey): ResultAsync<Content, AppError> {
    const url = getCmsApiUrl('updateMetadata');

    const payload = {
        contentId: contentId.toString(),
        ...(owner != null && { owner: owner.toString() }),
    };

    return requestJson<ContentJson>(url, { method: 'POST', body: payload }).map(parseContent);
}

/**
 * Update the content language. The language is omitted from the payload when cleared.
 * Used by: features/edit-properties/model/editPropertiesDialog.store.
 */
export function updateContentLanguage(contentId: ContentId, language?: string): ResultAsync<Content, AppError> {
    const url = getCmsApiUrl('updateLanguage');

    const payload = {
        contentId: contentId.toString(),
        ...(language != null && { language }),
    };

    return requestJson<ContentJson>(url, { method: 'POST', body: payload }).map(parseContent);
}
