import {Button, Dialog, Tab, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Globe, Hash} from 'lucide-react';
import {useEffect, useMemo, useRef, type ComponentPropsWithoutRef, type ReactElement} from 'react';

import {IssueStatus} from '../../../../../app/issue/IssueStatus';
import {IssueType} from '../../../../../app/issue/IssueType';
import {useI18n} from '../../../hooks/useI18n';
import {$issueDialog, setIssueDialogView} from '../../../store/dialogs/issueDialog.store';
import {
    $issueDialogDetails,
    loadIssueDialogComments,
    loadIssueDialogIssue,
    setIssueDialogCommentText,
    setIssueDialogDetailsTab,
    submitIssueDialogComment,
    updateIssueDialogStatus,
} from '../../../store/dialogs/issueDialogDetails.store';
import {IssueStatusBadge} from '../../status/IssueStatusBadge';
import {IssueCommentsList} from './IssueCommentsList';
import {IssueDialogSelector} from './IssueDialogSelector';

import type {Issue} from '../../../../../app/issue/Issue';
import type {IssueWithAssignees} from '../../../../../app/issue/IssueWithAssignees';
import type {IssueDialogDetailsTab} from './issueDialog.types';

type StatusOption = 'open' | 'closed';

type StatusOptionItem = {
    value: StatusOption;
    label: string;
    status: IssueStatus;
};

const isStatusOption = (value: string): value is StatusOption => {
    return value === 'open' || value === 'closed';
};

const isDetailsTab = (value: string): value is IssueDialogDetailsTab => {
    return value === 'comments' || value === 'items' || value === 'assignees';
};

const ISSUE_DIALOG_DETAILS_CONTENT_NAME = 'IssueDialogDetailsContent';

const resizeTextarea = (element: HTMLTextAreaElement): void => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
};

const getStatusOptions = (openLabel: string, closedLabel: string): StatusOptionItem[] => {
    return [
        {value: 'open', label: openLabel, status: IssueStatus.OPEN},
        {value: 'closed', label: closedLabel, status: IssueStatus.CLOSED},
    ];
};

const resolveStatusOption = (
    options: StatusOptionItem[],
    value: string | undefined,
): StatusOptionItem | undefined => {
    return options.find(option => option.value === value);
};

const resolveIssueData = ({
    issueId,
    issues,
    detailsIssue,
}: {
    issueId?: string;
    issues: IssueWithAssignees[];
    detailsIssue?: Issue;
}): Issue | undefined => {
    const resolvedIssue = issues.find(item => item.getIssue().getId() === issueId);
    return resolvedIssue?.getIssue() ?? detailsIssue;
};

const renderIssueIcon = (issue: Issue | undefined): ReactElement | null => {
    if (!issue) {
        return null;
    }

    const isTask = issue.getType() === IssueType.STANDARD;
    const IssueIcon = isTask ? Hash : Globe;

    return (
        <IssueIcon
            className={cn(
                'size-6 shrink-0',
                isTask && 'border-subtle border-solid rounded-sm p-0.25 border-2',
            )}
        />
    );
};

const STATUS_LOOKUP: Record<StatusOption, IssueStatus> = {
    open: IssueStatus.OPEN,
    closed: IssueStatus.CLOSED,
};

export const IssueDialogDetailsContent = (): ReactElement => {
    const fallbackTitle = useI18n('dialog.issue');
    const backLabel = useI18n('dialog.issue.back');
    const commentLabel = useI18n('action.commentIssue');
    const openStatusLabel = useI18n('field.issue.status.open');
    const closedStatusLabel = useI18n('field.issue.status.closed');
    const commentsLabel = useI18n('field.comments');
    const itemsLabel = useI18n('field.items');
    const assigneesLabel = useI18n('field.assignees');
    const noItemsLabel = useI18n('dialog.issue.noItems');
    const inviteUsersLabel = useI18n('dialog.issue.inviteUsers');

    const {issueId, issues} = useStore($issueDialog, {
        keys: ['issueId', 'issues'],
    });
    const {
        issue: detailsIssue,
        detailsTab,
        commentText,
        comments,
        commentsLoading,
        commentSubmitting,
        statusUpdating,
    } = useStore($issueDialogDetails, {
        keys: [
            'issue',
            'detailsTab',
            'commentText',
            'comments',
            'commentsLoading',
            'commentSubmitting',
            'statusUpdating',
        ],
    });

    const issueData = resolveIssueData({
        issueId,
        issues,
        detailsIssue,
    });
    const title = issueData ? issueData.getTitleWithId() : fallbackTitle;
    const currentStatus = issueData?.getIssueStatus() ?? IssueStatus.OPEN;
    const statusValue: StatusOption = currentStatus === IssueStatus.CLOSED ? 'closed' : 'open';
    const isStatusDisabled = !issueData || statusUpdating;

    const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!issueId || issueData) {
            return;
        }
        void loadIssueDialogIssue(issueId);
    }, [issueId, issueData]);

    useEffect(() => {
        if (!issueId) {
            return;
        }
        void loadIssueDialogComments(issueId);
    }, [issueId]);

    useEffect(() => {
        const element = commentTextareaRef.current;
        if (!element) {
            return;
        }
        resizeTextarea(element);
    }, [commentText]);

    const handleStatusChange = (next: string): void => {
        if (!isStatusOption(next)) {
            return;
        }
        void updateIssueDialogStatus(STATUS_LOOKUP[next]);
    };

    const handleCommentInput: NonNullable<ComponentPropsWithoutRef<'textarea'>['onInput']> = (event) => {
        const {value} = event.currentTarget;
        setIssueDialogCommentText(value);
        resizeTextarea(event.currentTarget);
    };

    const handleCommentKeyDown: NonNullable<ComponentPropsWithoutRef<'textarea'>['onKeyDown']> = (event) => {
        if (event.key !== 'Enter' || event.shiftKey || !canSubmitComment) {
            return;
        }
        event.preventDefault();
        handleCommentSubmit();
    };

    const handleCommentSubmit = (): void => {
        void submitIssueDialogComment();
    };

    const handleBack = (): void => {
        setIssueDialogView('list');
    };

    const handleTabChange = (next: string): void => {
        if (!isDetailsTab(next)) {
            return;
        }
        setIssueDialogDetailsTab(next);
    };

    const canSubmitComment = commentText.trim().length > 0 && !commentSubmitting && !!issueId;
    const statusOptions = useMemo(
        () => getStatusOptions(openStatusLabel, closedStatusLabel),
        [openStatusLabel, closedStatusLabel],
    );

    return (
        <Dialog.Content
            className='sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5'
            data-component={ISSUE_DIALOG_DETAILS_CONTENT_NAME}
        >
            <Dialog.Header className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5'>
                <div className='flex min-w-0 items-center gap-2.5'>
                    {renderIssueIcon(issueData)}
                    <Dialog.Title className='min-w-0 truncate text-2xl font-semibold'>{title}</Dialog.Title>
                </div>
                <Dialog.DefaultClose className='self-start justify-self-end' />
            </Dialog.Header>
            <Dialog.Body className='min-h-0'>
                <Tab.Root value={detailsTab} onValueChange={handleTabChange}>
                    <div className='grid min-h-0 grid-cols-4 gap-x-3.5 gap-y-7.5 items-end px-2.5'>
                        <div className='flex flex-col gap-2.5 px-2.5 pt-1.5'>
                        <IssueDialogSelector
                            value={statusValue}
                            disabled={isStatusDisabled}
                            options={statusOptions}
                            placeholder={openStatusLabel}
                            onValueChange={handleStatusChange}
                            renderValue={(value) => {
                                const option = resolveStatusOption(statusOptions, value);
                                return option ? <IssueStatusBadge status={option.status} /> : openStatusLabel;
                            }}
                            renderItemText={(option) => <IssueStatusBadge status={option.status} />}
                        />
                            </div>
                        <Tab.List className='col-span-3 px-2.5 justify-end'>
                            <Tab.DefaultTrigger value='comments'>{commentsLabel}</Tab.DefaultTrigger>
                            <Tab.DefaultTrigger value='items'>{itemsLabel}</Tab.DefaultTrigger>
                            <Tab.DefaultTrigger value='assignees'>{assigneesLabel}</Tab.DefaultTrigger>
                        </Tab.List>

                        <Tab.Content value='comments' className='col-span-4 mt-0 min-h-0 px-2.5'>
                            <div className='flex min-h-0 flex-col gap-7.5'>
                                <IssueCommentsList
                                    issue={issueData}
                                    comments={comments}
                                    loading={commentsLoading}
                                />
                                <div className='min-w-0'>
                                    <textarea
                                        ref={commentTextareaRef}
                                        value={commentText}
                                        onInput={handleCommentInput}
                                        onKeyDown={handleCommentKeyDown}
                                        rows={3}
                                        disabled={commentSubmitting}
                                        className={cn(
                                            'w-full resize-none rounded-sm border border-bdr-soft bg-surface px-3 py-2 text-sm',
                                            'transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                                            'focus-visible:ring-offset-3 focus-visible:ring-offset-ring-offset',
                                            commentSubmitting && 'opacity-70',
                                        )}
                                    />
                                </div>
                            </div>
                        </Tab.Content>

                        <Tab.Content value='items' className='col-span-4 mt-0 px-2.5'>
                            <div className='text-sm text-subtle'>{noItemsLabel}</div>
                        </Tab.Content>

                        <Tab.Content value='assignees' className='col-span-4 mt-0 px-2.5'>
                            <div className='text-sm text-subtle'>{inviteUsersLabel}</div>
                        </Tab.Content>
                    </div>
                </Tab.Root>
            </Dialog.Body>
            <Dialog.Footer className='px-5 justify-between'>
                <Button variant='outline' size='lg' label={backLabel} onClick={handleBack} />
                <Button
                    variant='solid'
                    size='lg'
                    label={commentLabel}
                    onClick={handleCommentSubmit}
                    disabled={!canSubmitComment}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

IssueDialogDetailsContent.displayName = ISSUE_DIALOG_DETAILS_CONTENT_NAME;
