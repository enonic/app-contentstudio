import {Button, Dialog, Tab, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ComponentPropsWithoutRef,
    type ReactElement,
} from 'react';

import type {ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {IssueStatus} from '../../../../../app/issue/IssueStatus';
import {IssueType} from '../../../../../app/issue/IssueType';
import {useI18n} from '../../../hooks/useI18n';
import {$issueDialog, setIssueDialogView} from '../../../store/dialogs/issueDialog.store';
import {
    $issueDialogDetails,
    loadIssueDialogItems,
    openDeleteCommentConfirmation,
    setIssueDialogCommentText,
    setIssueDialogDetailsTab,
    submitIssueDialogComment,
    updateIssueDialogAssignees,
    updateIssueDialogComment,
    updateIssueDialogDependencyIncluded,
    updateIssueDialogItemIncludeChildren,
    updateIssueDialogItems,
    updateIssueDialogStatus,
    updateIssueDialogTitle,
} from '../../../store/dialogs/issueDialogDetails.store';
import {
    $isPublishChecking,
    $isPublishReady,
    $publishDialog,
    $publishDialogPending,
    $totalPublishableItems,
    publishItems,
    syncPublishDialogContext,
} from '../../../store/dialogs/publishDialog.store';
import {uniqueIds} from '../../../utils/cms/content/ids';
import {createDebounce} from '../../../utils/timing/createDebounce';
import {AssigneeSelector} from '../../selectors/assignee/AssigneeSelector';
import {useAssigneeSearch, useAssigneeSelection} from '../../selectors/assignee/hooks/useAssigneeSearch';
import {IssueItemsSelector} from '../../selectors/issue-items/IssueItemsSelector';
import {IssueStatusBadge} from '../../status/IssueStatusBadge';
import {IssueDialogSelector} from './IssueDialogSelector';
import {IssueIcon} from './IssueIcon';
import {IssueSelectedDependencies} from './IssueSelectedDependencies';
import {IssueSelectedItems} from './IssueSelectedItems';
import {IssueCommentsList} from './comment/IssueCommentsList';
import {useIssueDialogData} from './hooks/useIssueDialogData';
import {useIssuePublishTargetIds} from './hooks/useIssuePublishTargetIds';
import {EditableText} from '../../primitives/EditableText';

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
    if (detailsIssue) {
        return detailsIssue;
    }
    const resolvedIssue = issues.find(item => item.getIssue().getId() === issueId);
    return resolvedIssue?.getIssue();
};

const STATUS_LOOKUP: Record<StatusOption, IssueStatus> = {
    open: IssueStatus.OPEN,
    closed: IssueStatus.CLOSED,
};

export const IssueDialogDetailsContent = (): ReactElement => {
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
        issueError,
        titleUpdating,
        statusUpdating,
        assigneesUpdating,
        itemsUpdating,
        itemsLoading,
        items,
        excludedChildrenIds,
        dependants,
        excludedDependantIds,
        requiredDependantIds,
    } = useStore($issueDialogDetails, {
        keys: [
            'issue',
            'detailsTab',
            'commentText',
            'comments',
            'commentsLoading',
            'commentSubmitting',
            'issueError',
            'titleUpdating',
            'statusUpdating',
            'assigneesUpdating',
            'itemsUpdating',
            'itemsLoading',
            'items',
            'excludedChildrenIds',
            'dependants',
            'excludedDependantIds',
            'requiredDependantIds',
        ],
    });
    const publishCount = useStore($totalPublishableItems);
    const isPublishReady = useStore($isPublishReady);
    const isPublishChecking = useStore($isPublishChecking);
    const {open: publishDialogOpen} = useStore($publishDialog, {keys: ['open']});
    const {submitting: publishSubmitting} = useStore($publishDialogPending, {keys: ['submitting']});

    const fallbackTitle = useI18n('dialog.issue');
    const backLabel = useI18n('dialog.issue.back');
    const commentActionLabel = useI18n('action.commentIssue');
    const commentLabel = useI18n('field.comment.label');
    const openStatusLabel = useI18n('field.issue.status.open');
    const closedStatusLabel = useI18n('field.issue.status.closed');
    const commentsLabel = useI18n('field.comments');
    const commentAriaLabel = useI18n('field.comment.aria.label');
    const itemsLabel = useI18n('field.items');
    const assigneesLabel = useI18n('field.assignees');
    const titleLabel = useI18n('field.title');
    const dependenciesLabel = useI18n('dialog.dependencies');
    const inviteUsersLabel = useI18n('dialog.issue.inviteUsers');
    const applyLabel = useI18n('action.apply');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const noResultsLabel = useI18n('dialog.search.result.noResults');
    const commentTextareaId = useId();

    const issueData = resolveIssueData({
        issueId,
        issues,
        detailsIssue,
    });
    const issueWithAssignees = useMemo(
        () => issues.find(item => item.getIssue().getId() === issueId),
        [issues, issueId],
    );

    const isPublishRequest = issueData?.getType() === IssueType.PUBLISH_REQUEST;
    const issueIndex = issueData?.getIndex();
    const currentStatus = issueData?.getIssueStatus() ?? IssueStatus.OPEN;
    const statusValue: StatusOption = currentStatus === IssueStatus.CLOSED ? 'closed' : 'open';
    const isStatusDisabled = !issueData || statusUpdating;
    const isCommentsTab = detailsTab === 'comments';
    const isItemsTab = detailsTab === 'items';
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;
    const itemsTabLabel = publishCount > 1 ? `${itemsLabel} (${publishCount})` : itemsLabel;
    const tabs = isPublishRequest
        ? [
            {value: 'items', label: itemsTabLabel},
            {value: 'comments', label: commentsLabel},
            {value: 'assignees', label: assigneesLabel},
        ]
        : [
            {value: 'comments', label: commentsLabel},
            {value: 'items', label: itemsTabLabel},
            {value: 'assignees', label: assigneesLabel},
        ];
    const isTitleDisabled = !issueData || issueError || titleUpdating || statusUpdating;
    const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const pendingItemIdsRef = useRef<ContentId[] | null>(null);
    const publishTargetIds = useIssuePublishTargetIds(items, dependants, excludedDependantIds);

    const {options: assigneeOptions, handleSearchChange} = useAssigneeSearch({
        publishableContentIds: publishTargetIds,
        useRootFallback: true,
    });

    useIssueDialogData(issueId, !!issueData);

    useEffect(() => {
        if (!issueData) {
            return;
        }
        void syncPublishDialogContext({
            items,
            excludedChildrenIds,
            excludedDependantIds,
        });
    }, [excludedChildrenIds, excludedDependantIds, issueData, items, syncPublishDialogContext]);

    const assigneeIds = useMemo(
        () => issueData?.getApprovers().map(approver => approver.toString()) ?? [],
        [issueData],
    );
    const selectedItemIds = useMemo(
        () => issueData?.getPublishRequest()?.getItemsIds() ?? [],
        [issueData],
    );
    const selectedItemKey = useMemo(
        () => selectedItemIds.map(id => id.toString()).join('|'),
        [selectedItemIds],
    );
    const selectedItemConfigKey = useMemo(() => {
        const itemsConfig = issueData?.getPublishRequest()?.getItems() ?? [];
        return itemsConfig
            .map(item => `${item.getId().toString()}:${item.isIncludeChildren() ? 1 : 0}`)
            .join('|');
    }, [issueData]);
    const excludedDependantKey = useMemo(() => {
        return issueData?.getPublishRequest()?.getExcludeIds().map(id => id.toString()).join('|') ?? '';
    }, [issueData]);

    const selectedAssigneeOptions = useAssigneeSelection({
        assigneeIds,
        assignees: issueWithAssignees?.getAssignees(),
        filterSystem: true,
    });

    useEffect(() => {
        const element = commentTextareaRef.current;
        if (!element) {
            return;
        }
        resizeTextarea(element);
    }, [commentText]);

    const issueDataId = useMemo(() => issueData?.getId(), [issueData]);

    useEffect(() => {
        if (!issueData) {
            return;
        }
        void loadIssueDialogItems(issueData);
    }, [issueDataId, selectedItemConfigKey, excludedDependantKey, loadIssueDialogItems]);

    const handleStatusChange = (next: string): void => {
        if (!isStatusOption(next)) {
            return;
        }
        void updateIssueDialogStatus(STATUS_LOOKUP[next]);
    };

    const handleTitleCommit = (value: string): void => {
        void updateIssueDialogTitle(value);
    };

    const debouncedUpdateAssignees = useMemo(
        () => createDebounce((next: readonly string[]) => {
            void updateIssueDialogAssignees(next);
        }, 600),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedUpdateAssignees.cancel();
        };
    }, [debouncedUpdateAssignees]);

    const debouncedUpdateItems = useMemo(
        () => createDebounce((nextIds: ContentId[]) => {
            void updateIssueDialogItems(nextIds);
        }, 0),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedUpdateItems.cancel();
        };
    }, [debouncedUpdateItems]);

    useEffect(() => {
        pendingItemIdsRef.current = null;
    }, [selectedItemKey]);

    const handleAssigneesChange = (next: readonly string[]): void => {
        debouncedUpdateAssignees([...next]);
    };

    const scheduleItemsUpdate = useCallback((nextIds: ContentId[]): void => {
        pendingItemIdsRef.current = nextIds;
        debouncedUpdateItems(nextIds);
    }, [debouncedUpdateItems]);

    const handleItemsAdded = useCallback((items: ContentSummaryAndCompareStatus[]): void => {
        if (!issueData) {
            return;
        }

        const baseIds = pendingItemIdsRef.current ?? selectedItemIds;
        const addedIds = items.map(item => item.getContentId());
        const nextIds = uniqueIds([...baseIds, ...addedIds]);
        scheduleItemsUpdate(nextIds);
    }, [issueData, scheduleItemsUpdate, selectedItemIds]);

    const handleItemsRemoved = useCallback((ids: ContentId[]): void => {
        if (!issueData) {
            return;
        }

        const baseIds = pendingItemIdsRef.current ?? selectedItemIds;
        const removeSet = new Set(ids.map(id => id.toString()));
        const nextIds = baseIds.filter(id => !removeSet.has(id.toString()));
        scheduleItemsUpdate(nextIds);
    }, [issueData, scheduleItemsUpdate, selectedItemIds]);

    const handleIncludeChildrenChange = useCallback((id: ContentId, includeChildren: boolean): void => {
        void updateIssueDialogItemIncludeChildren(id, includeChildren);
    }, []);

    const handleDependencyChange = useCallback((id: ContentId, included: boolean): void => {
        void updateIssueDialogDependencyIncluded(id, included);
    }, []);

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

    const handlePublish = (): void => {
        void publishItems();
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

    const canSubmitComment = useMemo(() => {
        return commentText.trim().length > 0 && !commentSubmitting && !!issueId && !issueError;
    }, [commentText, commentSubmitting, issueId, issueError]);

    const handleCommentUpdate = useCallback(
        async (commentId: string, text: string): Promise<boolean> => {
            return await updateIssueDialogComment(commentId, text);
        },
        [],
    );

    const isAssigneesDisabled = !issueData || issueError || assigneesUpdating || statusUpdating;
    const isItemsDisabled = !issueData || issueError || itemsUpdating || statusUpdating;
    const isPublishDisabled = !isPublishReady ||
        isPublishChecking ||
        publishSubmitting ||
        publishDialogOpen ||
        isItemsDisabled ||
        itemsLoading;
    const statusOptions = useMemo(
        () => getStatusOptions(openStatusLabel, closedStatusLabel),
        [openStatusLabel, closedStatusLabel],
    );

    return (
        <Dialog.Content
            data-component={ISSUE_DIALOG_DETAILS_CONTENT_NAME}
            className='sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-236 flex min-h-0 flex-col gap-7.5 overflow-hidden px-5'
        >
            <Dialog.Header className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5'>
                <div className='flex min-w-0 items-center gap-1.5'>
                    <IssueIcon issue={issueData} />
                    <Dialog.Title asChild>
                        <span className="inline-flex min-w-0 max-w-full items-baseline gap-1">
                            <EditableText
                                value={issueData?.getTitle()}
                                placeholder={fallbackTitle}
                                onCommit={handleTitleCommit}
                                onEditingChange={setIsEditingTitle}
                                disabled={isTitleDisabled}
                                variant="heading"
                                aria-label={titleLabel}
                            />
                            {!isEditingTitle && issueIndex != null && (
                                <span className="text-2xl font-semibold whitespace-nowrap">
                                    #{issueIndex}
                                </span>
                            )}
                        </span>
                    </Dialog.Title>
                </div>
                <Dialog.DefaultClose className='self-start justify-self-end' />
            </Dialog.Header>
            <Dialog.Body className='flex min-h-0 flex-1 flex-col overflow-hidden'>
                <Tab.Root value={detailsTab} onValueChange={handleTabChange} className='flex min-h-0 flex-1 flex-col gap-7.5'>
                    <div className='grid grid-cols-4 gap-x-3.5 items-end px-2.5'>
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
                            {tabs.map((tab) => (
                                <Tab.DefaultTrigger key={tab.value} value={tab.value}>
                                    {tab.label}
                                </Tab.DefaultTrigger>
                            ))}
                        </Tab.List>
                    </div>

                    <div className='flex min-h-0 flex-1 flex-col px-5'>
                        <Tab.Content value='comments' className='mt-0 flex min-h-0 flex-1 flex-col'>
                            <div className='flex min-h-0 flex-1 flex-col gap-7.5'>
                                <IssueCommentsList
                                    issue={issueData}
                                    comments={comments}
                                    loading={commentsLoading}
                                    onUpdateComment={handleCommentUpdate}
                                    onDeleteComment={openDeleteCommentConfirmation}
                                    portalContainer={portalContainer}
                                    aria-label={commentsLabel}
                                />
                                <div className='flex flex-col gap-2'>
                                    {/* // TODO: Enonic UI - Replace with TextArea component */}
                                    <label className='font-semibold' htmlFor={commentTextareaId}>{commentLabel}</label>
                                    <textarea
                                        ref={commentTextareaRef}
                                        id={commentTextareaId}
                                        name='comment'
                                        value={commentText}
                                        onInput={handleCommentInput}
                                        onKeyDown={handleCommentKeyDown}
                                        rows={3}
                                        disabled={commentSubmitting}
                                        aria-label={commentAriaLabel}
                                        placeholder={commentAriaLabel}
                                        className={cn(
                                            'w-full resize-none rounded-sm border border-bdr-soft bg-surface px-4.5 py-3',
                                            'transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring',
                                            commentSubmitting && 'opacity-70',
                                        )}
                                    />
                                </div>
                            </div>
                        </Tab.Content>

                        <Tab.Content value='items' className='mt-0 min-h-0 flex flex-1 flex-col'>
                            <div className='flex flex-col gap-2.5'>
                                <span className='text-md font-semibold text-subtle'>{itemsLabel}</span>
                                <IssueItemsSelector
                                    label={itemsLabel}
                                    selectedIds={selectedItemIds}
                                    disabled={isItemsDisabled}
                                    onItemsAdded={handleItemsAdded}
                                    onItemsRemoved={handleItemsRemoved}
                                />
                            </div>
                            <div className='mt-2.5 min-h-0 flex-1 overflow-y-auto'>
                                <div className='flex flex-col gap-7.5'>
                                    {items.length > 0 && (
                                        <IssueSelectedItems
                                            items={items}
                                            excludedChildrenIds={excludedChildrenIds}
                                            disabled={isItemsDisabled}
                                            loading={itemsLoading}
                                            onIncludeChildrenChange={handleIncludeChildrenChange}
                                            onRemoveItem={(id) => handleItemsRemoved([id])}
                                        />
                                    )}
                                    {dependants.length > 0 && (
                                        <IssueSelectedDependencies
                                            label={dependenciesLabel}
                                            dependants={dependants}
                                            excludedDependantIds={excludedDependantIds}
                                            requiredDependantIds={requiredDependantIds}
                                            disabled={isItemsDisabled}
                                            loading={itemsLoading}
                                            onDependencyChange={handleDependencyChange}
                                        />
                                    )}

                                </div>
                            </div>
                        </Tab.Content>

                        <Tab.Content value='assignees' className='mt-0 min-h-0 flex flex-1 flex-col'>
                            <AssigneeSelector
                                label={assigneesLabel}
                                options={assigneeOptions}
                                selectedOptions={selectedAssigneeOptions}
                                selection={assigneeIds}
                                applyLabel={applyLabel}
                                placeholder={inviteUsersLabel}
                                searchPlaceholder={inviteUsersLabel}
                                emptyLabel={noResultsLabel}
                                onSelectionChange={handleAssigneesChange}
                                onSearchChange={handleSearchChange}
                                disabled={isAssigneesDisabled}
                                className='min-h-0 flex-1'
                                selectedListClassName='min-h-0 flex-1 overflow-y-auto'
                            />
                        </Tab.Content>
                    </div>
                </Tab.Root>
                <div ref={setPortalContainer} />
            </Dialog.Body>
            <Dialog.Footer className='px-5 justify-between'>
                <Button variant='outline' size='lg' label={backLabel} onClick={handleBack} />
                {isCommentsTab && (
                    <Button
                        variant='solid'
                        size='lg'
                        label={commentActionLabel}
                        onClick={handleCommentSubmit}
                        disabled={!canSubmitComment}
                    />
                )}
                {isItemsTab && (
                    <Button
                        variant='solid'
                        size='lg'
                        label={publishLabel}
                        onClick={handlePublish}
                        disabled={isPublishDisabled}
                    />
                )}
            </Dialog.Footer>
        </Dialog.Content>
    );
};

IssueDialogDetailsContent.displayName = ISSUE_DIALOG_DETAILS_CONTENT_NAME;
