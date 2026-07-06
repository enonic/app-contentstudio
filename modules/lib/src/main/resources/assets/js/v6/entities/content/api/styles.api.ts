import { okAsync, type ResultAsync } from 'neverthrow';
import { type StyleJson } from '../../../../app/inputtype/ui/text/styles/StylesDescriptor';
import { Styles } from '../../../../app/inputtype/ui/text/styles/Styles';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';
import { resolveActiveProjectName } from '../../../shared/lib/url/cms';

type GetStylesJson = {
    css: string[];
    styles: StyleJson[];
};

// In-flight requests keyed by contentId dedupe concurrent callers onto one fetch.
// The entry is cleared once the request settles (on success and failure alike),
// so a failed request can be retried and a successful one falls through to the
// permanent `Styles` singleton short-circuit on the next call.
const inFlight = new Map<string, ResultAsync<Styles, AppError>>();

function getStylesUrl(contentId: string, projectName?: string): string {
    const project = projectName ?? resolveActiveProjectName() ?? '';
    const params = new URLSearchParams({ contentId, project });
    return `${$config.get().services.stylesUrl}?${params.toString()}`;
}

/**
 * Fetch the CSS paths and image styles registered for a content, then construct
 * the `Styles` singleton it self-registers in `Styles.INSTANCES` — read
 * synchronously afterwards by the CKEditor config and the html-area image dialog.
 * Short-circuits to the cached singleton on repeat calls.
 * Used by: features/shared/form/input-types/html-area/useCKEditorConfig,
 * features/rich-text-inserts/ui/htmlarea-image/HtmlAreaImageDialogContext.
 */
export function fetchStyles(contentId: string, projectName?: string): ResultAsync<Styles, AppError> {
    const cached = Styles.getInstance(contentId);
    if (cached) {
        return okAsync(cached);
    }

    const pending = inFlight.get(contentId);
    if (pending) {
        return pending;
    }

    const request = requestJson<GetStylesJson>(getStylesUrl(contentId, projectName))
        .map((json) => new Styles(contentId, json))
        .andTee(() => inFlight.delete(contentId))
        .orTee(() => inFlight.delete(contentId));

    inFlight.set(contentId, request);

    return request;
}
