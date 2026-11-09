import { ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
import { getCmsRestUri } from '../../../shared/lib/url/cms';
import { type Application, type ApplicationJson, parseApplication } from '../lib/application';

type ApplicationListJson = {
    applications: ApplicationJson[];
};

/**
 * Fetch the applications available for sites.
 * Used by: entities/application/applications.store.
 */
export function fetchSiteApplications(): ResultAsync<Application[], AppError> {
    return requestJson<ApplicationListJson>(getCmsRestUri('application/getSiteApplications')).map((json) =>
        json.applications.map(parseApplication),
    );
}
