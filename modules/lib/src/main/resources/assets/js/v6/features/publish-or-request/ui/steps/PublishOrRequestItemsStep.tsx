// First step of the publish or request dialog: the items to publish, their dependencies
// and their checks.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { LoaderCircle } from 'lucide-react';
import { type ReactElement } from 'react';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { DependantsSelectAll } from '../../../../shared/ui/dialogs/dependants/DependantsSelectAll';
import { StatusBarEntry } from '../../../../shared/ui/dialogs/status-bar/StatusBarEntry';
import { ContentRow, SplitList } from '../../../shared/lists';
import { loadMorePublishOrRequestDependants } from '../../model/commands/load';
import {
    setPublishOrRequestDependantIncluded,
    togglePublishOrRequestDependantsSelection,
} from '../../model/commands/selection';
import {
    $hasMorePublishOrRequestDependants,
    $publishOrRequestDependantsSelection,
    $publishOrRequestDialog,
    type PublishOrRequestDialogStep,
} from '../../model/publishOrRequestDialog.store';
import { PublishOrRequestWarnings } from '../warnings/PublishOrRequestWarnings';

const PUBLISH_OR_REQUEST_ITEMS_STEP_NAME = 'PublishOrRequestItemsStep';

const STEP: PublishOrRequestDialogStep = 'items';

export const PublishOrRequestItemsStep = (): ReactElement => {
    const { items, dependants, loading, excludedDependantIds, requiredDependantIds } = useStore(
        $publishOrRequestDialog,
        { keys: ['items', 'dependants', 'loading', 'excludedDependantIds', 'requiredDependantIds'] },
    );
    const hasMoreDependants = useStore($hasMorePublishOrRequestDependants);
    const dependantsSelection = useStore($publishOrRequestDependantsSelection);

    const dependenciesLabel = useI18n('dialog.dependencies');

    return (
        <Dialog.StepContent step={STEP}>
            <div className="sticky -top-2 z-1 -mx-2 -mt-2 px-2 pt-2 pb-5 bg-surface-neutral empty:hidden">
                {loading ? <LoadingEntry /> : <PublishOrRequestWarnings />}
            </div>

            <SplitList>
                <SplitList.Primary
                    items={items}
                    getItemId={(item) => item.getId()}
                    renderRow={(item) => (
                        <ContentRow key={item.getId()} content={item} id={item.getId()} layout="mobile-status-below">
                            <ContentRow.Label action="edit" variant="detailed" />
                            <ContentRow.Status />
                        </ContentRow>
                    )}
                />

                <SplitList.Separator hidden={dependants.length === 0}>
                    <SplitList.SeparatorLabel>{dependenciesLabel}</SplitList.SeparatorLabel>
                </SplitList.Separator>

                {dependantsSelection.count > 0 && (
                    <div>
                        <DependantsSelectAll
                            selection={dependantsSelection}
                            onToggle={togglePublishOrRequestDependantsSelection}
                            disabled={loading}
                        />

                        <SplitList.Secondary
                            items={dependants}
                            getItemId={(item) => item.getId()}
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
