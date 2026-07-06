import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type EffectivePermissionJson } from '../../../../app/resource/json/EffectivePermissionJson';
import { EffectivePermission } from '../../../../app/security/EffectivePermission';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Fetch the effective permissions of a content item.
 * Used by: widgets/context-panel detailsWidgets.store.
 */
export function fetchEffectivePermissions(contentId: ContentId): ResultAsync<EffectivePermission[], AppError> {
    const url = `${getCmsApiUrl('effectivePermissions')}?id=${encodeURIComponent(contentId.toString())}`;

    return requestJson<EffectivePermissionJson[]>(url).map((json) => json.map(EffectivePermission.fromJson));
}
