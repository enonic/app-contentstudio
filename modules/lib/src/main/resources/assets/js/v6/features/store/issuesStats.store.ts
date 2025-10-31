import {map} from 'nanostores';
import {GetIssueStatsRequest} from '../../../app/issue/resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../../../app/issue/json/IssueStatsJson';
import {IssueServerEventsHandler} from '../../../app/issue/event/IssueServerEventsHandler';

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

void loadIssuesStats();

IssueServerEventsHandler.getInstance().onIssueCreated(() => {
    loadIssuesStats();
});
IssueServerEventsHandler.getInstance().onIssueUpdated(() => {
    loadIssuesStats();
});
