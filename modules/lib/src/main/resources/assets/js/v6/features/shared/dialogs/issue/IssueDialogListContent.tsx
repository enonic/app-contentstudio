import {Button, Dialog, Selector, Tab, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Plus} from 'lucide-react';
import {useEffect, type ReactElement} from 'react';

import {
    $issueDialog,
    $issueDialogListFilteredIssues,
    $issueDialogListTabCounts,
    loadIssueDialogList,
    openIssueDialogDetails,
    setIssueDialogListFilter,
    setIssueDialogListTab,
} from '../../../store/dialogs/issueDialog.store';
import {IssueDialogsManager} from '../../../../../app/issue/IssueDialogsManager';
import {useI18n} from '../../../hooks/useI18n';
import {stopPointerDownPropagation} from '../../../utils/dom/events/stopPointerDownPropagation';
import {IssueListItem} from './IssueListItem';

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

type IssueDialogTabTriggerProps = {
    value: IssueDialogTab;
    label: string;
    count?: number;
    disabled: boolean;
    className?: string;
};

function IssueDialogTabTrigger({
                                   value,
                                   label,
                                   count,
                                   disabled,
                                   className,
                               }: IssueDialogTabTriggerProps): ReactElement {
    return (
        <Tab.Trigger value={value} disabled={disabled} className={cn('cursor-pointer hover:text-main', className)}>
            <span className='truncate'>{label}</span>
            {count != null && (
                <span className='shrink-0 text-xs font-medium'>{count}</span>
            )}
        </Tab.Trigger>
    );
}

export const IssueDialogListContent = (): ReactElement => {
    const title = useI18n('field.issues');
    const filterLabel = useI18n('dialog.issue.filter.label');
    const openLabel = useI18n('field.issue.status.open');
    const closedLabel = useI18n('field.issue.status.closed');
    const emptyLabel = useI18n('dialog.issue.noIssuesAndPublishRequests');

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
            className='w-full h-full gap-6 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220'
            data-component={ISSUE_DIALOG_LIST_CONTENT_NAME}
        >
            <Dialog.DefaultHeader title={title} withClose/>
            <Dialog.Body>
                <Tab.Root value={tab} onValueChange={(next) => setIssueDialogListTab(next as IssueDialogTab)}>
                    <div className='grid min-h-0 grid-cols-2 gap-x-8 gap-y-6 items-end'>
                        <div className='flex flex-col gap-2.5'>
                            <span className='text-xs text-subtle'>{filterLabel}</span>
                            <Selector.Root value={filter} onValueChange={(next) => setIssueDialogListFilter(next as IssueDialogFilter)}>
                                <Selector.Trigger>
                                    <Selector.Value placeholder={filterOptions[0]?.label}>
                                        {(value) => filterOptions.find(option => option.value === value)?.label}
                                    </Selector.Value>
                                    <Selector.Icon/>
                                </Selector.Trigger>
                                <Selector.Content onPointerDownCapture={stopPointerDownPropagation}>
                                    <Selector.Viewport>
                                        {filterOptions.map(option => (
                                            <Selector.Item
                                                key={option.value}
                                                value={option.value}
                                                textValue={option.label}
                                                disabled={option.disabled}
                                            >
                                                <Selector.ItemText>{option.label}</Selector.ItemText>
                                                <Selector.ItemIndicator/>
                                            </Selector.Item>
                                        ))}
                                    </Selector.Viewport>
                                </Selector.Content>
                            </Selector.Root>
                        </div>

                        <Tab.List className='justify-end'>
                            <IssueDialogTabTrigger
                                value='open'
                                label={openLabel}
                                count={openTabCount}
                                disabled={isOpenDisabled}
                            />
                            <IssueDialogTabTrigger
                                value='closed'
                                label={closedLabel}
                                count={closedTabCount}
                                disabled={isClosedDisabled}
                            />
                        </Tab.List>

                        <Tab.Content value='open' className='col-span-2 mt-0 min-h-0'>
                            {issues.length === 0 && !loading && (
                                <div className='text-sm text-subtle'>{emptyLabel}</div>
                            )}
                            <div className='flex flex-col gap-1.5 min-h-0'>
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
                            <div className='flex flex-col gap-1.5 min-h-0'>
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
            <Dialog.Footer>
                <Button
                    variant='solid'
                    size='lg'
                    label={useI18n('text.newIssue')}
                    endIcon={Plus}
                    onClick={handleCreateIssue}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

IssueDialogListContent.displayName = ISSUE_DIALOG_LIST_CONTENT_NAME;
