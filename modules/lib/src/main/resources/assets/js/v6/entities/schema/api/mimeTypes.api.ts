import { errAsync, type ResultAsync } from 'neverthrow';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

// Keyed by the sorted, comma-joined type names. Failures are evicted so a later
// lookup retries instead of replaying a cached error.
const mimeTypesCache = new Map<string, ResultAsync<string[], AppError>>();

/**
 * Fetch the accepted mime types for the given content type names.
 * Used by: entities/schema/lib/useAcceptMimeTypes.
 */
export function fetchMimeTypesByContentTypeNames(names: string[]): ResultAsync<string[], AppError> {
    const typeNames = [...names].sort().join(',');

    const cached = mimeTypesCache.get(typeNames);
    if (cached) {
        return cached;
    }

    const url = `${getCmsRestUri('schema/content/getMimeTypes')}?${new URLSearchParams({ typeNames })}`;

    const request = requestJson<string[]>(url).orElse((error) => {
        mimeTypesCache.delete(typeNames);
        return errAsync(error);
    });

    mimeTypesCache.set(typeNames, request);
    return request;
}

/**
 * Clear the mime-types cache. Intended for tests.
 */
export function clearMimeTypesCache(): void {
    mimeTypesCache.clear();
}
