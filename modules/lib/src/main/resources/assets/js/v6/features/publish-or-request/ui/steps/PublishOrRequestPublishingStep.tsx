// Second step of the publish or request dialog: assignees, schedule, title and comment.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import {
    $isPublishOrRequestNextAllowed,
    type PublishOrRequestDialogStep,
} from '../../model/publishOrRequestDialog.store';
import { $publishOrRequestFieldStates } from '../../model/publishOrRequestFields.store';
import { PublishOrRequestCommentField } from '../fields/PublishOrRequestCommentField';
import { PublishOrRequestTitleField } from '../fields/PublishOrRequestTitleField';

const PUBLISH_OR_REQUEST_PUBLISHING_STEP_NAME = 'PublishOrRequestPublishingStep';

const STEP: PublishOrRequestDialogStep = 'publishing';

export const PublishOrRequestPublishingStep = (): ReactElement => {
    const isNextAllowed = useStore($isPublishOrRequestNextAllowed);
    const { title, comment } = useStore($publishOrRequestFieldStates);

    return (
        // Locked, the step cannot be moved to: "Next" and its dot disable themselves.
        <Dialog.StepContent step={STEP} locked={!isNextAllowed}>
            {/* TODO: [#11792] Add the assign and schedule fields above the title. */}
            <div className="flex flex-col gap-7.5">
                {title.visible && <PublishOrRequestTitleField />}
                {comment.visible && <PublishOrRequestCommentField />}
            </div>
        </Dialog.StepContent>
    );
};

PublishOrRequestPublishingStep.displayName = PUBLISH_OR_REQUEST_PUBLISHING_STEP_NAME;
