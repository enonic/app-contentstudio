import {Button, Dialog, Input, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useId, useRef, type ReactElement} from 'react';

import {IssueType} from '../../../../../app/issue/IssueType';
import {useI18n} from '../../../hooks/useI18n';
import {useAssigneeSearch, useAssigneeSelection} from '../../selectors/assignee/hooks/useAssigneeSearch';
import {AssigneeSelector} from '../../selectors/assignee/AssigneeSelector';
import {IssueItemsSelector} from '../../selectors/issue-items/IssueItemsSelector';
import {IssueSelectedItems} from './IssueSelectedItems';
import {IssueSelectedDependencies} from './IssueSelectedDependencies';
import {
    $newIssueDialog,
    $newIssueDialogCreateCount,
    addNewIssueItems,
    removeNewIssueItemsByIds,
    setNewIssueAssignees,
    setNewIssueDescription,
    setNewIssueDependantIncluded,
    setNewIssueItemIncludeChildren,
    setNewIssueTitle,
    submitNewIssueDialog,
} from '../../../store/dialogs/newIssueDialog.store';
import {IssueIcon} from './IssueIcon';
import {useIssuePublishTargetIds} from './hooks/useIssuePublishTargetIds';

const NEW_ISSUE_DIALOG_CONTENT_NAME = 'NewIssueDialogContent';

const resizeTextarea = (element: HTMLTextAreaElement): void => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
};

export const NewIssueDialogContent = (): ReactElement => {
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
        submitting,
    } = useStore($newIssueDialog, {
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
            'submitting',
        ],
    });

    const createCount = useStore($newIssueDialogCreateCount);

    const titleLabel = useI18n('field.title');
    const descriptionLabel = useI18n('field.description');
    const assigneesLabel = useI18n('field.assignees');
    const itemsLabel = useI18n('field.items');
    const dependenciesLabel = useI18n('dialog.dependencies');
    const createLabel = useI18n('action.createIssue');
    const applyLabel = useI18n('action.apply');
    const dialogTitle = useI18n('text.newIssue');
    const inviteUsersLabel = useI18n('dialog.issue.inviteUsers');
    const noResultsLabel = useI18n('dialog.search.result.noResults');

    const publishTargetIds = useIssuePublishTargetIds(items, dependants, excludedDependantIds);

    const {options: assigneeOptions, handleSearchChange} = useAssigneeSearch({
        publishableContentIds: publishTargetIds,
        useRootFallback: true,
    });
    const selectedAssigneeOptions = useAssigneeSelection({assigneeIds});
    const titleInputId = useId();
    const descriptionInputId = useId();
    const descriptionTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const element = descriptionTextareaRef.current;
        if (!element) {
            return;
        }
        resizeTextarea(element);
    }, [description]);

    const isItemsDisabled = submitting || loading;

    const createButtonLabel = createCount > 1
                              ? `${createLabel} (${createCount})`
                              : createLabel;
    const isCreateDisabled = submitting || loading || title.trim().length === 0;

    const handleAssigneesChange = (next: readonly string[]) => {
        setNewIssueAssignees([...next]);
    };

    const handleCreate = () => {
        if (title.trim().length === 0) {
            return;
        }
        void submitNewIssueDialog();
    };

    return (
        <Dialog.Content
            data-component={NEW_ISSUE_DIALOG_CONTENT_NAME}
            className='sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5'
        >
            <Dialog.Header className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5'>
                <div className='flex min-w-0 items-center gap-2.5'>
                    <IssueIcon type={IssueType.STANDARD}/>
                    <Dialog.Title className='min-w-0 truncate text-2xl font-semibold'>{dialogTitle}</Dialog.Title>
                </div>
                <Dialog.DefaultClose className='self-start justify-self-end'/>
            </Dialog.Header>
            <Dialog.Body className='min-h-0 overflow-y-auto'>
                <div className='flex min-h-0 flex-col gap-7.5 px-5'>
                    <div className='flex flex-col gap-2'>
                        <label className='text-md font-semibold' htmlFor={titleInputId}>
                            {titleLabel}
                        </label>
                        <Input
                            id={titleInputId}
                            value={title}
                            onChange={(event) => setNewIssueTitle(event.currentTarget.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <label className='text-md font-semibold' htmlFor={descriptionInputId}>
                            {descriptionLabel}
                        </label>
                        <textarea
                            id={descriptionInputId}
                            ref={descriptionTextareaRef}
                            value={description}
                            onInput={(event) => {
                                setNewIssueDescription(event.currentTarget.value);
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
                        placeholder={inviteUsersLabel}
                        searchPlaceholder={inviteUsersLabel}
                        emptyLabel={noResultsLabel}
                        onSelectionChange={handleAssigneesChange}
                        onSearchChange={handleSearchChange}
                        disabled={submitting}
                    />
                </div>

                    <div className='flex flex-col gap-2.5'>
                        <span className='text-md font-semibold'>{itemsLabel}</span>
                        <IssueItemsSelector
                            label={itemsLabel}
                            selectedIds={items.map(item => item.getContentId())}
                            disabled={submitting}
                            onItemsAdded={addNewIssueItems}
                            onItemsRemoved={removeNewIssueItemsByIds}
                        />
                    </div>

                    {items.length > 0 && (
                        <IssueSelectedItems
                            items={items}
                            excludedChildrenIds={excludedChildrenIds}
                            disabled={isItemsDisabled}
                            loading={loading}
                            onIncludeChildrenChange={(id, includeChildren) =>
                                setNewIssueItemIncludeChildren(id, includeChildren)
                            }
                            onRemoveItem={(id) => removeNewIssueItemsByIds([id])}
                        />
                    )}

                    {dependants.length > 0 && (
                        <IssueSelectedDependencies
                            label={dependenciesLabel}
                            dependants={dependants}
                            excludedDependantIds={excludedDependantIds}
                            requiredDependantIds={requiredDependantIds}
                            disabled={isItemsDisabled}
                            loading={loading}
                            onDependencyChange={(id, included) => setNewIssueDependantIncluded(id, included)}
                        />
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

NewIssueDialogContent.displayName = NEW_ISSUE_DIALOG_CONTENT_NAME;
