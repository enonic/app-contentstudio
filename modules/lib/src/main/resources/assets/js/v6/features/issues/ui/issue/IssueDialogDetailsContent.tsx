import { Button, Checkbox, Dialog, GridList, Tab, TextArea } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Calendar, CornerDownRight } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentPropsWithoutRef,
    type ReactElement,
} from 'react';

import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { ContentId } from '../../../../../app/content/ContentId';
import { IssueStatus } from '../../../../../app/issue/IssueStatus';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { generateIssueStatusInfo } from '../../../../shared/lib/cms/issue/generateIssueStatusInfo';
import { useTaskProgress } from '../../../../entities/task/useTaskProgress';
import { $config } from '../../../../shared/config/config.store';
import { $issueDialog, closeIssueDialog, setIssueDialogView } from '../../model/issueDialog.store';
import {
    $canIssueDialogDetailsPublish,
    $canIssueDialogDetailsShowSelectionStatusBar,
    $isIssueDialogDetailsClosed,
    $isIssueDialogDetailsPublishRequest,
    $issueDialogDetails,
    $issueDialogDetailsDependantsSelection,
    $issueDialogDetailsHasMoreDependants,
    loadIssueDialogItems,
    loadMoreIssueDialogDependants,
    openDeleteCommentConfirmation,
    setIssueDialogCommentText,
    setIssueDialogDetailsTab,
    submitIssueDialogComment,
    toggleIssueDialogDetailsDependantsSelection,
    updateIssueDialogAssignees,
    updateIssueDialogComment,
    updateIssueDialogDependencyIncluded,
    updateIssueDialogExcludedDependants,
    updateIssueDialogItemIncludeChildren,
    updateIssueDialogItems,
    updateIssueDialogSchedule,
    updateIssueDialogStatus,
    updateIssueDialogTitle,
} from '../../model/issueDialogDetails.store';
import {
    excludeInProgressPublishItems,
    excludeInvalidPublishItems,
    excludeNotPublishablePublishItems,
    markAllAsReadyInProgressPublishItems,
    publishItems,
    syncPublishDialogContext,
} from '../../../publish/model/publishDialog.commands';
import {
    $isPublishChecking,
    $isPublishReady,
    $publishCheckErrors,
    $publishDialog,
    $publishDialogPending,
    $publishTaskId,
    $totalPublishableItems,
} from '../../../publish/model/publishDialog.store';
import { useItemsWithUnpublishedChildren } from '../../../../entities/content';
import { createDebounce } from '../../../../shared/lib/timing/createDebounce';
import { ContentRow, SplitList } from '../../../shared/lists';
import { EditableText } from '../../../../shared/ui/primitives/EditableText';
import { AssigneeSelector } from '../../../shared/selectors/assignee/AssigneeSelector';
import { useAssigneeSearch, useAssigneeSelection } from '../../../shared/selectors/assignee/hooks/useAssigneeSearch';
import { ContentCombobox } from '../../../shared/selectors/content';
import { IssueStatusBadge } from '../../../shared/status/IssueStatusBadge';
import { DependantsSelectAll } from '../../../../shared/ui/dialogs/dependants/DependantsSelectAll';
import { PublishDialogProgressContent } from '../../../publish/ui/PublishDialogProgressContent';
import { SelectionStatusBar } from '../../../../shared/ui/dialogs/status-bar/SelectionStatusBar';
import { IssueDialogSelector } from './IssueDialogSelector';
import { IssueIcon } from '../../../../entities/issue/ui/IssueIcon';
import { IssueScheduleForm } from './IssueScheduleForm';
import { IssueCommentsList } from './comment/IssueCommentsList';
import { useIssueDialogData } from './hooks/useIssueDialogData';

import type { Issue } from '../../../../../app/issue/Issue';
import type { IssueWithAssignees } from '../../../../../app/issue/IssueWithAssignees';
import type { IssueDialogDetailsTab } from './issueDialog.types';

type StatusOption = 'open' | 'closed';

type StatusOptionItem = {
    value: StatusOption;
    label: string;
    status: IssueStatus;
};

type PublishView = 'main' | 'progress';

const isStatusOption = (value: string): value is StatusOption => {
    return value === 'open' || value === 'closed';
};

const isDetailsTab = (value: string): value is IssueDialogDetailsTab => {
    return value === 'comments' || value === 'items' || value === 'assignees';
};

const ISSUE_DIALOG_DETAILS_CONTENT_NAME = 'IssueDialogDetailsContent';

const getStatusOptions = (openLabel: string, closedLabel: string): StatusOptionItem[] => {
    return [
        { value: 'open', label: openLabel, status: IssueStatus.OPEN },
        { value: 'closed', label: closedLabel, status: IssueStatus.CLOSED },
    ];
};

const resolveStatusOption = (options: StatusOptionItem[], value: string | undefined): StatusOptionItem | undefined => {
    return options.find((option) => option.value === value);
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
    const resolvedIssue = issues.find((item) => item.getIssue().getId() === issueId);
    return resolvedIssue?.getIssue();
};

const validateSchedule = (from: Date | undefined, to: Date | undefined): { fromError?: string; toError?: string } => {
    const now = new Date();
    if (from && from <= now) {
        return { fromError: i18n('field.schedule.invalid.from.past') };
    }
    if (!to) {
        return {};
    }
    if (to <= now) {
        return { toError: i18n('field.schedule.invalid.past') };
    }
    const fromDate = from ?? now;
    if (to <= fromDate) {
        return { toError: i18n('field.schedule.invalid') };
    }
    return {};
};

const STATUS_LOOKUP: Record<StatusOption, IssueStatus> = {
    open: IssueStatus.OPEN,
    closed: IssueStatus.CLOSED,
};

export const IssueDialogDetailsContent = (): ReactElement => {
    const { issueId, issues } = useStore($issueDialog, {
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
        scheduleUpdating,
        itemsUpdating,
        itemsLoading,
        items,
        excludeChildrenIds,
        dependants,
        dependantIds,
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
            'scheduleUpdating',
            'itemsUpdating',
            'itemsLoading',
            'items',
            'excludeChildrenIds',
            'dependants',
            'dependantIds',
            'excludedDependantIds',
            'requiredDependantIds',
        ],
    });
    const isPublishRequest = useStore($isIssueDialogDetailsPublishRequest);
    const isClosed = useStore($isIssueDialogDetailsClosed);
    const canShowSelectionStatusBar = useStore($canIssueDialogDetailsShowSelectionStatusBar);
    const canPublish = useStore($canIssueDialogDetailsPublish);
    const hasMoreDependants = useStore($issueDialogDetailsHasMoreDependants);
    const dependantsSelection = useStore($issueDialogDetailsDependantsSelection);
    const publishCount = useStore($totalPublishableItems);
    const isPublishReady = useStore($isPublishReady);
    const isPublishChecking = useStore($isPublishChecking);
    const { open: publishDialogOpen, failed: publishDialogFailed } = useStore($publishDialog, {
        keys: ['open', 'failed'],
    });
    const { submitting: publishSubmitting } = useStore($publishDialogPending, { keys: ['submitting'] });
    const publishTaskId = useStore($publishTaskId);
    const { progress: publishProgress } = useTaskProgress(publishTaskId);
    const { invalid, inProgress, noPermissions } = useStore($publishCheckErrors);

    const { user, defaultPublishFromTime } = useStore($config, { keys: ['user', 'defaultPublishFromTime'] });

    const fallbackTitle = useI18n('dialog.issue');
    const backLabel = useI18n('dialog.issue.back');
    const commentActionLabel = useI18n('action.commentIssue');
    const commentLabel = useI18n('field.comment.label');
    const openStatusLabel = useI18n('field.issue.status.open');
    const closedStatusLabel = useI18n('field.issue.status.closed');
    const commentsLabel = useI18n('field.comments');
    const commentAriaLabel = useI18n('field.comment.aria.label');
    const itemsLabel = useI18n('field.items');
    const publishRequestLabel = useI18n('field.publishRequest');
    const assigneesLabel = useI18n('field.assignees');
    const titleLabel = `${useI18n('field.title')} *`;
    const dependenciesLabel = useI18n('dialog.dependencies');
    const inviteUsersLabel = useI18n('dialog.issue.inviteUsers');
    const applyLabel = useI18n('action.apply');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const noResultsLabel = useI18n('dialog.search.result.noResults');
    const scheduleLabelText = useI18n('action.schedule');
    const cancelScheduleLabel = useI18n('action.schedule.cancel');
    const includeChildrenLabel = useI18n('dialog.includeChildren');

    const issueData = resolveIssueData({
        issueId,
        issues,
        detailsIssue,
    });
    const issueWithAssignees = useMemo(
        () => issues.find((item) => item.getIssue().getId() === issueId),
        [issues, issueId],
    );

    // Intentional: useI18n doesn't use React hooks internally; passing it as a translate function.
    // Replace with useI18n() from @enonic/lib-admin-ui when I18nProvider is wired up.
    const statusInfo = useMemo(
        () => (issueData ? generateIssueStatusInfo(issueData, useI18n, user) : undefined),
        [issueData, user],
    );

    const issueIndex = issueData?.getIndex();
    const currentStatus = issueData?.getIssueStatus() ?? IssueStatus.OPEN;
    const statusValue: StatusOption = currentStatus === IssueStatus.CLOSED ? 'closed' : 'open';
    const isStatusDisabled = !issueData || statusUpdating;
    const isCommentsTab = detailsTab === 'comments';
    const isItemsTab = detailsTab === 'items';
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;
    const commentCount = comments.length;
    const assigneeCount = issueData?.getApprovers().length ?? 0;
    const itemsCount = items.length + dependantIds.length - excludedDependantIds.length;
    const tabs = isPublishRequest
        ? [
              { value: 'items', label: publishRequestLabel, count: itemsCount },
              { value: 'comments', label: commentsLabel, count: commentCount },
              { value: 'assignees', label: assigneesLabel, count: assigneeCount },
          ]
        : [
              { value: 'comments', label: commentsLabel, count: commentCount },
              { value: 'items', label: itemsLabel, count: itemsCount },
              { value: 'assignees', label: assigneesLabel, count: assigneeCount },
          ];
    const isTitleDisabled = !issueData || issueError || titleUpdating || statusUpdating || isClosed;
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [publishView, setPublishView] = useState<PublishView>('main');
    const pendingItemIdsRef = useRef<ContentId[] | null>(null);
    const publishProgressTotal = Math.max(1, publishCount || items.length || 1);

    // Schedule state
    const issuePublishFrom = issueData?.getPublishFrom();
    const issuePublishTo = issueData?.getPublishTo();
    const hasIssueSchedule = !!issuePublishFrom || !!issuePublishTo;
    const [scheduleMode, setScheduleMode] = useState(false);
    const [scheduleFromInputError, setScheduleFromInputError] = useState<string | undefined>();
    const [scheduleToInputError, setScheduleToInputError] = useState<string | undefined>();
    const [scheduleFromRangeError, setScheduleFromRangeError] = useState<string | undefined>();
    const [scheduleToRangeError, setScheduleToRangeError] = useState<string | undefined>();
    const firstScheduleInputRef = useRef<HTMLInputElement>(null);
    const backButtonRef = useRef<HTMLButtonElement>(null);
    const scheduleKeyboardActivation = useRef(false);
    const wasScheduleMode = useRef(scheduleMode);
    const scheduleFromRef = useRef<Date | undefined>(issuePublishFrom);
    const scheduleToRef = useRef<Date | undefined>(issuePublishTo);

    const focusBackButton = useCallback((): void => {
        requestAnimationFrame(() => backButtonRef.current?.focus());
    }, []);

    const { options: assigneeOptions, handleSearchChange } = useAssigneeSearch();

    useIssueDialogData(issueId, !!issueData);

    // Auto-open schedule form when issue has schedule dates
    useEffect(() => {
        if (hasIssueSchedule) {
            setScheduleMode(true);
        }
    }, [hasIssueSchedule]);

    // Sync local schedule refs when issue data changes
    useEffect(() => {
        scheduleFromRef.current = issuePublishFrom;
        scheduleToRef.current = issuePublishTo;
    }, [issuePublishFrom, issuePublishTo]);

    // Keyboard focus for schedule form
    useEffect(() => {
        if (scheduleMode && !wasScheduleMode.current && scheduleKeyboardActivation.current) {
            requestAnimationFrame(() => firstScheduleInputRef.current?.focus());
        }
        scheduleKeyboardActivation.current = false;
        wasScheduleMode.current = scheduleMode;
    }, [scheduleMode]);

    // Sync publish dialog context with schedule data
    useEffect(() => {
        if (!issueData) {
            return;
        }
        const schedule =
            issuePublishFrom || issuePublishTo ? { from: issuePublishFrom, to: issuePublishTo } : undefined;
        void syncPublishDialogContext({
            items,
            excludeChildrenIds,
            excludedDependantIds,
            schedule,
        });
    }, [
        excludeChildrenIds,
        excludedDependantIds,
        issueData,
        issuePublishFrom,
        issuePublishTo,
        items,
        syncPublishDialogContext,
    ]);

    const assigneeIds = useMemo(
        () => issueData?.getApprovers().map((approver) => approver.toString()) ?? [],
        [issueData],
    );
    const selectedItemIds = useMemo(() => issueData?.getPublishRequest()?.getItemsIds() ?? [], [issueData]);
    // Content-derived key keeps selection identity stable across unrelated
    // issueData updates, so staged combobox edits are not reset mid-edit.
    const selectedItemIdsKey = useMemo(() => selectedItemIds.map((id) => id.toString()).join('|'), [selectedItemIds]);
    const selectedItemIdStrings = useMemo(() => selectedItemIds.map((id) => id.toString()), [selectedItemIdsKey]);
    const excludeChildrenSet = useMemo(
        () => new Set(excludeChildrenIds.map((id) => id.toString())),
        [excludeChildrenIds],
    );
    const excludedDependantSet = useMemo(
        () => new Set(excludedDependantIds.map((id) => id.toString())),
        [excludedDependantIds],
    );
    const requiredDependantSet = useMemo(
        () => new Set(requiredDependantIds.map((id) => id.toString())),
        [requiredDependantIds],
    );
    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);

    const selectedAssigneeOptions = useAssigneeSelection({
        assigneeIds,
        assignees: issueWithAssignees?.getAssignees(),
        filterSystem: true,
    });

    const issueDataId = useMemo(() => issueData?.getId(), [issueData]);

    useEffect(() => {
        if (!issueData) {
            return;
        }
        void loadIssueDialogItems(issueData);
    }, [issueDataId, loadIssueDialogItems]);

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
        () =>
            createDebounce((next: readonly string[]) => {
                void updateIssueDialogAssignees(next);
            }, 600),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedUpdateAssignees.cancel();
        };
    }, [debouncedUpdateAssignees]);

    const debouncedUpdateSchedule = useMemo(
        () =>
            createDebounce((from: Date | undefined, to: Date | undefined) => {
                void updateIssueDialogSchedule(from, to);
            }, 600),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedUpdateSchedule.cancel();
        };
    }, [debouncedUpdateSchedule]);

    const debouncedUpdateItems = useMemo(
        () =>
            createDebounce((nextIds: ContentId[]) => {
                void updateIssueDialogItems(nextIds);
            }, 0),
        [],
    );

    useEffect(() => {
        return () => {
            debouncedUpdateItems.cancel();
            pendingItemIdsRef.current = null;
        };
    }, [debouncedUpdateItems]);

    useEffect(() => {
        pendingItemIdsRef.current = null;
    }, [selectedItemIdsKey]);

    const handleAssigneesChange = (next: readonly string[]): void => {
        debouncedUpdateAssignees([...next]);
    };

    const handleSelectionChange = useCallback(
        (nextSelection: readonly string[]): void => {
            if (!issueData) {
                return;
            }
            const nextIds = nextSelection.map((id) => new ContentId(id));
            pendingItemIdsRef.current = nextIds;
            debouncedUpdateItems(nextIds);
        },
        [issueData, debouncedUpdateItems],
    );

    const handleItemRemoved = useCallback(
        (id: ContentId): void => {
            if (!issueData) {
                return;
            }
            const baseIds = pendingItemIdsRef.current ?? selectedItemIds;
            const nextIds = baseIds.filter((baseId) => !baseId.equals(id));
            pendingItemIdsRef.current = nextIds;
            debouncedUpdateItems(nextIds);
        },
        [issueData, debouncedUpdateItems, selectedItemIds],
    );

    const handleIncludeChildrenChange = useCallback((id: ContentId, includeChildren: boolean): void => {
        void updateIssueDialogItemIncludeChildren(id, includeChildren);
    }, []);

    const handleDependencyChange = useCallback((id: ContentId, included: boolean): void => {
        void updateIssueDialogDependencyIncluded(id, included);
    }, []);

    const handleScheduleFromChange = useCallback(
        (value: Date | undefined): void => {
            scheduleFromRef.current = value;
            const { fromError, toError } = validateSchedule(value, scheduleToRef.current);
            setScheduleFromRangeError(fromError);
            setScheduleToRangeError(toError);
            if (!fromError && !toError) {
                debouncedUpdateSchedule(value, scheduleToRef.current);
            }
        },
        [debouncedUpdateSchedule, issuePublishFrom, issuePublishTo],
    );

    const handleScheduleToChange = useCallback(
        (value: Date | undefined): void => {
            scheduleToRef.current = value;
            const { fromError, toError } = validateSchedule(scheduleFromRef.current, value);
            setScheduleFromRangeError(fromError);
            setScheduleToRangeError(toError);
            if (!fromError && !toError) {
                debouncedUpdateSchedule(scheduleFromRef.current, value);
            }
        },
        [debouncedUpdateSchedule, issuePublishFrom, issuePublishTo],
    );

    useEffect(() => {
        const { fromError, toError } = validateSchedule(issuePublishFrom, issuePublishTo);
        setScheduleFromRangeError(fromError);
        setScheduleToRangeError(toError);
    }, [issuePublishFrom, issuePublishTo]);

    const handleScheduleToggle = (): void => {
        if (scheduleMode) {
            // Cancel: clear dates from issue immediately
            setScheduleMode(false);
            setScheduleFromInputError(undefined);
            setScheduleToInputError(undefined);
            setScheduleFromRangeError(undefined);
            setScheduleToRangeError(undefined);
            scheduleFromRef.current = undefined;
            scheduleToRef.current = undefined;
            debouncedUpdateSchedule.cancel();
            void updateIssueDialogSchedule(undefined, undefined);
        } else {
            setScheduleMode(true);
        }
    };

    const handleCommentInput: NonNullable<ComponentPropsWithoutRef<'textarea'>['onInput']> = (event) => {
        const { value } = event.currentTarget;
        setIssueDialogCommentText(value);
    };

    const handleCommentKeyDown: NonNullable<ComponentPropsWithoutRef<'textarea'>['onKeyDown']> = (event) => {
        if (event.key !== 'Enter' || event.shiftKey || !canSubmitComment) {
            return;
        }
        event.preventDefault();
        void handleCommentSubmit(true);
    };

    const handleCommentSubmit = async (focusBackAfterSubmit = false): Promise<void> => {
        const submitted = await submitIssueDialogComment();
        if (submitted && focusBackAfterSubmit) {
            focusBackButton();
        }
    };

    const handlePublishComplete = useCallback((resultState: string): void => {
        void (async () => {
            if (resultState === 'SUCCESS') {
                const updated = await updateIssueDialogStatus(IssueStatus.CLOSED);
                if (updated) {
                    closeIssueDialog();
                    return;
                }
            }
            setPublishView('main');
        })();
    }, []);

    const handlePublish = (): void => {
        setPublishView('progress');

        debouncedUpdateSchedule.flush();
        if (scheduleMode) {
            const schedule =
                scheduleFromRef.current || scheduleToRef.current
                    ? { from: scheduleFromRef.current, to: scheduleToRef.current }
                    : undefined;
            if (schedule) {
                void syncPublishDialogContext({
                    items,
                    excludeChildrenIds,
                    excludedDependantIds,
                    schedule,
                });
            }
        }

        publishItems(handlePublishComplete).then((started) => {
            if (!started) {
                setPublishView('main');
            }
        });
    };

    const handleExcludeDependants = useCallback((exclude: () => ContentId[]): void => {
        const excludedIds = exclude();
        void updateIssueDialogExcludedDependants(excludedIds);
    }, []);

    const handleExcludeInProgress = useCallback((): void => {
        handleExcludeDependants(excludeInProgressPublishItems);
    }, [handleExcludeDependants]);

    const handleExcludeInvalid = useCallback((): void => {
        handleExcludeDependants(excludeInvalidPublishItems);
    }, [handleExcludeDependants]);

    const handleExcludeNotPublishable = useCallback((): void => {
        handleExcludeDependants(excludeNotPublishablePublishItems);
    }, [handleExcludeDependants]);

    const handleMarkAllAsReady = useCallback((): void => {
        void (async () => {
            await markAllAsReadyInProgressPublishItems();
            if (issueData) {
                await loadIssueDialogItems(issueData, { forceReload: true });
            }
        })();
    }, [issueData, loadIssueDialogItems]);

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
        return commentText.trim().length > 0 && !commentSubmitting && !!issueId && !issueError && !isClosed;
    }, [commentText, commentSubmitting, issueId, issueError, isClosed]);

    const handleCommentUpdate = useCallback(async (commentId: string, text: string): Promise<boolean> => {
        return await updateIssueDialogComment(commentId, text);
    }, []);

    const scheduleFromError = scheduleFromInputError ?? scheduleFromRangeError;
    const scheduleToError = scheduleToInputError ?? scheduleToRangeError;

    const isAssigneesDisabled = !issueData || issueError || assigneesUpdating || statusUpdating || isClosed;
    const isItemsDisabled = !issueData || issueError || itemsUpdating || statusUpdating || isClosed;
    const hasScheduleErrors = !!scheduleFromError || !!scheduleToError;
    const isPublishDisabled =
        !isPublishReady ||
        !canPublish ||
        isPublishChecking ||
        publishSubmitting ||
        publishDialogOpen ||
        isItemsDisabled ||
        isClosed ||
        itemsLoading ||
        scheduleUpdating ||
        hasScheduleErrors;
    const statusOptions = useMemo(
        () => getStatusOptions(openStatusLabel, closedStatusLabel),
        [openStatusLabel, closedStatusLabel],
    );

    if (publishView === 'progress') {
        return <PublishDialogProgressContent total={publishProgressTotal} progress={publishProgress} />;
    }

    return (
        <Dialog.Content
            data-component={ISSUE_DIALOG_DETAILS_CONTENT_NAME}
            className="sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-236 flex min-h-0 flex-col gap-3 h-sm:gap-7.5 overflow-hidden py-5 px-5 h-sm:py-10"
        >
            <Dialog.Header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5">
                <div className="flex min-w-0 items-center gap-1.5">
                    <IssueIcon issue={issueData} />
                    <Dialog.Title asChild>
                        <span className="inline-flex min-w-0 max-w-full items-baseline gap-1">
                            <EditableText
                                value={issueData?.getTitle()}
                                placeholder={fallbackTitle}
                                onCommit={handleTitleCommit}
                                onEditingChange={setIsEditingTitle}
                                disabled={isTitleDisabled}
                                size="lg"
                                allowEmpty={false}
                                aria-label={titleLabel}
                            />
                            {!isEditingTitle && issueIndex != null && (
                                <span className="text-2xl font-semibold whitespace-nowrap">#{issueIndex}</span>
                            )}
                        </span>
                    </Dialog.Title>
                </div>
                <Dialog.DefaultClose className="self-start justify-self-end" />
            </Dialog.Header>
            <Dialog.Body className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <Tab.Root
                    value={detailsTab}
                    onValueChange={handleTabChange}
                    className="flex min-h-0 flex-1 flex-col gap-3 h-sm:gap-7.5"
                >
                    <div className="grid grid-cols-4 gap-x-3.5 items-end px-2.5">
                        <div className="flex flex-col gap-2.5 px-2.5 pt-1.5">
                            <IssueDialogSelector
                                value={statusValue}
                                disabled={isStatusDisabled}
                                options={statusOptions}
                                placeholder={openStatusLabel}
                                onValueChange={handleStatusChange}
                                tooltip={statusInfo}
                                renderValue={(value) => {
                                    const option = resolveStatusOption(statusOptions, value);
                                    return option ? <IssueStatusBadge status={option.status} /> : openStatusLabel;
                                }}
                                renderItemText={(option) => <IssueStatusBadge status={option.status} />}
                            />
                        </div>
                        <Tab.List className="col-span-3 px-2.5 justify-end">
                            {tabs.map(({ value, label, count }) => (
                                <Tab.DefaultTrigger key={value} value={value} count={count || undefined}>
                                    {label}
                                </Tab.DefaultTrigger>
                            ))}
                        </Tab.List>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col px-5 pb-1.5">
                        <Tab.Content value="comments" className="mt-0 flex min-h-0 flex-1 flex-col">
                            <div className="flex min-h-0 flex-1 flex-col gap-3 h-sm:gap-7.5">
                                <IssueCommentsList
                                    comments={comments}
                                    loading={commentsLoading}
                                    onUpdateComment={!isClosed ? handleCommentUpdate : undefined}
                                    onDeleteComment={!isClosed ? openDeleteCommentConfirmation : undefined}
                                    portalContainer={portalContainer}
                                    aria-label={commentsLabel}
                                />
                                <TextArea
                                    label={commentLabel}
                                    name="comment"
                                    value={commentText}
                                    onInput={handleCommentInput}
                                    onKeyDown={handleCommentKeyDown}
                                    rows={2}
                                    autoSize
                                    resizable
                                    disabled={commentSubmitting || isClosed}
                                    aria-label={commentAriaLabel}
                                    placeholder={commentAriaLabel}
                                    className="[&_textarea]:max-h-75 [&_textarea]:overflow-y-auto"
                                />
                            </div>
                        </Tab.Content>

                        <Tab.Content value="items" className="mt-0 min-h-0 flex flex-1 flex-col">
                            {canShowSelectionStatusBar && (
                                <SelectionStatusBar
                                    className="mb-5"
                                    loading={isPublishChecking}
                                    failed={publishDialogFailed}
                                    editing={false}
                                    showReady={isPublishReady}
                                    onApply={() => {}}
                                    onCancel={() => {}}
                                    errors={{
                                        inProgress: {
                                            ...inProgress,
                                            onExclude: handleExcludeInProgress,
                                            onMarkAsReady: handleMarkAllAsReady,
                                        },
                                        invalid: {
                                            ...invalid,
                                            onExclude: handleExcludeInvalid,
                                        },
                                        noPermissions: {
                                            ...noPermissions,
                                            onExclude: handleExcludeNotPublishable,
                                        },
                                    }}
                                />
                            )}
                            <div className="min-h-0 flex-1 overflow-y-auto px-1.5 -mx-1.5 rounded-sm outline-none focus:ring-2 focus:ring-ring/10 focus:ring-inset">
                                <ContentCombobox
                                    label={itemsLabel}
                                    selection={selectedItemIdStrings}
                                    onSelectionChange={handleSelectionChange}
                                    onAppliedSelectionChange={focusBackButton}
                                    disabled={isItemsDisabled}
                                    closeOnBlur={true}
                                />
                                <div className="pb-1.5 mt-2.5 flex flex-col gap-7.5">
                                    <SplitList>
                                        <SplitList.Primary
                                            items={items}
                                            getItemId={(item) => item.getId()}
                                            disabled={isItemsDisabled || itemsLoading}
                                            renderRow={(item) => {
                                                const id = item.getContentId();
                                                const includeChildren = !excludeChildrenSet.has(id.toString());
                                                const hasUnpublishedChildrenForItem = itemsWithUnpublishedChildren
                                                    ? itemsWithUnpublishedChildren.has(id.toString())
                                                    : true;
                                                const showChildrenCheckbox =
                                                    hasUnpublishedChildrenForItem && item.hasChildren();

                                                return (
                                                    <>
                                                        <ContentRow
                                                            key={item.getId()}
                                                            content={item}
                                                            id={`main-${item.getId()}`}
                                                            disabled={isItemsDisabled || itemsLoading}
                                                        >
                                                            <ContentRow.Label action="edit" variant="detailed" />
                                                            <ContentRow.Status />
                                                            <ContentRow.RemoveButton
                                                                onRemove={() => handleItemRemoved(item.getContentId())}
                                                                disabled={
                                                                    isItemsDisabled ||
                                                                    itemsLoading ||
                                                                    items.length === 1
                                                                }
                                                            />
                                                        </ContentRow>

                                                        {showChildrenCheckbox && (
                                                            <GridList.Row
                                                                id={`${item.getId()}-children`}
                                                                disabled={isItemsDisabled || itemsLoading}
                                                                className="gap-3 px-2.5 -mt-1"
                                                            >
                                                                <GridList.Cell className="pl-2.5 flex items-center gap-2.5">
                                                                    <CornerDownRight className="size-4 shrink-0" />
                                                                    <GridList.Action>
                                                                        <Checkbox
                                                                            className="font-semibold"
                                                                            checked={includeChildren}
                                                                            onCheckedChange={(enabled) =>
                                                                                handleIncludeChildrenChange(
                                                                                    id,
                                                                                    enabled === true,
                                                                                )
                                                                            }
                                                                            disabled={isItemsDisabled || itemsLoading}
                                                                            label={includeChildrenLabel}
                                                                        />
                                                                    </GridList.Action>
                                                                </GridList.Cell>
                                                            </GridList.Row>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        />
                                        <SplitList.Separator hidden={dependants.length === 0}>
                                            <SplitList.SeparatorLabel>{dependenciesLabel}</SplitList.SeparatorLabel>
                                        </SplitList.Separator>

                                        {dependants.length > 0 && (
                                            <div>
                                                {dependantsSelection.count > 0 && (
                                                    <DependantsSelectAll
                                                        selection={dependantsSelection}
                                                        onToggle={toggleIssueDialogDetailsDependantsSelection}
                                                        disabled={isItemsDisabled || itemsLoading}
                                                    />
                                                )}

                                                <SplitList.Secondary
                                                    items={dependants}
                                                    getItemId={(item) => item.getId()}
                                                    disabled={isItemsDisabled || itemsLoading}
                                                    loading={itemsLoading}
                                                    hasMore={hasMoreDependants}
                                                    onEndReached={loadMoreIssueDialogDependants}
                                                    renderRow={(item) => {
                                                        const id = item.getContentId();
                                                        const isRequired = requiredDependantSet.has(id.toString());
                                                        const included = !excludedDependantSet.has(id.toString());

                                                        return (
                                                            <ContentRow
                                                                key={item.getId()}
                                                                content={item}
                                                                id={item.getId()}
                                                                disabled={isItemsDisabled || itemsLoading}
                                                            >
                                                                <ContentRow.Checkbox
                                                                    checked={included}
                                                                    onCheckedChange={(checked) =>
                                                                        handleDependencyChange(id, checked)
                                                                    }
                                                                    disabled={
                                                                        isRequired || isItemsDisabled || itemsLoading
                                                                    }
                                                                />
                                                                <ContentRow.Label action="edit" />
                                                                <ContentRow.Status />
                                                            </ContentRow>
                                                        );
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </SplitList>
                                </div>
                                {isPublishRequest && scheduleMode && (
                                    <IssueScheduleForm
                                        publishFrom={issuePublishFrom}
                                        publishTo={issuePublishTo}
                                        fromError={scheduleFromError}
                                        toError={scheduleToError}
                                        onFromChange={handleScheduleFromChange}
                                        onToChange={handleScheduleToChange}
                                        onFromError={setScheduleFromInputError}
                                        onToError={setScheduleToInputError}
                                        firstInputRef={firstScheduleInputRef}
                                        defaultTimeValue={defaultPublishFromTime}
                                    />
                                )}
                            </div>
                        </Tab.Content>

                        <Tab.Content value="assignees" className="mt-0 min-h-0 flex flex-1 flex-col">
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
                                onAppliedSelectionChange={focusBackButton}
                                onSearchChange={handleSearchChange}
                                disabled={isAssigneesDisabled}
                                className="min-h-0 flex-1"
                                selectedListClassName="min-h-0 flex-1 overflow-y-auto"
                            />
                        </Tab.Content>
                    </div>
                </Tab.Root>
                <div ref={setPortalContainer} />
            </Dialog.Body>
            <Dialog.Footer className="-mt-1.5 px-5 justify-between">
                <Button ref={backButtonRef} variant="outline" size="lg" label={backLabel} onClick={handleBack} />
                {isCommentsTab && (
                    <Button
                        variant="solid"
                        size="lg"
                        label={commentActionLabel}
                        onClick={() => void handleCommentSubmit()}
                        disabled={!canSubmitComment}
                    />
                )}
                {isItemsTab && isPublishRequest && (
                    <>
                        <Button
                            className="ml-auto"
                            size="lg"
                            label={scheduleMode ? cancelScheduleLabel : scheduleLabelText}
                            variant="outline"
                            onClick={handleScheduleToggle}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    scheduleKeyboardActivation.current = true;
                                }
                            }}
                            onPointerDown={() => {
                                scheduleKeyboardActivation.current = false;
                            }}
                            endIcon={!scheduleMode ? Calendar : undefined}
                            disabled={!scheduleMode && isPublishDisabled}
                        />
                        <Button
                            variant="solid"
                            size="lg"
                            label={scheduleMode && hasIssueSchedule ? scheduleLabelText : publishLabel}
                            onClick={handlePublish}
                            disabled={isPublishDisabled}
                        />
                    </>
                )}
            </Dialog.Footer>
        </Dialog.Content>
    );
};

IssueDialogDetailsContent.displayName = ISSUE_DIALOG_DETAILS_CONTENT_NAME;
