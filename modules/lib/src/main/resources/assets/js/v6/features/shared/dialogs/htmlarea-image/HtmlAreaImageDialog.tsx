import {Button, Dialog} from '@enonic/ui';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    HtmlAreaImageDialogProvider,
    type OpenHtmlAreaImageDialogParams,
    useHtmlAreaImageDialogContext,
} from './HtmlAreaImageDialogContext';
import {HtmlAreaImageDialogContent} from './HtmlAreaImageDialogContent';

const DIALOG_NAME = 'HtmlAreaImageDialog';

const HtmlAreaImageDialogInner = (): ReactElement => {
    const {state: {open}, isEditing, canSubmit, close, submit} = useHtmlAreaImageDialogContext();

    const title = useI18n('dialog.image.title');
    const insertLabel = useI18n('action.insert');
    const updateLabel = useI18n('action.update');
    const cancelLabel = useI18n('action.cancel');

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    close();
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className='w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-220 md:max-h-[85vh]'
                    data-component={DIALOG_NAME}
                >
                    <Dialog.DefaultHeader title={title} withClose />
                    <Dialog.Body className='flex flex-col gap-5 p-1.5'>
                        <HtmlAreaImageDialogContent />
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button
                            size='lg'
                            variant='solid'
                            label={isEditing ? updateLabel : insertLabel}
                            disabled={!canSubmit}
                            onClick={submit}
                        />
                        <Button
                            size='lg'
                            variant='outline'
                            label={cancelLabel}
                            onClick={close}
                        />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

type HtmlAreaImageDialogProps = {
    openRef: { current: ((params: OpenHtmlAreaImageDialogParams) => void) | undefined };
};

export const HtmlAreaImageDialog = ({openRef}: HtmlAreaImageDialogProps): ReactElement => {
    return (
        <HtmlAreaImageDialogProvider openRef={openRef}>
            <HtmlAreaImageDialogInner />
        </HtmlAreaImageDialogProvider>
    );
};

HtmlAreaImageDialog.displayName = DIALOG_NAME;
