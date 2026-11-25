// Footer of the publish or request dialog: the navigation between the steps and,
// on the first step, the button that publishes right away. Laid out for desktop only.

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

                {/* ? Disables itself while the next step is locked, and on the last step. */}
                <Stepper.Next asChild>
                    <Button size="lg" variant="solid" label={nextLabel} />
                </Stepper.Next>
            </div>
        </div>
    );
};

PublishOrRequestDialogFooter.displayName = PUBLISH_OR_REQUEST_DIALOG_FOOTER_NAME;

// *
// * Internal
// *

// TODO: [#11792] Publish right away, with the saving phase.
function handlePublishNow(): void {}
