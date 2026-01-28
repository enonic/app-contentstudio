import {Button, Dialog, Input, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useId, useMemo, useRef, type ReactElement} from 'react';
import {IssueType} from '../../../../../app/issue/IssueType';
import {useI18n} from '../../../hooks/useI18n';
import {$config} from '../../../store/config.store';
import {
    $isRequestPublishReady,
    $requestPublishDialog,
    $requestPublishDialogCreateCount,
    $requestPublishDialogErrors,
    excludeInProgressRequestPublishItems,
    excludeInvalidRequestPublishItems,
    excludeNotPublishableRequestPublishItems,
    markAllAsReadyInProgressRequestPublishItems,
    setRequestPublishAssignees,
    setRequestPublishDependantIncluded,
    setRequestPublishDescription,
    setRequestPublishItemIncludeChildren,
    setRequestPublishTitle,
    submitRequestPublishDialog,
} from '../../../store/dialogs/requestPublishDialog.store';
import {uniqueIds} from '../../../utils/cms/content/ids';
import {useItemsWithUnpublishedChildren} from '../../../utils/cms/content/useItemsWithUnpublishedChildren';
import {IssueIcon} from '../issue/IssueIcon';
import {AssigneeSelector} from '../../selectors/assignee/AssigneeSelector';
import {useAssigneeSearch, useAssigneeSelection} from '../../selectors/assignee/hooks/useAssigneeSearch';
import {ContentListItemSelectable} from '../../items/ContentListItemSelectable';
import {ContentListItemWithChildren} from '../../items/ContentListItemWithChildren';
import {SelectionStatusBar} from '../status-bar/SelectionStatusBar';

const REQUEST_PUBLISH_DIALOG_CONTENT_NAME = 'RequestPublishDialogContent';

const resizeTextarea = (element: HTMLTextAreaElement): void => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
};

export const RequestPublishDialogContent = (): ReactElement => {
    const {
        title,
        description,
        assigneeIds,
        items,
        excludedChildrenIds,
        dependants,
        excludedDependantIds,
        requiredDependantIds,
        loading,
        failed,
        submitting,
    } = useStore($requestPublishDialog, {
        keys: [
            'title',
            'description',
            'assigneeIds',
            'items',
            'excludedChildrenIds',
            'dependants',
            'excludedDependantIds',
            'requiredDependantIds',
            'loading',
            'failed',
            'submitting',
        ],
    });
    const createCount = useStore($requestPublishDialogCreateCount);
    const isPublishReady = useStore($isRequestPublishReady);
    const {invalid, inProgress, noPermissions} = useStore($requestPublishDialogErrors);
    const {allowContentUpdate} = useStore($config, {keys: ['allowContentUpdate']});

    const dialogTitle = useI18n('dialog.requestPublish');
    const titleLabel = useI18n('field.title');
    const addCommentLabel = useI18n('field.comment.aria.label');
    const assigneesLabel = useI18n('dialog.requestPublish.assignees');
    const itemsLabel = useI18n('field.items');
    const dependenciesLabel = useI18n('dialog.dependencies');
    const createLabel = useI18n('action.createRequest');
    const applyLabel = useI18n('action.apply');
    const noResultsLabel = useI18n('dialog.search.result.noResults');

    const excludedChildrenSet = useMemo(
        () => new Set(excludedChildrenIds.map(id => id.toString())),
        [excludedChildrenIds],
    );
    const excludedDependantSet = useMemo(
        () => new Set(excludedDependantIds.map(id => id.toString())),
        [excludedDependantIds],
    );
    const requiredDependantSet = useMemo(
        () => new Set(requiredDependantIds.map(id => id.toString())),
        [requiredDependantIds],
    );

    const publishTargetIds = useMemo(() => {
        const includedItems = items.map(item => item.getContentId());
        const includedDependants = dependants
            .filter(item => !excludedDependantSet.has(item.getContentId().toString()))
            .map(item => item.getContentId());
        return uniqueIds([...includedItems, ...includedDependants]);
    }, [items, dependants, excludedDependantSet]);

    const {options: assigneeOptions, handleSearchChange} = useAssigneeSearch({
        publishableContentIds: publishTargetIds,
        useRootFallback: true,
    });
    const selectedAssigneeOptions = useAssigneeSelection({assigneeIds});

    const changesInputId = useId();
    const otherDetailsInputId = useId();
    const otherDetailsTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const element = otherDetailsTextareaRef.current;
        if (!element) {
            return;
        }
        resizeTextarea(element);
    }, [description]);

    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);

    const createButtonLabel = createCount > 1
                              ? `${createLabel} (${createCount})`
                              : createLabel;
    const isCreateDisabled = submitting || loading || !isPublishReady || title.trim().length === 0;

    const handleAssigneesChange = (next: readonly string[]) => {
        setRequestPublishAssignees([...next]);
    };

    const handleCreate = () => {
        if (title.trim().length === 0) {
            return;
        }
        void submitRequestPublishDialog();
    };

    const isItemsDisabled = submitting || loading;

    return (
        <Dialog.Content
            data-component={REQUEST_PUBLISH_DIALOG_CONTENT_NAME}
            className='sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5'
        >
            <Dialog.Header className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5'>
                <div className='flex min-w-0 items-center gap-2.5'>
                    <IssueIcon type={IssueType.PUBLISH_REQUEST} />
                    <Dialog.Title className='min-w-0 truncate text-2xl font-semibold'>{dialogTitle}</Dialog.Title>
                </div>
                <Dialog.DefaultClose className='self-start justify-self-end' />
            </Dialog.Header>

            <SelectionStatusBar
                className='px-5'
                loading={loading}
                failed={failed}
                showReady={isPublishReady}
                editing={false}
                onApply={() => undefined}
                onCancel={() => undefined}
                errors={{
                    inProgress: {
                        ...inProgress,
                        onMarkAsReady: allowContentUpdate
                                       ? () => void markAllAsReadyInProgressRequestPublishItems()
                                       : undefined,
                        onExclude: () => excludeInProgressRequestPublishItems(),
                    },
                    invalid: {
                        ...invalid,
                        onExclude: () => excludeInvalidRequestPublishItems(),
                    },
                    noPermissions: {
                        ...noPermissions,
                        onExclude: () => excludeNotPublishableRequestPublishItems(),
                    },
                }}
            />

            <Dialog.Body className='min-h-0 overflow-y-auto'>
                <div className='flex min-h-0 flex-col gap-7.5 px-5'>
                    <div className='flex flex-col gap-2'>
                        <label className='text-md font-semibold' htmlFor={changesInputId}>
                            {titleLabel}
                        </label>
                        <Input
                            id={changesInputId}
                            value={title}
                            onChange={(event) => setRequestPublishTitle(event.currentTarget.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <label className='text-md font-semibold' htmlFor={otherDetailsInputId}>
                            {addCommentLabel}
                        </label>
                        <textarea
                            id={otherDetailsInputId}
                            ref={otherDetailsTextareaRef}
                            value={description}
                            onInput={(event) => {
                                setRequestPublishDescription(event.currentTarget.value);
                                resizeTextarea(event.currentTarget);
                            }}
                            rows={2}
                            disabled={submitting}
                            className={cn(
                                'w-full resize-none overflow-hidden rounded-sm border border-bdr-soft bg-surface px-4.5 py-3',
                                'transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring',
                                'focus-visible:ring-offset-3 focus-visible:ring-offset-ring-offset',
                                submitting && 'opacity-70',
                            )}
                        />
                    </div>

                    <div className='flex flex-col gap-2.5'>
                        <span className='text-md font-semibold'>{assigneesLabel}</span>
                        <AssigneeSelector
                            label={assigneesLabel}
                            options={assigneeOptions}
                            selectedOptions={selectedAssigneeOptions}
                            selection={assigneeIds}
                            applyLabel={applyLabel}
                            emptyLabel={noResultsLabel}
                            onSelectionChange={handleAssigneesChange}
                            onSearchChange={handleSearchChange}
                            disabled={submitting}
                        />
                    </div>

                    {items.length > 0 && (
                        <div className='flex flex-col gap-2.5'>
                            <span className='text-md font-semibold'>{itemsLabel}</span>
                            <ul className='flex flex-col gap-2.5'>
                                {items.map(item => {
                                    const id = item.getContentId();
                                    const includeChildren = !excludedChildrenSet.has(id.toString());
                                    const hasUnpublishedChildrenForItem = itemsWithUnpublishedChildren
                                                                          ? itemsWithUnpublishedChildren.has(id.toString())
                                                                          : true;

                                    return (
                                        <ContentListItemWithChildren
                                            key={item.getId()}
                                            id={`main-${item.getId()}`}
                                            content={item}
                                            includeChildren={includeChildren}
                                            onIncludeChildrenChange={(enabled) =>
                                                setRequestPublishItemIncludeChildren(id, enabled)
                                            }
                                            showIncludeChildren={hasUnpublishedChildrenForItem}
                                            readOnly={isItemsDisabled}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {dependants.length > 0 && (
                        <div className='flex flex-col gap-7.5'>
                            <Separator className='pr-1' label={dependenciesLabel} />
                            <ul className='flex flex-col gap-1.5'>
                                {dependants.map(item => {
                                    const id = item.getContentId();
                                    const isRequired = requiredDependantSet.has(id.toString());
                                    const included = !excludedDependantSet.has(id.toString());

                                    return (
                                        <ContentListItemSelectable
                                            key={item.getId()}
                                            content={item}
                                            checked={included}
                                            readOnly={isRequired || isItemsDisabled}
                                            onCheckedChange={(enabled) =>
                                                setRequestPublishDependantIncluded(id, enabled)
                                            }
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </Dialog.Body>
            <Dialog.Footer className='px-5'>
                <Button
                    variant='solid'
                    size='lg'
                    label={createButtonLabel}
                    disabled={isCreateDisabled}
                    onClick={handleCreate}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

RequestPublishDialogContent.displayName = REQUEST_PUBLISH_DIALOG_CONTENT_NAME;
