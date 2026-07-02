import { Button, Checkbox, Dialog, GridList, TextArea } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Calendar, CornerDownRight, Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $config } from '../../../shared/config/config.store';
import {
    applyDraftPublishDialogSelection,
    cancelDraftPublishDialogSelection,
    clearPublishSchedule,
    excludeInProgressPublishItems,
    excludeInvalidPublishItems,
    excludeNotPublishablePublishItems,
    loadMoreDependants,
    markAllAsReadyInProgressPublishItems,
    removePublishDialogItem,
    setPublishDialogDependantItemSelected,
    setPublishDialogItemWithChildrenSelected,
    setPublishDialogMessage,
    setPublishSchedule,
    togglePublishDialogDependantsSelection,
    togglePublishDialogShowExcluded,
} from '../model/publishDialog.commands';
import {
    $dependantPublishItems,
    $hasExcludedDependantItems,
    $hasMoreDependants,
    $hasSchedulableItems,
    $isPublishChecking,
    $isPublishReady,
    $isPublishSelectionSynced,
    $mainPublishItems,
    $publishCheckErrors,
    $publishDependantsSelection,
    $publishDialog,
    $showPublishDependantsExcluded,
    $totalPublishableItems,
} from '../model/publishDialog.store';
import { ContentRow, SplitList } from '../../shared/lists';
import { DependantsSelectAll } from '../../../shared/ui/dialogs/dependants/DependantsSelectAll';
import { SelectionStatusBar } from '../../../shared/ui/dialogs/status-bar/SelectionStatusBar';
import { PublishDialogItemStatus } from './PublishDialogItemStatus';
import { PublishScheduleForm } from './PublishScheduleForm';

type PublishDialogMainContentProps = {
    onPublish: () => void;
    'data-component'?: string;
};

const PUBLISH_DIALOG_MAIN_CONTENT_NAME = 'PublishDialogMainContent';

export const PublishDialogMainContent = ({
    onPublish,
    'data-component': componentName = PUBLISH_DIALOG_MAIN_CONTENT_NAME,
}: PublishDialogMainContentProps): ReactElement => {
    const { failed, message } = useStore($publishDialog, { keys: ['failed', 'message'] });
    const loading = useStore($isPublishChecking);
    const isPublishReady = useStore($isPublishReady);
    const { allowContentUpdate, defaultPublishFromTime } = useStore($config, {
        keys: ['allowContentUpdate', 'defaultPublishFromTime'],
    });
    const mainItems = useStore($mainPublishItems);
    const dependantItems = useStore($dependantPublishItems);
    const hasMoreDependants = useStore($hasMoreDependants);
    const publishCount = useStore($totalPublishableItems);
    const hasSchedulableItems = useStore($hasSchedulableItems);
    const hasExcludedItems = useStore($hasExcludedDependantItems);
    const showExcluded = useStore($showPublishDependantsExcluded);
    const dependantsSelection = useStore($publishDependantsSelection);

    const isSelectionSynced = useStore($isPublishSelectionSynced);

    const { invalid, inProgress, noPermissions } = useStore($publishCheckErrors);
    const { schedule } = useStore($publishDialog, { keys: ['schedule'] });
    const scheduleMode = schedule !== undefined;
    const showScheduleButton = scheduleMode || hasSchedulableItems;
    const firstScheduleInputRef = useRef<HTMLInputElement>(null);
    const wasScheduleMode = useRef(scheduleMode);

    const scheduleKeyboardActivation = useRef(false);
    const [showComment, setShowComment] = useState(false);
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

    const visibleDependantItems = dependantItems.filter(
        (item) => !item.hidden && (showExcluded || !item.excludedByDefault),
    );
    const hasVisibleDependantItems = visibleDependantItems.length > 0;
    const showExcludedLabel = useI18n('dialog.publish.excluded.show');
    const hideExcludedLabel = useI18n('dialog.publish.excluded.hide');
    const toggleExcludedLabel = showExcluded ? hideExcludedLabel : showExcludedLabel;

    useEffect(() => {
        if (scheduleMode && !wasScheduleMode.current && scheduleKeyboardActivation.current) {
            requestAnimationFrame(() => firstScheduleInputRef.current?.focus());
        }
        scheduleKeyboardActivation.current = false;
        wasScheduleMode.current = scheduleMode;
    }, [scheduleMode]);

    useEffect(() => {
        if (showComment && commentTextareaRef.current) {
            commentTextareaRef.current.focus();
            commentTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [showComment]);

    const handleToggleComment = () => {
        if (showComment) {
            setPublishDialogMessage(undefined);
        }
        setShowComment((prev) => !prev);
    };

    const title = useI18n('dialog.publish');
    const separatorLabel = useI18n('dialog.dependencies');
    const allExcludedMessage = useI18n('dialog.dependencies.allExcluded');
    const scheduleLabel = useI18n('action.schedule');
    const confirmScheduleLabel = useI18n('action.schedule.confirm');
    const cancelScheduleLabel = useI18n('action.schedule.cancel');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;
    const includeChildrenLabel = useI18n('dialog.includeChildren');
    const commentLabel = useI18n('field.comment.label');
    const commentPlaceholder = useI18n('field.comment.placeholder');
    const addCommentLabel = useI18n('action.comment.add');
    const removeCommentLabel = useI18n('action.comment.remove');
    const commentToggleLabel = showComment ? removeCommentLabel : addCommentLabel;

    const handleSchedule = () => {
        if (scheduleMode) {
            clearPublishSchedule();
        } else {
            setPublishSchedule({});
        }
    };

    const baseId = useId();
    const titleId = `${PUBLISH_DIALOG_MAIN_CONTENT_NAME}-${baseId}-title`;

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
            data-component={componentName}
        >
            <Dialog.DefaultHeader titleId={titleId} title={title} withClose />

            <SelectionStatusBar
                editing={!isSelectionSynced}
                failed={failed}
                loading={loading}
                showReady={isPublishReady}
                onApply={applyDraftPublishDialogSelection}
                onCancel={cancelDraftPublishDialogSelection}
                errors={{
                    inProgress: {
                        ...inProgress,
                        onMarkAsReady: allowContentUpdate
                            ? () => void markAllAsReadyInProgressPublishItems()
                            : undefined,
                        onExclude: () => excludeInProgressPublishItems(),
                    },
                    invalid: {
                        ...invalid,
                        onExclude: () => excludeInvalidPublishItems(),
                    },
                    noPermissions: {
                        ...noPermissions,
                        onExclude: () => excludeNotPublishablePublishItems(),
                    },
                }}
            />

            <Dialog.Body className="flex flex-col gap-y-10 px-1.5 -mx-1.5 rounded-sm outline-none focus:ring-2 focus:ring-ring/10 focus:ring-inset">
                <SplitList>
                    <SplitList.Primary
                        items={mainItems}
                        getItemId={(item) => item.id}
                        disabled={loading}
                        renderRow={(item) => {
                            const showChildrenCheckbox = item.hasUnpublishedChildren && item.content.hasChildren();
                            return (
                                <>
                                    <ContentRow key={item.id} content={item.content} id={item.id} disabled={loading}>
                                        <ContentRow.Label action="edit" variant="detailed" />
                                        <PublishDialogItemStatus />
                                        <ContentRow.RemoveButton
                                            onRemove={() => removePublishDialogItem(item.content.getContentId())}
                                            disabled={item.required || loading || mainItems.length === 1}
                                        />
                                    </ContentRow>

                                    {showChildrenCheckbox && (
                                        <GridList.Row
                                            id={`${item.id}-children`}
                                            disabled={loading || !item.included}
                                            className="gap-3 px-2.5 -mt-1"
                                        >
                                            <GridList.Cell className="pl-2.5 flex items-center gap-2.5">
                                                <CornerDownRight className="size-4 shrink-0" />
                                                <GridList.Action>
                                                    <Checkbox
                                                        className="font-semibold"
                                                        checked={item.childrenIncluded}
                                                        onCheckedChange={(enabled) =>
                                                            setPublishDialogItemWithChildrenSelected(
                                                                item.content.getContentId(),
                                                                enabled === true,
                                                            )
                                                        }
                                                        disabled={item.required || loading || !item.included}
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

                    <SplitList.Separator hidden={!hasVisibleDependantItems && !hasExcludedItems}>
                        <SplitList.SeparatorLabel>{separatorLabel}</SplitList.SeparatorLabel>
                        {hasExcludedItems && isSelectionSynced && (
                            <SplitList.SeparatorButton
                                label={toggleExcludedLabel}
                                onClick={togglePublishDialogShowExcluded}
                                disabled={loading}
                            />
                        )}
                    </SplitList.Separator>

                    {(hasVisibleDependantItems || hasExcludedItems) && (
                        <div>
                            {dependantsSelection.count > 0 && (
                                <DependantsSelectAll
                                    selection={dependantsSelection}
                                    onToggle={togglePublishDialogDependantsSelection}
                                    disabled={loading}
                                />
                            )}

                            <SplitList.Secondary
                                items={visibleDependantItems}
                                getItemId={(item) => item.id}
                                emptyMessage={hasExcludedItems ? allExcludedMessage : undefined}
                                disabled={loading}
                                loading={loading}
                                hasMore={hasMoreDependants}
                                onEndReached={loadMoreDependants}
                                renderRow={(item) => (
                                    <ContentRow key={item.id} content={item.content} id={item.id} disabled={loading}>
                                        <ContentRow.Checkbox
                                            checked={item.included}
                                            onCheckedChange={(checked) =>
                                                setPublishDialogDependantItemSelected(
                                                    item.content.getContentId(),
                                                    checked,
                                                )
                                            }
                                            disabled={item.required || loading}
                                        />
                                        <ContentRow.Label action="edit" />
                                        <PublishDialogItemStatus />
                                    </ContentRow>
                                )}
                            />
                        </div>
                    )}
                </SplitList>

                {showComment && (
                    <TextArea
                        ref={commentTextareaRef}
                        label={commentLabel}
                        value={message ?? ''}
                        onInput={(e) => setPublishDialogMessage(e.currentTarget.value)}
                        placeholder={commentPlaceholder}
                        rows={2}
                        className="mb-2"
                    />
                )}
                {scheduleMode && (
                    <PublishScheduleForm
                        firstInputRef={firstScheduleInputRef}
                        defaultTimeValue={defaultPublishFromTime}
                    />
                )}
            </Dialog.Body>
            <Dialog.Footer>
                <Button
                    label={commentToggleLabel}
                    endIcon={showComment ? X : Plus}
                    variant="outline"
                    onClick={handleToggleComment}
                />
                {showScheduleButton && (
                    <Button
                        className={'ml-auto'}
                        label={scheduleMode ? cancelScheduleLabel : scheduleLabel}
                        variant="outline"
                        onClick={handleSchedule}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                scheduleKeyboardActivation.current = true;
                            }
                        }}
                        onPointerDown={() => {
                            scheduleKeyboardActivation.current = false;
                        }}
                        endIcon={!scheduleMode && Calendar}
                        disabled={!scheduleMode && !isPublishReady}
                    />
                )}
                <Button
                    className={showScheduleButton ? undefined : 'ml-auto'}
                    label={scheduleMode ? confirmScheduleLabel : publishLabel}
                    variant="solid"
                    onClick={onPublish}
                    disabled={!isPublishReady}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

PublishDialogMainContent.displayName = PUBLISH_DIALOG_MAIN_CONTENT_NAME;
