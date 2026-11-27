// Footer of the publish or request dialog: the navigation between the steps, the button that
// publishes right away on the first step, and the button that submits on the last one.
// Laid out for desktop only.

import { Button, cn, Stepper } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import {
    $isPublishOrRequestPublishNowAllowed,
    $publishOrRequestCapability,
    $publishOrRequestDialog,
    $publishOrRequestPublishableCount,
} from '../model/publishOrRequestDialog.store';
import {
    $isPublishOrRequestSubmitAllowed,
    $publishOrRequestAction,
    type PublishOrRequestAction,
} from '../model/publishOrRequestFields.store';

const PUBLISH_OR_REQUEST_DIALOG_FOOTER_NAME = 'PublishOrRequestDialogFooter';

export const PublishOrRequestDialogFooter = (): ReactElement => {
    const { step } = useStore($publishOrRequestDialog, { keys: ['step'] });
    const capability = useStore($publishOrRequestCapability);
    const publishableCount = useStore($publishOrRequestPublishableCount);
    const isPublishNowAllowed = useStore($isPublishOrRequestPublishNowAllowed);

    const previousLabel = useI18n('action.previous');
    const nextLabel = useI18n('action.next');
    const publishNowSingleLabel = useI18n('action.publishNow');
    const publishNowCountLabel = useI18n('action.publishNowCount', publishableCount);

    const isFirstStep = step === 'items';
    const canPublish = capability === 'publish' || capability === 'publish-request';
    const publishNowLabel = publishableCount > 1 ? publishNowCountLabel : publishNowSingleLabel;

    return (
        <div
            data-component={PUBLISH_OR_REQUEST_DIALOG_FOOTER_NAME}
            className="grid w-full grid-cols-[1fr_auto_1fr] items-center"
        >
            {/* ? Kept in the layout on the first step, so the dots stay centred. */}
            <Stepper.Previous asChild>
                <Button
                    size="lg"
                    variant="outline"
                    className={cn('justify-self-start', isFirstStep && 'invisible')}
                    label={previousLabel}
                />
            </Stepper.Previous>

            <Stepper.Dots />

            <div className="flex items-center gap-2.5 justify-self-end">
                {isFirstStep && canPublish && (
                    <Button
                        size="lg"
                        variant="outline"
                        disabled={!isPublishNowAllowed}
                        onClick={handlePublishNow}
                        label={publishNowLabel}
                    />
                )}

                {isFirstStep ? (
                    // ? Disables itself while the next step is locked.
                    <Stepper.Next asChild>
                        <Button size="lg" variant="solid" label={nextLabel} />
                    </Stepper.Next>
                ) : (
                    <SubmitButton />
                )}
            </div>
        </div>
    );
};

PublishOrRequestDialogFooter.displayName = PUBLISH_OR_REQUEST_DIALOG_FOOTER_NAME;

// *
// * Internal
// *

// The button of the last step: named after what the dialog does, with the count when above one.
function SubmitButton(): ReactElement {
    const action = useStore($publishOrRequestAction);
    const publishableCount = useStore($publishOrRequestPublishableCount);
    const isSubmitAllowed = useStore($isPublishOrRequestSubmitAllowed);

    const publishLabel = useI18n('action.publishNow');
    const publishCountLabel = useI18n('action.publishNowCount', publishableCount);
    const scheduleLabel = useI18n('dialog.publishOrRequest.action.schedule');
    const scheduleCountLabel = useI18n('dialog.publishOrRequest.action.scheduleCount', publishableCount);
    const requestLabel = useI18n('action.requestPublish');
    const requestCountLabel = useI18n('dialog.publishOrRequest.action.requestCount', publishableCount);

    const labels: Record<PublishOrRequestAction, string> =
        publishableCount > 1
            ? { publish: publishCountLabel, schedule: scheduleCountLabel, request: requestCountLabel }
            : { publish: publishLabel, schedule: scheduleLabel, request: requestLabel };

    return (
        <Button size="lg" variant="solid" disabled={!isSubmitAllowed} onClick={handleSubmit} label={labels[action]} />
    );
}

// TODO: [#11792] Publish right away, with the saving phase.
function handlePublishNow(): void {}

// TODO: [#11792] Publish, schedule or request, with the saving phase.
function handleSubmit(): void {}
