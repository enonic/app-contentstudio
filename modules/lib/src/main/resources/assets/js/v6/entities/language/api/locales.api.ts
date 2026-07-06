import { ResultAsync } from 'neverthrow';
import { Locale } from '@enonic/lib-admin-ui/locale/Locale';
import { type LocaleListJson } from '@enonic/lib-admin-ui/locale/json/LocaleListJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

/**
 * Fetch the available content locales, sorted by display name.
 * Used by: entities/language/languages.store.
 */
export function fetchLocales(): ResultAsync<Locale[], AppError> {
    return requestJson<LocaleListJson>(getCmsRestUri('content/locales')).map((json) =>
        json.locales.map(Locale.fromJson).sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
    );
}
