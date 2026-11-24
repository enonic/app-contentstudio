// First step of the publish or request dialog: the items to publish and their checks.

import { Dialog } from '@enonic/ui';
import { type ReactElement } from 'react';
import { type PublishOrRequestDialogStep } from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_ITEMS_STEP_NAME = 'PublishOrRequestItemsStep';

const STEP: PublishOrRequestDialogStep = 'items';

export const PublishOrRequestItemsStep = (): ReactElement => {
    return (
        <Dialog.StepContent step={STEP}>
            {/* TODO: [#11792] Replace the placeholder with the checks and the items list. */}
            <p className="py-20 text-center text-subtle">Step 1</p>
        </Dialog.StepContent>
    );
};

PublishOrRequestItemsStep.displayName = PUBLISH_OR_REQUEST_ITEMS_STEP_NAME;
