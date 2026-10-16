import { ResultAsync } from 'neverthrow';
import { Application } from '@enonic/lib-admin-ui/application/Application';
import { type ApplicationListResult } from '@enonic/lib-admin-ui/application/ApplicationListResult';
import { requestJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
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
