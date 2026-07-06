import { map } from 'nanostores';
import { type IssueStatsJson } from '../../../app/issue/json/IssueStatsJson';
import { IssueServerEventsHandler } from '../../../app/issue/event/IssueServerEventsHandler';
import { $activeProject } from '../project';
import { fetchIssueStats } from './api/issuesStats.api';

type IssuesStatsStore = {
    stats?: Readonly<IssueStatsJson>;
};

export const $issuesStats = map<IssuesStatsStore>({
    stats: undefined,
});

//
// * Internal
//

let isLoading = false;
let needsReload = false;

async function loadIssuesStats(): Promise<void> {
    if (isLoading) {
        needsReload = true;
        return;
    }

    isLoading = true;

    // A nullish project name falls back to the active-project resolver in the URL builder.
    try {
        await fetchIssueStats($activeProject.get()?.getName()).match(
            (stats) => $issuesStats.setKey('stats', stats),
            (error) => console.error(error),
        );
    } finally {
        isLoading = false;
    }

    if (needsReload) {
        needsReload = false;
        await loadIssuesStats();
    }
}

//
// * Initialization
//

$activeProject.subscribe((activeProject) => {
    if (!activeProject) return;
    void loadIssuesStats();
});

IssueServerEventsHandler.getInstance().onIssueCreated(() => {
    loadIssuesStats();
});
IssueServerEventsHandler.getInstance().onIssueUpdated(() => {
    loadIssuesStats();
});
