import { okAsync, type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

type ContentTypeJson = {
    allowChildContent?: boolean;
};

const cache = new Map<string, boolean>();

/**
 * Fetch whether content of the given type may have children. Answers are kept
 * until `clearAllowsChildContentCache` is called.
 * Used by: pages/browse/model/browseActions.service.
 */
export function fetchAllowsChildContent(contentTypeName: string): ResultAsync<boolean, AppError> {
    const cached = cache.get(contentTypeName);
    if (cached !== undefined) {
        return okAsync(cached);
    }

    const url = `${getCmsRestUri('schema/content')}?name=${encodeURIComponent(contentTypeName)}`;

    return requestJson<ContentTypeJson>(url).map((json) => {
        const allowed = json.allowChildContent === true;
        cache.set(contentTypeName, allowed);
        return allowed;
    });
}

export function clearAllowsChildContentCache(): void {
    cache.clear();
}
