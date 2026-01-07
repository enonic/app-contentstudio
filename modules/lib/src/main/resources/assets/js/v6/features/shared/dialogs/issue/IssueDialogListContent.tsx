import {Button, Dialog, Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Plus} from 'lucide-react';
import {useEffect, type ReactElement} from 'react';

import {IssueDialogsManager} from '../../../../../app/issue/IssueDialogsManager';
import {useI18n} from '../../../hooks/useI18n';
import {
    $issueDialog,
    $issueDialogListFilteredIssues,
    $issueDialogListTabCounts,
    loadIssueDialogList,
    openIssueDialogDetails,
    setIssueDialogListFilter,
    setIssueDialogListTab,
} from '../../../store/dialogs/issueDialog.store';
import {IssueListItem} from './IssueListItem';
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

    const {filter, tab, totals, loading} = useStore($issueDialog, {
        keys: ['filter', 'tab', 'totals', 'loading'],
    });
    const tabCounts = useStore($issueDialogListTabCounts);
    const issues = useStore($issueDialogListFilteredIssues);

    useEffect(() => {
        void loadIssueDialogList();
    }, []);

    const filterLabels = {
        all: useI18n('field.all'),
        assignedToMe: useI18n('field.assignedToMe'),
        createdByMe: useI18n('field.createdByMe'),
        publishRequests: useI18n('field.publishRequests'),
        issues: useI18n('field.issues'),
    } satisfies Record<IssueDialogFilter, string>;

    const openCount = tabCounts.open ?? 0;
    const closedCount = tabCounts.closed ?? 0;
    const isOpenDisabled = openCount === 0;
    const isClosedDisabled = closedCount === 0;
    const openTabCount = openCount > 0 ? openCount : undefined;
    const closedTabCount = closedCount > 0 ? closedCount : undefined;

    const getFilterCount = (value: IssueDialogFilter): number => {
        const counts = totals[value] ?? {open: 0, closed: 0};
        return tab === 'open' ? counts.open ?? 0 : counts.closed ?? 0;
    };

    const formatFilterLabel = (value: IssueDialogFilter): string => {
        const baseLabel = filterLabels[value];
        const count = getFilterCount(value);
        return count > 0 ? `${baseLabel} (${count})` : baseLabel;
    };

    const filterOptions = FILTER_ORDER.map(option => ({
        value: option,
        label: formatFilterLabel(option),
        disabled: getFilterCount(option) === 0,
    }));

    const handleIssueSelect = (issue: IssueWithAssignees): void => {
        openIssueDialogDetails(issue.getIssue().getId());
    };

    const handleCreateIssue = (): void => {
        IssueDialogsManager.get().openCreateDialog();
    };

    return (
        <Dialog.Content
            className='sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5'
            data-component={ISSUE_DIALOG_LIST_CONTENT_NAME}
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
                            {issues.length === 0 && !loading && (
                                <div className='text-sm text-subtle'>{emptyLabel}</div>
                            )}
                            <div className='flex flex-col gap-1.25 min-h-0 max-h-100 overflow-y-auto'>
                                {issues.map(issue => (
                                    <IssueListItem
                                        key={issue.getIssue().getId()}
                                        issue={issue}
                                        onSelect={handleIssueSelect}
                                    />
                                ))}
                            </div>
                        </Tab.Content>
                        <Tab.Content value='closed' className='col-span-2 mt-0 min-h-0'>
                            {issues.length === 0 && !loading && (
                                <div className='text-sm text-subtle'>{emptyLabel}</div>
                            )}
                            <div className='flex flex-col gap-1.25 min-h-0 max-h-100 overflow-y-auto'>
                                {issues.map(issue => (
                                    <IssueListItem
                                        key={issue.getIssue().getId()}
                                        issue={issue}
                                        onSelect={handleIssueSelect}
                                    />
                                ))}
                            </div>
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
