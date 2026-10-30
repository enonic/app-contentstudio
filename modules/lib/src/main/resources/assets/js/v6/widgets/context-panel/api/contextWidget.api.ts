import type { AppError } from '@enonic/ui-utils';
import type { ResultAsync } from 'neverthrow';
import { requestText } from '../../../shared/api/client';
import { $config } from '../../../shared/config/config.store';
import { resolveActiveProjectName } from '../../../shared/lib/url/cms';

const CONTENT_REPO_PREFIX = 'com.enonic.cms.';

export type ContextWidgetHtmlRequest = {
    url: string;
    contentId?: string;
    projectName?: string;
    signal?: AbortSignal;
};

/**
 * Fetch the HTML of an external context widget for the given content.
 * Used by: widgets/context-panel ExternalContextWidget.
 */
export function fetchContextWidgetHtml({
    url,
    contentId,
    projectName,
    signal,
}: ContextWidgetHtmlRequest): ResultAsync<string, AppError> {
    const params = new URLSearchParams();
    if (contentId != null) params.set('contentId', contentId);
    params.set('repository', `${CONTENT_REPO_PREFIX}${projectName ?? resolveActiveProjectName() ?? ''}`);

    const branch = $config.get().branch;
    if (branch) params.set('branch', branch);

    params.set('t', String(Date.now()));

    return requestText(`${url}?${params.toString()}`, { signal });
}
