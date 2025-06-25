import {map} from 'nanostores';
import {GetIssueStatsRequest} from '../../../app/issue/resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../../../app/issue/json/IssueStatsJson';
import {IssueServerEventsHandler} from '../../../app/issue/event/IssueServerEventsHandler';
import {$activeProject} from './projects.store';

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

    try {
        const request = new GetIssueStatsRequest();

        const activeProject = $activeProject.get();
        if (activeProject) {
            request.setRequestProject(activeProject);
        } // else: get from URL path

        const response = await request.sendAndParse();

        $issuesStats.setKey('stats', response);
    } catch (error) {
        console.error(error);
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
