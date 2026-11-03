import { handleError } from '../../shared/notifications';
import { map } from 'nanostores';
import { fetchSiteApplications } from './api/applications.api';
import { type Application } from './lib/application';
import { type ApplicationEventKind, onApplicationEvent } from './lib/applicationEvents';

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
    const { loading, loaded } = $applications.get();

    if (loaded || loading) {
        return;
    }

    await fetchApplications();
}

export async function reloadApplications(): Promise<void> {
    const { loading } = $applications.get();

    if (loading) {
        return;
    }

    await fetchApplications();
}

async function fetchApplications(): Promise<void> {
    $applications.setKey('loading', true);

    await fetchSiteApplications().match(
        (applications) => {
            const sorted = applications.sort((a, b) => a.displayName.localeCompare(b.displayName));

            $applications.set({
                applications: sorted,
                loading: false,
                loaded: true,
            });
        },
        (error) => {
            handleError(error);
            $applications.setKey('loading', false);
        },
    );
}

//
// * Initialization
//

const TRACKED_EVENT_KINDS = new Set<ApplicationEventKind>([
    'installed',
    'uninstalled',
    'started',
    'stopped',
    'updated',
]);

onApplicationEvent(({ kind }) => {
    if (!TRACKED_EVENT_KINDS.has(kind)) {
        return;
    }
    void reloadApplications();
});
