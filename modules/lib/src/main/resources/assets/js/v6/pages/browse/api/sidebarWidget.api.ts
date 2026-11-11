import type { AppError } from '@enonic/ui-utils';
import type { ResultAsync } from 'neverthrow';
import { requestText } from '../../../shared/api/client';

/**
 * Fetch the HTML of an external sidebar widget (a `contentstudio.menuitem` extension).
 * Used by: pages/browse ExternalSidebarWidget.
 */
export function fetchSidebarWidgetHtml(url: string, signal?: AbortSignal): ResultAsync<string, AppError> {
    return requestText(url, { signal });
}
