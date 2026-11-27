// The publish or request dialog: one dialog with steps that either publishes
// the listed items or creates a publish request for them. See #11792.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { closePublishOrRequestDialog } from '../model/commands/open';
import { setPublishOrRequestDialogStep } from '../model/commands/steps';
import { $publishOrRequestDialog } from '../model/publishOrRequestDialog.store';
import { PublishOrRequestDialogFooter } from './PublishOrRequestDialogFooter';
import { PublishOrRequestDialogHeader } from './PublishOrRequestDialogHeader';
import { PublishOrRequestProgressContent } from './PublishOrRequestProgressContent';
import { PublishOrRequestItemsStep } from './steps/PublishOrRequestItemsStep';
import { PublishOrRequestPublishingStep } from './steps/PublishOrRequestPublishingStep';

const PUBLISH_OR_REQUEST_DIALOG_NAME = 'PublishOrRequestDialog';

const CONTENT_CLASS_NAME =
    'w-full h-full max-sm:max-h-none sm:h-fit gap-10 md:min-w-180 md:max-w-184 md:max-h-[90vh] lg:max-w-220';

export const PublishOrRequestDialog = (): ReactElement => {
    const { open, step, submitting } = useStore($publishOrRequestDialog, { keys: ['open', 'step', 'submitting'] });

    // What is being submitted cannot be called back, so the dialog stays until it ends.
    const handleOpenChange = (next: boolean) => {
        if (!next && submitting == null) closePublishOrRequestDialog();
    };

    return (
        <Dialog.Root
            data-component={PUBLISH_OR_REQUEST_DIALOG_NAME}
            open={open}
            onOpenChange={handleOpenChange}
            step={step}
            onStepChange={setPublishOrRequestDialogStep}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                {submitting === 'publish' ? (
                    <PublishOrRequestProgressContent />
                ) : (
                    <Dialog.Content className={CONTENT_CLASS_NAME}>
                        <PublishOrRequestDialogHeader />

                        {/* ? The body clips what overflows it; the padding leaves room for focus rings. */}
                        <Dialog.Body className="p-2 -m-2">
                            <PublishOrRequestItemsStep />
                            <PublishOrRequestPublishingStep />
                        </Dialog.Body>

                        <Dialog.Footer className="flex flex-col">
                            <PublishOrRequestDialogFooter />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PublishOrRequestDialog.displayName = PUBLISH_OR_REQUEST_DIALOG_NAME;
