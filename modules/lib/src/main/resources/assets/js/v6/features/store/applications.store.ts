import {Application} from '@enonic/lib-admin-ui/application/Application';
import {map} from 'nanostores';
import {ResultAsync} from 'neverthrow';
import {ListSiteApplicationsRequest} from '../../../app/resource/ListSiteApplicationsRequest';

//
// * Types
//

type ApplicationsStoreState = {
    applications: Application[];
    loading: boolean;
    loaded: boolean;
};

//
// * Store
//

const initialState: ApplicationsStoreState = {
    applications: [],
    loading: false,
    loaded: false,
};

export const $applications = map<ApplicationsStoreState>(structuredClone(initialState));

//
// * API
//

export function loadApplications(): Promise<void> {
    const {loading, loaded} = $applications.get();

    // Skip if already loaded or currently loading
    if (loaded || loading) {
        return;
    }

    $applications.setKey('loading', true);

    const request = new ListSiteApplicationsRequest();

    ResultAsync.fromPromise(request.sendAndParse(), (error) => {
        console.error('Failed to load applications:', error);
    }).map((applications) => {
        const sorted = applications.sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName()));

        $applications.set({
            applications: sorted,
            loading: false,
            loaded: true,
        });
    });
}

//
// * Initialization
//

void loadApplications();
