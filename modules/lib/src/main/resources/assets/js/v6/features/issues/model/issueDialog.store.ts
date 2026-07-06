import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { type Result, err, ok } from 'neverthrow';
import { computed, map } from 'nanostores';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import type { IssueWithAssignees } from '../../../../app/issue/IssueWithAssignees';
import { type AppError } from '../../../shared/api/errors';
import { fetchIssueStats } from '../../../entities/issue/api/issuesStats.api';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { $activeProject } from '../../../entities/project/activeProject.store';
import { listIssues } from '../../../entities/issue/api/issues.api';

import type {
    IssueDialogFilter,
    IssueDialogListCounts,
    IssueDialogListTotals,
    IssueDialogTab,
    IssueDialogView,
} from '../ui/issue/issueDialog.types';

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
        const [issuesResult, totalsResult] = await Promise.all([fetchIssues(), fetchIssueTotals()]);

        if (issuesResult.isErr()) {
            handleLoadError(issuesResult.error);
        } else if (totalsResult.isErr()) {
            handleLoadError(totalsResult.error);
        } else {
            $issueDialog.set({
                ...$issueDialog.get(),
                issues: issuesResult.value,
                totals: totalsResult.value,
                loading: false,
                error: false,
            });
            syncViewWithTotals();
        }
    } catch (error) {
        // Throws escaping the Result contract (e.g. a parse or sort failure)
        // must not wedge the load state machine.
        handleLoadError(error);
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

const handleLoadError = (error: unknown): void => {
    console.error(error);
    $issueDialog.set({
        ...$issueDialog.get(),
        loading: false,
        error: true,
    });
};

// Pages through the list endpoint until every issue is loaded, then re-sorts by
// modified time (the api leaves ordering to the caller).
const fetchIssues = async (): Promise<Result<IssueWithAssignees[], AppError>> => {
    const issues: IssueWithAssignees[] = [];
    let total = 0;
    let from = 0;

    do {
        const result = await listIssues({ from, size: LIST_PAGE_SIZE });
        if (result.isErr()) {
            return err(result.error);
        }

        // An empty page while totalHits still claims more means the total is
        // stale (issues deleted or ACL-hidden mid-pagination) — stop looping.
        if (result.value.issues.length === 0) {
            break;
        }

        issues.push(...result.value.issues);
        total = result.value.totalHits;
        from = issues.length;
    } while (issues.length < total);

    issues.sort((a, b) => {
        return b.getIssue().getModifiedTime().getTime() - a.getIssue().getModifiedTime().getTime();
    });

    return ok(issues);
};

const fetchIssueTotals = async (): Promise<Result<IssueDialogListTotals, AppError>> => {
    const projectName = $activeProject.get()?.getName();

    const [allStatsResult, publishRequestStatsResult, issueStatsResult] = await Promise.all([
        fetchIssueStats(projectName),
        fetchIssueStats(projectName, IssueType.PUBLISH_REQUEST),
        fetchIssueStats(projectName, IssueType.STANDARD),
    ]);

    if (allStatsResult.isErr()) {
        return err(allStatsResult.error);
    }
    if (publishRequestStatsResult.isErr()) {
        return err(publishRequestStatsResult.error);
    }
    if (issueStatsResult.isErr()) {
        return err(issueStatsResult.error);
    }

    const allStats = allStatsResult.value;
    const publishRequestStats = publishRequestStatsResult.value;
    const issueStats = issueStatsResult.value;

    return ok({
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
    });
};

const queueReload = createDebounce(() => {
    void loadIssueDialogList();
}, 250);

// Debounced list reload gated on the load state machine; shared with the service wiring.
export const triggerReload = (): void => {
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
