import {Button, Dialog, GridList, Input, Checkbox, TextArea} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {CornerDownRight} from 'lucide-react';
import {useCallback, useMemo, type ReactElement} from 'react';

import {ContentId} from '../../../../../app/content/ContentId';
import {IssueType} from '../../../../../app/issue/IssueType';
import {useI18n} from '../../../hooks/useI18n';
import {useItemsWithUnpublishedChildren} from '../../../utils/cms/content/useItemsWithUnpublishedChildren';
import {ContentRow, SplitList} from '../../lists';
import {useAssigneeSearch, useAssigneeSelection} from '../../selectors/assignee/hooks/useAssigneeSearch';
import {AssigneeSelector} from '../../selectors/assignee/AssigneeSelector';
import {ContentCombobox} from '../../selectors/content';
import {
    $newIssueDialog,
    $newIssueDialogCreateCount,
    addNewIssueItemsByIds,
    removeNewIssueItemsByIds,
    setNewIssueAssignees,
    setNewIssueDescription,
    setNewIssueDependantIncluded,
    setNewIssueItemIncludeChildren,
    setNewIssueTitle,
    submitNewIssueDialog,
} from '../../../store/dialogs/newIssueDialog.store';
import {IssueIcon} from '../issue/IssueIcon';
import {useIssuePublishTargetIds} from '../issue/hooks/useIssuePublishTargetIds';

const NEW_ISSUE_DIALOG_CONTENT_NAME = 'NewIssueDialogContent';

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
    const includeChildrenLabel = useI18n('field.content.includeChildren');

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

    const publishTargetIds = useIssuePublishTargetIds(items, dependants, excludedDependantIds);

    const {options: assigneeOptions, handleSearchChange} = useAssigneeSearch({
        publishableContentIds: publishTargetIds,
        useRootFallback: true,
    });
    const selectedAssigneeOptions = useAssigneeSelection({assigneeIds});

    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);

    const isItemsDisabled = submitting || loading;

    const createButtonLabel = createCount > 1
                              ? `${createLabel} (${createCount})`
                              : createLabel;
    const isCreateDisabled = submitting || loading || title.trim().length === 0;

    const selectedIds = useMemo(
        () => items.map(item => item.getContentId().toString()),
        [items],
    );

    const handleSelectionChange = useCallback((nextSelection: readonly string[]) => {
        const prevSet = new Set(selectedIds);
        const nextSet = new Set(nextSelection);

        const addedIds = nextSelection.filter(id => !prevSet.has(id));
        const removedIds = selectedIds.filter(id => !nextSet.has(id));

        if (addedIds.length > 0) {
            void addNewIssueItemsByIds([...addedIds]);
        }
        if (removedIds.length > 0) {
            removeNewIssueItemsByIds(removedIds.map(id => new ContentId(id)));
        }
    }, [selectedIds]);

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
            <Dialog.Body className='min-h-0 overflow-y-auto rounded-sm outline-none focus:ring-2 focus:ring-ring/10 focus:ring-inset'>
                <div className='flex min-h-0 flex-col gap-7.5 px-5'>
                    <Input
                        label={titleLabel}
                        value={title}
                        onChange={(event) => setNewIssueTitle(event.currentTarget.value)}
                        disabled={submitting}
                    />

                    <TextArea
                        label={descriptionLabel}
                        value={description}
                        onInput={(event) => setNewIssueDescription(event.currentTarget.value)}
                        rows={2}
                        autoSize
                        disabled={submitting}
                    />
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

                    <div className='flex flex-col gap-2'>

                        <ContentCombobox
                            label={itemsLabel}
                            selection={selectedIds}
                            onSelectionChange={handleSelectionChange}
                            disabled={submitting}
                        />
                        <SplitList>
                            <SplitList.Primary
                                items={items}
                                getItemId={(item) => item.getId()}
                                disabled={isItemsDisabled}
                                renderRow={(item) => {
                                    const id = item.getContentId();
                                    const includeChildren = !excludedChildrenSet.has(id.toString());
                                    const hasUnpublishedChildrenForItem = itemsWithUnpublishedChildren
                                                                          ? itemsWithUnpublishedChildren.has(id.toString())
                                                                          : true;
                                    const showChildrenCheckbox = hasUnpublishedChildrenForItem && item.hasChildren();

                                    return (
                                        <>
                                            <ContentRow
                                                key={item.getId()}
                                                content={item}
                                                id={`main-${item.getId()}`}
                                                disabled={isItemsDisabled}
                                            >
                                                <ContentRow.Label action="edit"/>
                                                <ContentRow.Status variant="simple"/>
                                                <ContentRow.RemoveButton
                                                    onRemove={() => removeNewIssueItemsByIds([item.getContentId()])}
                                                    disabled={isItemsDisabled || items.length === 1}
                                                />
                                            </ContentRow>


                                            {showChildrenCheckbox && (
                                                <GridList.Row
                                                    id={`${item.getId()}-children`}
                                                    disabled={isItemsDisabled}
                                                    className="gap-3 px-2.5 -mt-1"
                                                >
                                                    <GridList.Cell className="pl-2.5 flex items-center gap-2.5">
                                                        <CornerDownRight className="size-4 shrink-0"/>
                                                        <GridList.Action>
                                                            <Checkbox
                                                                className="font-semibold"
                                                                checked={includeChildren}
                                                                onCheckedChange={(enabled) =>
                                                                    setNewIssueItemIncludeChildren(id, enabled === true)
                                                                }
                                                                disabled={isItemsDisabled}
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

                            <SplitList.Secondary
                                items={dependants}
                                getItemId={(item) => item.getId()}
                                disabled={isItemsDisabled}
                                renderRow={(item) => {
                                    const id = item.getContentId();
                                    const isRequired = requiredDependantSet.has(id.toString());
                                    const included = !excludedDependantSet.has(id.toString());

                                    return (
                                        <ContentRow
                                            key={item.getId()}
                                            content={item}
                                            id={item.getId()}
                                            disabled={isRequired || isItemsDisabled}
                                        >
                                            <ContentRow.Checkbox
                                                checked={included}
                                                onCheckedChange={(checked) =>
                                                    setNewIssueDependantIncluded(id, checked)
                                                }
                                            />
                                            <ContentRow.Label action="edit"/>
                                            <ContentRow.Status variant="simple"/>
                                        </ContentRow>
                                    );
                                }}
                            />
                        </SplitList>
                    </div>

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
