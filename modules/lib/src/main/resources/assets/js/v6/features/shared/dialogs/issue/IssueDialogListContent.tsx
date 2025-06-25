import {Button, Dialog, Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Plus} from 'lucide-react';
import {useMemo, type ReactElement} from 'react';

import {IssueDialogsManager} from '../../../../../app/issue/IssueDialogsManager';
import {useI18n} from '../../../hooks/useI18n';
import {
    $issueDialog,
    $issueDialogListFilteredIssues,
    $issueDialogListTabCounts,
    openIssueDialogDetails,
    setIssueDialogListFilter,
    setIssueDialogListTab,
} from '../../../store/dialogs/issueDialog.store';
import {IssueList} from './IssueList';
import {IssueDialogSelector} from './IssueDialogSelector';

import type {IssueWithAssignees} from '../../../../../app/issue/IssueWithAssignees';
import type {IssueDialogFilter, IssueDialogTab} from './issueDialog.types';

const ISSUE_DIALOG_LIST_CONTENT_NAME = 'IssueDialogListContent';

const FILTER_ORDER: IssueDialogFilter[] = [
    'all',
    'assignedToMe',
    'createdByMe',
    'publishRequests',
    'issues',
];

export const IssueDialogListContent = (): ReactElement => {
    const title = useI18n('field.issues');
    const filterLabel = useI18n('dialog.issue.filter.label');
    const openLabel = useI18n('field.issue.status.open');
    const closedLabel = useI18n('field.issue.status.closed');
    const emptyLabel = useI18n('dialog.issue.noIssuesAndPublishRequests');
    const newIssueLabel = useI18n('text.newIssue');
    const allLabel = useI18n('field.all');
    const assignedToMeLabel = useI18n('field.assignedToMe');
    const createdByMeLabel = useI18n('field.createdByMe');
    const publishRequestsLabel = useI18n('field.publishRequests');
    const issuesLabel = useI18n('field.issues');

    const {filter, tab, totals, loading} = useStore($issueDialog, {
        keys: ['filter', 'tab', 'totals', 'loading'],
    });
    const tabCounts = useStore($issueDialogListTabCounts);
    const issues = useStore($issueDialogListFilteredIssues);

    const filterLabels = useMemo<Record<IssueDialogFilter, string>>(() => ({
        all: allLabel,
        assignedToMe: assignedToMeLabel,
        createdByMe: createdByMeLabel,
        publishRequests: publishRequestsLabel,
        issues: issuesLabel,
    }), [allLabel, assignedToMeLabel, createdByMeLabel, publishRequestsLabel, issuesLabel]);

    const {openCount, closedCount, filterOptions} = useMemo(() => {
        const openCount = tabCounts.open ?? 0;
        const closedCount = tabCounts.closed ?? 0;

        const getFilterCount = (value: IssueDialogFilter): number => {
            const counts = totals[value] ?? {open: 0, closed: 0};
            return tab === 'open' ? counts.open ?? 0 : counts.closed ?? 0;
        };

        const filterOptions = FILTER_ORDER.map(option => {
            const count = getFilterCount(option);
            const baseLabel = filterLabels[option];
            return {
                value: option,
                label: count > 0 ? `${baseLabel} (${count})` : baseLabel,
                disabled: count === 0,
            };
        });

        return {openCount, closedCount, filterOptions};
    }, [tabCounts, totals, tab, filterLabels]);

    const isOpenDisabled = openCount === 0;
    const isClosedDisabled = closedCount === 0;
    const openTabCount = openCount > 0 ? openCount : undefined;
    const closedTabCount = closedCount > 0 ? closedCount : undefined;

    const handleIssueSelect = (issue: IssueWithAssignees): void => {
        openIssueDialogDetails(issue.getIssue().getId());
    };

    const handleCreateIssue = (): void => {
        IssueDialogsManager.get().openCreateDialog();
    };

    return (
        <Dialog.Content
            data-component={ISSUE_DIALOG_LIST_CONTENT_NAME}
            className='sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5'
        >
            <Dialog.DefaultHeader className='px-5' title={title} withClose />
            <Dialog.Body>
                <Tab.Root value={tab} onValueChange={(next) => setIssueDialogListTab(next as IssueDialogTab)}>
                    <div className='grid min-h-0 grid-cols-2 gap-x-15 gap-y-7.5 items-end px-2.5'>
                        <div className='flex flex-col gap-2.5 px-2.5'>
                            <span className='text-md font-semibold text-subtle'>{filterLabel}</span>
                            <IssueDialogSelector
                                value={filter}
                                options={filterOptions}
                                placeholder={filterOptions[0]?.label}
                                onValueChange={(next) => setIssueDialogListFilter(next as IssueDialogFilter)}
                            />
                        </div>

                        <Tab.List className='px-2.5 justify-end'>
                            <Tab.DefaultTrigger
                                value='open'
                                count={openTabCount}
                                disabled={isOpenDisabled}
                            >
                                {openLabel}
                            </Tab.DefaultTrigger>
                            <Tab.DefaultTrigger
                                value='closed'
                                count={closedTabCount}
                                disabled={isClosedDisabled}
                            >
                                {closedLabel}
                            </Tab.DefaultTrigger>
                        </Tab.List>

                        <Tab.Content value='open' className='col-span-2 mt-0 min-h-0'>
                            <IssueList
                                issues={issues}
                                emptyLabel={emptyLabel}
                                loading={loading}
                                onSelect={handleIssueSelect}
                            />
                        </Tab.Content>
                        <Tab.Content value='closed' className='col-span-2 mt-0 min-h-0'>
                            <IssueList
                                issues={issues}
                                emptyLabel={emptyLabel}
                                loading={loading}
                                onSelect={handleIssueSelect}
                            />
                        </Tab.Content>
                    </div>
                </Tab.Root>
            </Dialog.Body>
            <Dialog.Footer className='px-5'>
                <Button
                    variant='solid'
                    size='lg'
                    label={newIssueLabel}
                    endIcon={Plus}
                    onClick={handleCreateIssue}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

IssueDialogListContent.displayName = ISSUE_DIALOG_LIST_CONTENT_NAME;
