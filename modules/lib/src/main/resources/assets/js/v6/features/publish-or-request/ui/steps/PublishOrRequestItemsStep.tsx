// First step of the publish or request dialog: the items to publish, their dependencies
// and their checks.

import { Checkbox, Dialog, GridList } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { CornerDownRight, LoaderCircle } from 'lucide-react';
import { Fragment, type ReactElement } from 'react';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { useItemsWithUnpublishedChildren } from '../../../../entities/content';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { DependantsSelectAll } from '../../../../shared/ui/dialogs/dependants/DependantsSelectAll';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { ContentRow, DependantsSeparator, SplitList } from '../../../shared/lists';
import { removePublishOrRequestItem, setPublishOrRequestItemChildrenIncluded } from '../../model/commands/items';
import { loadMorePublishOrRequestDependants } from '../../model/commands/load';
import {
    setPublishOrRequestDependantIncluded,
    togglePublishOrRequestDependantsSelection,
    togglePublishOrRequestShowExcluded,
} from '../../model/commands/selection';
import {
    $hasMorePublishOrRequestDependants,
    $hasPublishOrRequestExcludedDependants,
    $isPublishOrRequestSelectionSynced,
    $publishOrRequestDependantsSelection,
    $publishOrRequestDialog,
    $publishOrRequestShownDependants,
    type PublishOrRequestDialogStep,
} from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestWarnings } from '../warnings/PublishOrRequestWarnings';

const PUBLISH_OR_REQUEST_ITEMS_STEP_NAME = 'PublishOrRequestItemsStep';

const STEP: PublishOrRequestDialogStep = 'items';

export const PublishOrRequestItemsStep = (): ReactElement => {
    const {
        items,
        excludeChildrenIds,
        dependantIds,
        loading,
        excludedDependantIds,
        requiredDependantIds,
        showExcluded,
    } = useStore($publishOrRequestDialog, {
        keys: [
            'items',
            'excludeChildrenIds',
            'dependantIds',
            'loading',
            'excludedDependantIds',
            'requiredDependantIds',
            'showExcluded',
        ],
    });
    const itemsWithUnpublishedChildren = useItemsWithUnpublishedChildren(items);
    const shownDependants = useStore($publishOrRequestShownDependants);
    const hasMoreDependants = useStore($hasMorePublishOrRequestDependants);
    const hasExcludedDependants = useStore($hasPublishOrRequestExcludedDependants);
    const dependantsSelection = useStore($publishOrRequestDependantsSelection);
    const isSelectionSynced = useStore($isPublishOrRequestSelectionSynced);

    const dependenciesLabel = useI18n('dialog.dependencies');
    const allExcludedMessage = useI18n('dialog.dependencies.allExcluded');

    const hasDependencies = dependantIds.length > 0;

    return (
        <Dialog.StepContent step={STEP}>
            <div className="sticky -top-2 z-1 -mx-2 -mt-2 px-2 pt-2 pb-5 bg-surface-neutral empty:hidden">
                {loading ? <LoadingEntry /> : <PublishOrRequestWarnings />}
            </div>

            <SplitList>
                <SplitList.Primary
                    items={items}
                    getItemId={(item) => item.getId()}
                    disabled={loading}
                    renderRow={(item) => (
                        <Fragment key={item.getId()}>
                            <ContentRow
                                content={item}
                                id={item.getId()}
                                disabled={loading}
                                layout="mobile-status-below"
                            >
                                <ContentRow.Label action="edit" variant="detailed" />
                                <ContentRow.Status />
                                <ContentRow.RemoveButton
                                    onRemove={() => removePublishOrRequestItem(item.getContentId())}
                                    disabled={loading || items.length === 1}
                                />
                            </ContentRow>

                            {/* Offered until the lookup says every child is published already. */}
                            {item.hasChildren() && (itemsWithUnpublishedChildren?.has(item.getId()) ?? true) && (
                                <IncludeChildrenRow
                                    item={item}
                                    included={!hasContentIdInIds(item.getContentId(), excludeChildrenIds)}
                                    disabled={loading}
                                />
                            )}
                        </Fragment>
                    )}
                />

                {/* The toggle is offered once the exclusions are applied; a staged one is never hidden. */}
                <DependantsSeparator
                    label={dependenciesLabel}
                    hasExcluded={hasExcludedDependants && isSelectionSynced}
                    showExcluded={showExcluded}
                    onToggleExcluded={togglePublishOrRequestShowExcluded}
                    hidden={!hasDependencies}
                    disabled={loading}
                />

                {hasDependencies && (
                    <div>
                        {dependantsSelection.count > 0 && (
                            <DependantsSelectAll
                                selection={dependantsSelection}
                                onToggle={togglePublishOrRequestDependantsSelection}
                                disabled={loading}
                            />
                        )}

                        <SplitList.Secondary
                            items={shownDependants}
                            getItemId={(item) => item.getId()}
                            emptyMessage={allExcludedMessage}
                            disabled={loading}
                            loading={loading}
                            hasMore={hasMoreDependants}
                            onEndReached={loadMorePublishOrRequestDependants}
                            renderRow={(item) => (
                                <ContentRow
                                    key={item.getId()}
                                    content={item}
                                    id={item.getId()}
                                    disabled={loading}
                                    layout="mobile-selectable-status-below"
                                >
                                    <ContentRow.Checkbox
                                        checked={!hasContentIdInIds(item.getContentId(), excludedDependantIds)}
                                        onCheckedChange={(checked) =>
                                            setPublishOrRequestDependantIncluded(item.getContentId(), checked)
                                        }
                                        disabled={
                                            loading || hasContentIdInIds(item.getContentId(), requiredDependantIds)
                                        }
                                    />
                                    <ContentRow.Label action="edit" />
                                    <ContentRow.Status />
                                </ContentRow>
                            )}
                        />
                    </div>
                )}
            </SplitList>
        </Dialog.StepContent>
    );
};

PublishOrRequestItemsStep.displayName = PUBLISH_OR_REQUEST_ITEMS_STEP_NAME;

// *
// * Internal
// *

type IncludeChildrenRowProps = {
    item: ContentSummary;
    included: boolean;
    disabled: boolean;
};

// Row under a main item: whether its children come along as dependencies.
function IncludeChildrenRow({ item, included, disabled }: IncludeChildrenRowProps): ReactElement {
    const label = useI18n('dialog.includeChildren');

    return (
        <GridList.Row id={`${item.getId()}-children`} disabled={disabled} className="gap-3 px-2.5 -mt-1">
            <GridList.Cell className="flex items-center gap-2.5 ps-2.5">
                <CornerDownRight className="size-4 shrink-0" />
                <GridList.Action>
                    <Checkbox
                        className="font-semibold"
                        checked={included}
                        onCheckedChange={(checked) =>
                            setPublishOrRequestItemChildrenIncluded(item.getContentId(), checked === true)
                        }
                        disabled={disabled}
                        label={label}
                    />
                </GridList.Action>
            </GridList.Cell>
        </GridList.Row>
    );
}

// Shown in place of the warnings while the dependencies are resolved.
function LoadingEntry(): ReactElement {
    const label = useI18n('dialog.statusBar.loading');

    return (
        <StatusBarEntry>
            <LoaderCircle className="size-7 animate-spin text-subtle" />
            <span className="text-sm font-semibold">{label}</span>
        </StatusBarEntry>
    );
}
