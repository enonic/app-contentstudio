import { Button, Checkbox, Dialog, GridList, Input, TextArea } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { CornerDownRight } from 'lucide-react';
import { useMemo, type ReactElement } from 'react';
import { IssueType } from '../../../../app/issue/IssueType';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $config } from '../../../shared/config/config.store';
import {
    $isRequestPublishReady,
    $isRequestPublishSelectionSynced,
    $requestPublishDependantsSelection,
    $requestPublishDialog,
    $requestPublishDialogCreateCount,
    $requestPublishDialogErrors,
    $requestPublishHasMoreDependants,
    $requestPublishPublishableCount,
    applyDraftRequestPublishDialogSelection,
    cancelDraftRequestPublishDialogSelection,
    excludeInProgressRequestPublishItems,
    excludeInvalidRequestPublishItems,
    loadMoreRequestPublishDependants,
    markAllAsReadyInProgressRequestPublishItems,
    removeRequestPublishItem,
    setRequestPublishAssignees,
    setRequestPublishDependantIncluded,
    setRequestPublishDescription,
    setRequestPublishItemIncludeChildren,
    setRequestPublishTitle,
    submitRequestPublishDialog,
    toggleRequestPublishDependantsSelection,
} from '../model/requestPublishDialog.store';
import { useItemsWithUnpublishedChildren } from '../../../entities/content';
import { ContentRow, SplitList } from '../../shared/lists';
import { AssigneeSelector } from '../../shared/selectors/assignee/AssigneeSelector';
import { useAssigneeSearch, useAssigneeSelection } from '../../shared/selectors/assignee/hooks/useAssigneeSearch';
import { DependantsSelectAll } from '../../../shared/ui/dialogs/dependants/DependantsSelectAll';
import { IssueIcon } from '../../../entities/issue/ui/IssueIcon';
import { SelectionStatusBar } from '../../../shared/ui/dialogs/status-bar/SelectionStatusBar';

const REQUEST_PUBLISH_DIALOG_CONTENT_NAME = 'RequestPublishDialogContent';

export const RequestPublishDialogContent = (): ReactElement => {
    const {
        title,
        description,
        assigneeIds,
        items,
        excludeChildrenIds,
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
            'excludeChildrenIds',
            'dependants',
            'excludedDependantIds',
            'requiredDependantIds',
            'loading',
            'failed',
            'submitting',
        ],
    });
    const createCount = useStore($requestPublishDialogCreateCount);
    const publishableCount = useStore($requestPublishPublishableCount);
    const hasMoreDependants = useStore($requestPublishHasMoreDependants);
    const dependantsSelection = useStore($requestPublishDependantsSelection);
    const isPublishReady = useStore($isRequestPublishReady);
    const isSelectionSynced = useStore($isRequestPublishSelectionSynced);
    const { invalid, inProgress } = useStore($requestPublishDialogErrors);
    const { allowContentUpdate } = useStore($config, { keys: ['allowContentUpdate'] });

    const dialogTitle = useI18n('action.requestPublish');
    const titleLabel = `${useI18n('field.title')} *`;
    const addCommentLabel = useI18n('field.comment.aria.label');
    const assigneesLabel = useI18n('dialog.requestPublish.assignees');
    const itemsLabel = useI18n('field.items');
    const dependenciesLabel = useI18n('dialog.dependencies');
    const createLabel = useI18n('action.createRequest');
    const applyLabel = useI18n('action.apply');
    const noResultsLabel = useI18n('dialog.search.result.noResults');
    const includeChildrenLabel = useI18n('dialog.includeChildren');
    const nothingToPublishText = useI18n('dialog.publish.noItems');
    const nothingToPublishWarning = createCount > 0 && publishableCount === 0 ? nothingToPublishText : undefined;

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

    const { options: assigneeOptions, handleSearchChange } = useAssigneeSearch();
    const selectedAssigneeOptions = useAssigneeSelection({ assigneeIds });

    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);

    const createButtonLabel = publishableCount > 1 ? `${createLabel} (${publishableCount})` : createLabel;
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
            className="sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-236 gap-7.5 px-5"
        >
            <Dialog.Header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <IssueIcon type={IssueType.PUBLISH_REQUEST} />
                    <Dialog.Title className="min-w-0 truncate text-2xl font-semibold">{dialogTitle}</Dialog.Title>
                </div>
                <Dialog.DefaultClose className="self-start justify-self-end" />
            </Dialog.Header>

            <SelectionStatusBar
                className="px-5"
                loading={loading}
                failed={failed}
                showReady={isPublishReady}
                warningText={nothingToPublishWarning}
                editing={!isSelectionSynced}
                onApply={applyDraftRequestPublishDialogSelection}
                onCancel={cancelDraftRequestPublishDialogSelection}
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
                }}
            />

            <Dialog.Body className="min-h-0 overflow-y-auto rounded-sm outline-none focus:ring-2 focus:ring-ring/10 focus:ring-inset">
                <div className="flex min-h-0 flex-col gap-7.5 px-5">
                    <Input
                        label={titleLabel}
                        value={title}
                        onInput={(event) => setRequestPublishTitle(event.currentTarget.value)}
                        disabled={submitting}
                    />

                    <TextArea
                        label={addCommentLabel}
                        value={description}
                        onInput={(event) => setRequestPublishDescription(event.currentTarget.value)}
                        rows={2}
                        autoSize
                        disabled={submitting}
                    />

                    <div className="flex flex-col gap-2.5">
                        <span className="text-md font-semibold">{assigneesLabel}</span>
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

                    <SplitList>
                        <div className="flex flex-col gap-2.5">
                            <span className="text-md font-semibold">{itemsLabel}</span>
                            <SplitList.Primary
                                items={items}
                                getItemId={(item) => item.getId()}
                                disabled={isItemsDisabled}
                                renderRow={(item) => {
                                    const id = item.getContentId();
                                    const includeChildren = !excludeChildrenSet.has(id.toString());
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
                                                <ContentRow.Label action="edit" variant="detailed" />
                                                <ContentRow.Status />
                                                <ContentRow.RemoveButton
                                                    onRemove={() => removeRequestPublishItem(item.getContentId())}
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
                                                        <CornerDownRight className="size-4 shrink-0" />
                                                        <GridList.Action>
                                                            <Checkbox
                                                                className="font-semibold"
                                                                checked={includeChildren}
                                                                onCheckedChange={(enabled) =>
                                                                    setRequestPublishItemIncludeChildren(
                                                                        id,
                                                                        enabled === true,
                                                                    )
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
                        </div>
                        <SplitList.Separator hidden={dependants.length === 0}>
                            <SplitList.SeparatorLabel>{dependenciesLabel}</SplitList.SeparatorLabel>
                        </SplitList.Separator>

                        {dependants.length > 0 && (
                            <div>
                                {dependantsSelection.count > 0 && (
                                    <DependantsSelectAll
                                        selection={dependantsSelection}
                                        onToggle={toggleRequestPublishDependantsSelection}
                                        disabled={isItemsDisabled}
                                    />
                                )}

                                <SplitList.Secondary
                                    items={dependants}
                                    getItemId={(item) => item.getId()}
                                    disabled={isItemsDisabled}
                                    loading={loading}
                                    hasMore={hasMoreDependants}
                                    onEndReached={loadMoreRequestPublishDependants}
                                    renderRow={(item) => {
                                        const id = item.getContentId();
                                        const isRequired = requiredDependantSet.has(id.toString());
                                        const included = !excludedDependantSet.has(id.toString());

                                        return (
                                            <ContentRow
                                                key={item.getId()}
                                                content={item}
                                                id={item.getId()}
                                                disabled={isItemsDisabled}
                                            >
                                                <ContentRow.Checkbox
                                                    checked={included}
                                                    onCheckedChange={(checked) =>
                                                        setRequestPublishDependantIncluded(id, checked)
                                                    }
                                                    disabled={isRequired || isItemsDisabled}
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
            </Dialog.Body>
            <Dialog.Footer className="px-5">
                <Button
                    variant="solid"
                    size="lg"
                    label={createButtonLabel}
                    disabled={isCreateDisabled}
                    onClick={handleCreate}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

RequestPublishDialogContent.displayName = REQUEST_PUBLISH_DIALOG_CONTENT_NAME;
