import { type ResultAsync } from 'neverthrow';
import type { AppError } from '@enonic/ui-utils';
import { requestHead } from '../../../shared/api/client';

/**
 * HEAD-probes a preview extension URL. Any HTTP status is a valid answer: the status
 * and the `enonic-widget-data` header tell whether the extension can render the content.
 *
 * Used by: previewResolution.service
 */
export function probePreview(url: string, signal?: AbortSignal): ResultAsync<Response, AppError> {
    return requestHead(url, { signal });
}
