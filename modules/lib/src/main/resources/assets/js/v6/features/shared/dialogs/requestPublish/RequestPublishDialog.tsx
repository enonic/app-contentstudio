import {Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import type {ReactElement} from 'react';
import {
    $requestPublishDialog,
    resetRequestPublishDialogContext,
} from '../../../store/dialogs/requestPublishDialog.store';
import {RequestPublishDialogContent} from './RequestPublishDialogContent';

const REQUEST_PUBLISH_DIALOG_NAME = 'RequestPublishDialog';

export const RequestPublishDialog = (): ReactElement => {
    const {open} = useStore($requestPublishDialog, {keys: ['open']});

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetRequestPublishDialogContext();
        }
    };

    return (
        <Dialog.Root data-component={REQUEST_PUBLISH_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <RequestPublishDialogContent />
            </Dialog.Portal>
        </Dialog.Root>
    );
};

RequestPublishDialog.displayName = REQUEST_PUBLISH_DIALOG_NAME;
