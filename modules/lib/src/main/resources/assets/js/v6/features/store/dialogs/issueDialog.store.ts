import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { computed, map } from 'nanostores';
import { IssueServerEventsHandler } from '../../../../app/issue/event/IssueServerEventsHandler';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import { GetIssueStatsRequest } from '../../../../app/issue/resource/GetIssueStatsRequest';
import { ListIssuesRequest } from '../../../../app/issue/resource/ListIssuesRequest';
import type { IssueWithAssignees } from '../../../../app/issue/IssueWithAssignees';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { $activeProject } from '../activeProject.store';

import type {
    IssueDialogFilter,
    IssueDialogListCounts,
    IssueDialogListTotals,
    IssueDialogTab,
    IssueDialogView,
} from '../../shared/dialogs/issue/issueDialog.types';

//
// * Store state
//

type IssueDialogStore = {
    // Dialog
    open: boolean;
    view: IssueDialogView;
    issueId?: string;
    // List
    loading: boolean;
    error: boolean;
    issues: IssueWithAssignees[];
    filter: IssueDialogFilter;
    tab: IssueDialogTab;
    totals: IssueDialogListTotals;
};

const EMPTY_COUNTS = { open: 0, closed: 0 };

export const ISSUE_DIALOG_FILTER_ORDER: IssueDialogFilter[] = [
    'all',
    'assignedToMe',
    'createdByMe',
    'publishRequests',
    'issues',
];

const createEmptyTotals = (): IssueDialogListTotals => ({
    all: { ...EMPTY_COUNTS },
    assignedToMe: { ...EMPTY_COUNTS },
    createdByMe: { ...EMPTY_COUNTS },
    publishRequests: { ...EMPTY_COUNTS },
    issues: { ...EMPTY_COUNTS },
});

const initialListState: Pick<IssueDialogStore, 'loading' | 'error' | 'issues' | 'filter' | 'tab' | 'totals'> = {
    loading: false,
    error: false,
    issues: [],
    filter: 'assignedToMe',
    tab: 'open',
    totals: createEmptyTotals(),
};

const initialState: IssueDialogStore = {
    open: false,
    view: 'list',
    issueId: undefined,
    ...initialListState,
};

export const $issueDialog = map<IssueDialogStore>(structuredClone(initialState));

//
// * Derived state
//

export const $issueDialogListFilteredIssues = computed($issueDialog, ({ issues, filter, tab }) => {
    return issues.filter((issue) => matchesFilter(issue, filter, tab));
});

export const $issueDialogListTabCounts = computed($issueDialog, ({ totals, filter }) => {
    return totals[filter] ?? EMPTY_COUNTS;
});

//
// * Public API
//

export const openIssueDialog = (): void => {
    const state = $issueDialog.get();
    if (state.open) {
        $issueDialog.set({
            ...state,
            view: 'list',
            issueId: undefined,
        });
        return;
    }

    $issueDialog.set({
        ...structuredClone(initialState),
        open: true,
    });
};

export const openIssueDialogDetails = (issueId: string): void => {
    const state = $issueDialog.get();
    if (state.open) {
        $issueDialog.set({
            ...state,
            view: 'details',
            issueId,
        });
        return;
    }

    $issueDialog.set({
        ...structuredClone(initialState),
        open: true,
        view: 'details',
        issueId,
    });
};

export const closeIssueDialog = (): void => {
    $issueDialog.set(structuredClone(initialState));
};

export const setIssueDialogView = (view: IssueDialogView): void => {
    if (view === 'list') {
        const state = $issueDialog.get();
        $issueDialog.set({
            ...state,
            view,
            issueId: undefined,
        });
        return;
    }

    $issueDialog.setKey('view', view);
};

export const setIssueDialogListFilter = (filter: IssueDialogFilter): void => {
    $issueDialog.setKey('filter', filter);
};

export const setIssueDialogListTab = (tab: IssueDialogTab): void => {
    $issueDialog.setKey('tab', tab);
};

export const resetIssueDialogList = (): void => {
    const { open, view, issueId } = $issueDialog.get();
    $issueDialog.set({
        ...structuredClone(initialListState),
        open,
        view,
        issueId,
    });
};

export const loadIssueDialogList = async (): Promise<void> => {
    if (isLoading) {
        needsReload = true;
        return;
    }

    isLoading = true;
    $issueDialog.setKey('loading', true);
    $issueDialog.setKey('error', false);

    try {
        const [issues, totals] = await Promise.all([fetchIssues(), fetchIssueTotals()]);

        $issueDialog.set({
            ...$issueDialog.get(),
            issues,
            totals,
            loading: false,
            error: false,
        });
        syncViewWithTotals();
    } catch (error) {
        console.error(error);
        $issueDialog.set({
            ...$issueDialog.get(),
            loading: false,
            error: true,
        });
    } finally {
        isLoading = false;
    }

    if (needsReload) {
        needsReload = false;
        await loadIssueDialogList();
    }
};

//
// * Internal
//

const LIST_PAGE_SIZE = 50;

let isLoading = false;
let needsReload = false;

const matchesFilter = (
    issueWithAssignees: IssueWithAssignees,
    filter: IssueDialogFilter,
    tab: IssueDialogTab,
): boolean => {
    const issue = issueWithAssignees.getIssue();
    const status = tab === 'open' ? IssueStatus.OPEN : IssueStatus.CLOSED;

    if (issue.getIssueStatus() !== status) {
        return false;
    }

    if (filter === 'all') {
        return true;
    }

    if (filter === 'createdByMe') {
        return issue.getCreator() === AuthContext.get().getUser().getKey().toString();
    }

    if (filter === 'assignedToMe') {
        const assignees = issueWithAssignees.getAssignees() ?? [];
        return assignees.some((assignee) => assignee.equals(AuthContext.get().getUser()));
    }

    if (filter === 'publishRequests') {
        return issue.getType() === IssueType.PUBLISH_REQUEST;
    }

    if (filter === 'issues') {
        return issue.getType() === IssueType.STANDARD;
    }

    return false;
};

const getTabCount = (counts: IssueDialogListCounts | undefined, tab: IssueDialogTab): number => {
    return (tab === 'open' ? counts?.open : counts?.closed) ?? 0;
};

// Keep the current view when it has issues; otherwise prefer the first filter with open
// issues, and only fall back to closed issues when no filter has anything open.
const syncViewWithTotals = (): void => {
    const { filter, tab, totals } = $issueDialog.get();
    if (getTabCount(totals[filter], tab) > 0) {
        return;
    }

    const openFilter = ISSUE_DIALOG_FILTER_ORDER.find((option) => getTabCount(totals[option], 'open') > 0);
    if (openFilter) {
        $issueDialog.set({ ...$issueDialog.get(), filter: openFilter, tab: 'open' });
        return;
    }

    const closedFilter = ISSUE_DIALOG_FILTER_ORDER.find((option) => getTabCount(totals[option], 'closed') > 0);
    if (closedFilter) {
        $issueDialog.set({ ...$issueDialog.get(), filter: closedFilter, tab: 'closed' });
    }
};

const fetchIssues = async (): Promise<IssueWithAssignees[]> => {
    const issues: IssueWithAssignees[] = [];
    let total = 0;
    let from = 0;

    const activeProject = $activeProject.get();

    do {
        const request = new ListIssuesRequest().setResolveAssignees(true).setFrom(from).setSize(LIST_PAGE_SIZE);

        if (activeProject) {
            request.setRequestProject(activeProject);
        }

        const response = await request.sendAndParse();
        const batch = response.getIssues();
        issues.push(...batch);
        total = response.getMetadata().getTotalHits();
        from = issues.length;
    } while (issues.length < total);

    issues.sort((a, b) => {
        return b.getIssue().getModifiedTime().getTime() - a.getIssue().getModifiedTime().getTime();
    });

    return issues;
};

const fetchIssueTotals = async (): Promise<IssueDialogListTotals> => {
    const activeProject = $activeProject.get();

    const allStatsRequest = new GetIssueStatsRequest();
    const publishRequestStatsRequest = new GetIssueStatsRequest(IssueType.PUBLISH_REQUEST);
    const issueStatsRequest = new GetIssueStatsRequest(IssueType.STANDARD);

    if (activeProject) {
        allStatsRequest.setRequestProject(activeProject);
        publishRequestStatsRequest.setRequestProject(activeProject);
        issueStatsRequest.setRequestProject(activeProject);
    }

    const [allStats, publishRequestStats, issueStats] = await Promise.all([
        allStatsRequest.sendAndParse(),
        publishRequestStatsRequest.sendAndParse(),
        issueStatsRequest.sendAndParse(),
    ]);

    return {
        all: {
            open: allStats.open ?? 0,
            closed: allStats.closed ?? 0,
        },
        assignedToMe: {
            open: allStats.openAssignedToMe ?? 0,
            closed: allStats.closedAssignedToMe ?? 0,
        },
        createdByMe: {
            open: allStats.openCreatedByMe ?? 0,
            closed: allStats.closedCreatedByMe ?? 0,
        },
        publishRequests: {
            open: publishRequestStats.open ?? 0,
            closed: publishRequestStats.closed ?? 0,
        },
        issues: {
            open: issueStats.open ?? 0,
            closed: issueStats.closed ?? 0,
        },
    };
};

const queueReload = createDebounce(() => {
    void loadIssueDialogList();
}, 250);

const triggerReload = (): void => {
    if (isLoading) {
        needsReload = true;
        return;
    }

    const { open } = $issueDialog.get();
    if (!open) {
        needsReload = true;
        return;
    }

    queueReload();
};

//
// * Initialization
//

$activeProject.subscribe((activeProject) => {
    if (!activeProject) {
        return;
    }
    triggerReload();
});

let wasOpen = $issueDialog.get().open;

$issueDialog.subscribe(({ open }) => {
    if (!wasOpen && open) {
        void loadIssueDialogList();
    }
    wasOpen = open;
});

IssueServerEventsHandler.getInstance().onIssueCreated(() => {
    triggerReload();
});
IssueServerEventsHandler.getInstance().onIssueUpdated(() => {
    triggerReload();
});
