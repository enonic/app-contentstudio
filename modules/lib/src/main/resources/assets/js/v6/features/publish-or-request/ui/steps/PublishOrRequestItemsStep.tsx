// First step of the publish or request dialog: the items to publish, their dependencies
// and their checks.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { ContentRow, SplitList } from '../../../shared/lists';
import { loadMorePublishOrRequestDependants } from '../../model/commands/load';
import { setPublishOrRequestDependantIncluded } from '../../model/commands/selection';
import {
    $hasMorePublishOrRequestDependants,
    $publishOrRequestDialog,
    type PublishOrRequestDialogStep,
} from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_ITEMS_STEP_NAME = 'PublishOrRequestItemsStep';

const STEP: PublishOrRequestDialogStep = 'items';

export const PublishOrRequestItemsStep = (): ReactElement => {
    const { items, dependants, loading, excludedDependantIds, requiredDependantIds } = useStore(
        $publishOrRequestDialog,
        { keys: ['items', 'dependants', 'loading', 'excludedDependantIds', 'requiredDependantIds'] },
    );
    const hasMoreDependants = useStore($hasMorePublishOrRequestDependants);

    const dependenciesLabel = useI18n('dialog.dependencies');

    return (
        <Dialog.StepContent step={STEP}>
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

                <SplitList.Secondary
                    items={dependants}
                    getItemId={(item) => item.getId()}
                    loading={loading}
                    hasMore={hasMoreDependants}
                    onEndReached={loadMorePublishOrRequestDependants}
                    renderRow={(item) => (
                        <ContentRow
                            key={item.getId()}
                            content={item}
                            id={item.getId()}
                            layout="mobile-selectable-status-below"
                        >
                            <ContentRow.Checkbox
                                checked={!hasContentIdInIds(item.getContentId(), excludedDependantIds)}
                                onCheckedChange={(checked) =>
                                    setPublishOrRequestDependantIncluded(item.getContentId(), checked)
                                }
                                disabled={hasContentIdInIds(item.getContentId(), requiredDependantIds)}
                            />
                            <ContentRow.Label action="edit" />
                            <ContentRow.Status />
                        </ContentRow>
                    )}
                />
            </SplitList>
        </Dialog.StepContent>
    );
};

PublishOrRequestItemsStep.displayName = PUBLISH_OR_REQUEST_ITEMS_STEP_NAME;
