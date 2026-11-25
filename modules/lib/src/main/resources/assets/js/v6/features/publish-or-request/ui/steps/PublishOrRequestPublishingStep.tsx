// Second step of the publish or request dialog: assignees, schedule and comment.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import {
    $isPublishOrRequestNextAllowed,
    type PublishOrRequestDialogStep,
} from '../../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_PUBLISHING_STEP_NAME = 'PublishOrRequestPublishingStep';

const STEP: PublishOrRequestDialogStep = 'publishing';

export const PublishOrRequestPublishingStep = (): ReactElement => {
    const isNextAllowed = useStore($isPublishOrRequestNextAllowed);

    return (
        // Locked, the step cannot be moved to: "Next" and its dot disable themselves.
        <Dialog.StepContent step={STEP} locked={!isNextAllowed}>
            {/* TODO: [#11792] Replace the placeholder with the assign, schedule and comment fields. */}
            <p className="py-20 text-center text-subtle">Step 2</p>
        </Dialog.StepContent>
    );
};

PublishOrRequestPublishingStep.displayName = PUBLISH_OR_REQUEST_PUBLISHING_STEP_NAME;
