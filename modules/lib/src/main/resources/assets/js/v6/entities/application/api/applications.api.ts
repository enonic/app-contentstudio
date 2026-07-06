import { ResultAsync } from 'neverthrow';
import { Application } from '@enonic/lib-admin-ui/application/Application';
import { type ApplicationListResult } from '@enonic/lib-admin-ui/application/ApplicationListResult';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsRestUri } from '../../../shared/lib/url/cms';

/**
 * Fetch the applications available for sites.
 * Used by: entities/application/applications.store.
 */
export function fetchSiteApplications(): ResultAsync<Application[], AppError> {
    return requestJson<ApplicationListResult>(getCmsRestUri('application/getSiteApplications')).map((json) =>
        Application.fromJsonArray(json.applications),
    );
}
