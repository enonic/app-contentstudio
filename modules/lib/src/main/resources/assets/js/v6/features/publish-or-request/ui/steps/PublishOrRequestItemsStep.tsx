// First step of the publish or request dialog: the items to publish and their checks.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { ContentRow, SplitList } from '../../../shared/lists';
import { $publishOrRequestDialog, type PublishOrRequestDialogStep } from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_ITEMS_STEP_NAME = 'PublishOrRequestItemsStep';

const STEP: PublishOrRequestDialogStep = 'items';

export const PublishOrRequestItemsStep = (): ReactElement => {
    const { items } = useStore($publishOrRequestDialog, { keys: ['items'] });

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
            </SplitList>
        </Dialog.StepContent>
    );
};

PublishOrRequestItemsStep.displayName = PUBLISH_OR_REQUEST_ITEMS_STEP_NAME;
