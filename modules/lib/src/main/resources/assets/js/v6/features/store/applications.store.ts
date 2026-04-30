import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
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

export async function loadApplications(): Promise<void> {
    const {loading, loaded} = $applications.get();

    if (loaded || loading) {
        return;
    }

    await fetchApplications();
}

export async function reloadApplications(): Promise<void> {
    const {loading} = $applications.get();

    if (loading) {
        return;
    }

    await fetchApplications();
}

async function fetchApplications(): Promise<void> {
    $applications.setKey('loading', true);

    const request = new ListSiteApplicationsRequest();

    await ResultAsync.fromPromise(request.sendAndParse(), (error) => {
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

const TRACKED_EVENT_TYPES = new Set<ApplicationEventType>([
    ApplicationEventType.INSTALLED,
    ApplicationEventType.UNINSTALLED,
    ApplicationEventType.STARTED,
    ApplicationEventType.STOPPED,
    ApplicationEventType.UPDATED,
]);

ApplicationEvent.on((event: ApplicationEvent) => {
    if (!TRACKED_EVENT_TYPES.has(event.getEventType())) {
        return;
    }
    void reloadApplications();
});
