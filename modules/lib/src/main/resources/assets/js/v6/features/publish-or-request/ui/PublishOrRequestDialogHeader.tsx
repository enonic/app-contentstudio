// Header shared by every step of the publish or request dialog:
// the publish icon and label, the title of the current step and the close button.

import { Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Send } from 'lucide-react';
import { type ReactElement } from 'react';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { $publishOrRequestDialog, type PublishOrRequestDialogStep } from '../model/publishOrRequestDialog.store';

const PUBLISH_OR_REQUEST_DIALOG_HEADER_NAME = 'PublishOrRequestDialogHeader';

const STEP_TITLE_KEYS: Record<PublishOrRequestDialogStep, string> = {
    items: 'dialog.publishOrRequest.step.items',
    publishing: 'dialog.publishOrRequest.step.publishing',
};

export const PublishOrRequestDialogHeader = (): ReactElement => {
    const { step } = useStore($publishOrRequestDialog, { keys: ['step'] });

    const label = useI18n('action.publish');
    const title = useI18n(STEP_TITLE_KEYS[step]);

    return (
        <Dialog.Header
            data-component={PUBLISH_OR_REQUEST_DIALOG_HEADER_NAME}
            className="grid-cols-[minmax(0,1fr)_auto]"
        >
            <p className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 font-semibold">
                <Send className="size-4.5 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
            </p>
            <Dialog.Title className="col-start-1 row-start-2 min-w-0">{title}</Dialog.Title>
            <Dialog.DefaultClose className="col-start-2 row-span-2 row-start-1 self-start justify-self-end" />
        </Dialog.Header>
    );
};

PublishOrRequestDialogHeader.displayName = PUBLISH_OR_REQUEST_DIALOG_HEADER_NAME;
