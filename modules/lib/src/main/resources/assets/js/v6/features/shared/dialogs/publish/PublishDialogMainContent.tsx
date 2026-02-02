import {Button, Checkbox, cn, Dialog, GridList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Calendar, CornerDownRight, Plus, X} from 'lucide-react';
import {useEffect, useId, useRef, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$config} from '../../../store/config.store';
import {
    $dependantPublishItems,
    $isPublishChecking,
    $isPublishReady,
    $isPublishSelectionSynced,
    $mainPublishItems,
    $publishCheckErrors,
    $publishDialog,
    $totalPublishableItems,
    applyDraftPublishDialogSelection,
    cancelDraftPublishDialogSelection,
    clearPublishSchedule,
    excludeInProgressPublishItems,
    excludeInvalidPublishItems,
    excludeNotPublishablePublishItems,
    markAllAsReadyInProgressPublishItems,
    removePublishDialogItem,
    setPublishDialogDependantItemSelected,
    setPublishDialogItemWithChildrenSelected,
    setPublishDialogMessage,
    setPublishSchedule,
} from '../../../store/dialogs/publishDialog.store';
import {ContentRow} from '../../lists';
import {SplitList} from '../../lists/split-list';
import {SelectionStatusBar} from '../status-bar/SelectionStatusBar';
import {PublishScheduleForm} from './PublishScheduleForm';

type PublishDialogMainContentProps = {
    onPublish: () => void;
    'data-component'?: string;
};

const PUBLISH_DIALOG_MAIN_CONTENT_NAME = 'PublishDialogMainContent';

export const PublishDialogMainContent = ({
    onPublish,
    'data-component': componentName = PUBLISH_DIALOG_MAIN_CONTENT_NAME,
}: PublishDialogMainContentProps): ReactElement => {
    const {failed, message} = useStore($publishDialog, {keys: ['failed', 'message']});
    const loading = useStore($isPublishChecking);
    const isPublishReady = useStore($isPublishReady);
    const {allowContentUpdate, defaultPublishFromTime} = useStore($config, {keys: ['allowContentUpdate', 'defaultPublishFromTime']});
    const mainItems = useStore($mainPublishItems);
    const dependantItems = useStore($dependantPublishItems);
    const publishCount = useStore($totalPublishableItems);

    const hasDependantItems = dependantItems.length > 0;

    const isSelectionSynced = useStore($isPublishSelectionSynced);

    const {invalid, inProgress, noPermissions} = useStore($publishCheckErrors);
    const {schedule} = useStore($publishDialog, {keys: ['schedule']});
    const scheduleMode = schedule !== undefined;
    const firstScheduleInputRef = useRef<HTMLInputElement>(null);
    const wasScheduleMode = useRef(scheduleMode);

    const [showExcluded, setShowExcluded] = useState(false);
    const scheduleKeyboardActivation = useRef(false);
    const [showComment, setShowComment] = useState(false);
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

    const visibleDependantItems = showExcluded
        ? dependantItems
        : dependantItems.filter(item => !item.excludedByDefault);
    const hasAnyExcludedDependantItems = dependantItems.some(item => item.excludedByDefault);
    const showExcludedLabel = useI18n('dialog.publish.excluded.show');
    const hideExcludedLabel = useI18n('dialog.publish.excluded.hide');
    const toggleExcludedLabel = showExcluded ? hideExcludedLabel : showExcludedLabel;

    useEffect(() => {
        if (!hasAnyExcludedDependantItems) {
            setShowExcluded(false);
        }
    }, [hasAnyExcludedDependantItems]);

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
            commentTextareaRef.current.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }
    }, [showComment]);

    const handleToggleComment = () => {
        if (showComment) {
            setPublishDialogMessage(undefined);
        }
        setShowComment(prev => !prev);
    };

    const title = useI18n('dialog.publish');
    const separatorLabel = useI18n('dialog.publish.dependants');
    const emptyDependenciesMessage = useI18n('field.publish.dependencies.empty');
    const scheduleLabel = useI18n('action.schedule');
    const confirmScheduleLabel = useI18n('action.schedule.confirm');
    const cancelScheduleLabel = useI18n('action.schedule.cancel');
    const publishLabelSingle = useI18n('action.publishNow');
    const publishLabelMultiple = useI18n('action.publishNowCount', publishCount);
    const publishLabel = publishCount > 1 ? publishLabelMultiple : publishLabelSingle;
    const includeChildrenLabel = useI18n('field.content.includeChildren');
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
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
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
                        onMarkAsReady: allowContentUpdate ? () => void markAllAsReadyInProgressPublishItems() : undefined,
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
                }} />

            <Dialog.Body className="flex flex-col gap-y-10 px-1.5 -mx-1.5" tabIndex={-1}>
                <SplitList>
                    <SplitList.Primary
                        items={mainItems}
                        getItemId={(item) => item.id}
                        disabled={loading}
                        renderRow={(item) => {
                            const showChildrenCheckbox = item.hasUnpublishedChildren && item.content.hasChildren();
                            return (
                                <>
                                    <ContentRow
                                        key={item.id}
                                        content={item.content}
                                        id={item.id}
                                        disabled={item.required || loading}
                                    >
                                        <ContentRow.Label action="edit" />
                                        <ContentRow.Status variant="diff" />
                                        <ContentRow.RemoveButton
                                            onRemove={() => removePublishDialogItem(item.content.getContentId())}
                                            disabled={item.required || loading || mainItems.length === 1}
                                        />
                                    </ContentRow>

                                    {showChildrenCheckbox && (
                                        <GridList.Row
                                            id={`${item.id}-children`}
                                            disabled={item.required || loading || !item.included}
                                            className="gap-3 px-2.5 -mt-1"
                                        >
                                            <GridList.Cell className="pl-2.5 flex items-center gap-2.5">
                                                <CornerDownRight className="size-4 shrink-0" />
                                                <GridList.Action>
                                                    <Checkbox
                                                        className="font-semibold"
                                                        checked={item.childrenIncluded}
                                                        onCheckedChange={(enabled) => setPublishDialogItemWithChildrenSelected(item.content.getContentId(), enabled === true)}
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

                    <SplitList.Separator hidden={!hasDependantItems}>
                        <SplitList.SeparatorLabel>{separatorLabel}</SplitList.SeparatorLabel>
                        <SplitList.SeparatorToggle
                            label={toggleExcludedLabel}
                            pressed={showExcluded}
                            onPressedChange={setShowExcluded}
                            disabled={!hasAnyExcludedDependantItems}
                        />
                    </SplitList.Separator>

                    <SplitList.Secondary
                        items={visibleDependantItems}
                        getItemId={(item) => item.id}
                        emptyMessage={hasDependantItems ? emptyDependenciesMessage : undefined}
                        disabled={loading}
                        renderRow={(item) => (
                            <ContentRow
                                key={item.id}
                                content={item.content}
                                id={item.id}
                                disabled={item.required || loading}
                            >
                                <ContentRow.Checkbox
                                    checked={item.included}
                                    onCheckedChange={(checked) => setPublishDialogDependantItemSelected(item.content.getContentId(), checked)}
                                />
                                <ContentRow.Label action="edit" />
                                <ContentRow.Status variant="diff" />
                            </ContentRow>
                        )}
                    />
                </SplitList>

                {showComment && (
                    <div className='flex flex-col gap-2 pb-1.5'>
                        <label className='font-semibold' htmlFor={commentTextareaRef.current?.id}>{commentLabel}</label>
                        <textarea
                            id={`${PUBLISH_DIALOG_MAIN_CONTENT_NAME}-${baseId}-comment`}
                            ref={commentTextareaRef}
                            value={message ?? ''}
                            onInput={(e) => setPublishDialogMessage((e.target as HTMLTextAreaElement).value)}
                            placeholder={commentPlaceholder}
                            rows={2}
                            className={cn(
                                'w-full resize-none rounded-sm border px-4.5 py-3',
                                'border-bdr-subtle bg-surface-neutral text-main placeholder:text-subtle',
                                'focus-visible:border-bdr-strong focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                                'focus-visible:ring-offset-3 focus-visible:ring-offset-ring-offset',
                            )}
                        />
                    </div>
                )}
                {scheduleMode && <PublishScheduleForm firstInputRef={firstScheduleInputRef} defaultTimeValue={defaultPublishFromTime} />}
            </Dialog.Body>
            <Dialog.Footer>
                <Button
                    label={commentToggleLabel}
                    endIcon={showComment ? X : Plus}
                    variant="outline"
                    onClick={handleToggleComment}
                />
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
                <Button label={scheduleMode ? confirmScheduleLabel : publishLabel} variant="solid" onClick={onPublish} disabled={!isPublishReady} />
            </Dialog.Footer>

        </Dialog.Content>
    );
};

PublishDialogMainContent.displayName = PUBLISH_DIALOG_MAIN_CONTENT_NAME;
