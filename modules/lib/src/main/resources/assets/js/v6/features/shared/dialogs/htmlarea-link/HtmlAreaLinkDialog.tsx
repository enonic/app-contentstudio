import {Button, Dialog, IdProvider} from '@enonic/ui';
import {type ReactElement} from 'react';
import {type CreateHtmlAreaContentDialogEvent} from '../../../../../app/inputtype/ui/text/CreateHtmlAreaContentDialogEvent';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type {DialogOverrides} from '../../form/input-types/html-area/setupEditor';
import {useI18n} from '../../../hooks/useI18n';
import {
    HtmlAreaLinkDialogProvider,
    type OpenHtmlAreaLinkDialogParams,
    useHtmlAreaLinkDialogContext,
} from './HtmlAreaLinkDialogContext';
import {HtmlAreaLinkDialogContent} from './HtmlAreaLinkDialogContent';

const DIALOG_NAME = 'HtmlAreaLinkDialog';

const INNER_NAME = `${DIALOG_NAME}Inner`;

const HtmlAreaLinkDialogInner = (): ReactElement => {
    const {state: {open, isEditing}, canSubmit, close, submit} = useHtmlAreaLinkDialogContext();

    const title = useI18n('dialog.link.title');
    const insertLabel = useI18n('action.insert');
    const updateLabel = useI18n('action.update');
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
                {/* Reset IdProvider to avoid inheriting the prefix from LegacyElement
                    (ContentWizardTabsToolbarElement) which causes ID collisions in portaled content.
                    Remove when ContentWizardTabsToolbar no longer uses LegacyElement. */}
                <IdProvider prefix={DIALOG_NAME}>
                    <Dialog.Overlay />
                    <Dialog.Content
                        className='w-full h-full gap-10 sm:h-fit md:min-w-160 md:max-w-200 md:max-h-[85vh]'
                        data-component={DIALOG_NAME}
                    >
                        <Dialog.DefaultHeader title={title} withClose />
                        <Dialog.Body className='flex flex-col gap-5 p-1.5'>
                            <HtmlAreaLinkDialogContent />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button
                                size='lg'
                                variant='solid'
                                label={isEditing ? updateLabel : insertLabel}
                                disabled={!canSubmit}
                                onClick={submit}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                </IdProvider>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

HtmlAreaLinkDialogInner.displayName = INNER_NAME;

type HtmlAreaLinkDialogProps = {
    openRef: { current: ((params: OpenHtmlAreaLinkDialogParams) => void) | undefined };
};

export const HtmlAreaLinkDialog = ({openRef}: HtmlAreaLinkDialogProps): ReactElement => {
    return (
        <HtmlAreaLinkDialogProvider openRef={openRef}>
            <HtmlAreaLinkDialogInner />
        </HtmlAreaLinkDialogProvider>
    );
};

HtmlAreaLinkDialog.displayName = DIALOG_NAME;

export function createLinkDialogOverride(
    openRef: { current: ((params: OpenHtmlAreaLinkDialogParams) => void) | undefined },
): DialogOverrides {
    return {
        [HtmlAreaDialogType.LINK]: (event: CreateHtmlAreaDialogEvent) => {
            const contentEvent = event as CreateHtmlAreaContentDialogEvent;
            const config = contentEvent.getConfig() as CKEDITOR.eventInfo;

            openRef.current?.({
                ckeDialog: config.data as CKEDITOR.dialog,
                ckeEditor: config.editor,
                content: contentEvent.getContent(),
                project: contentEvent.getProject(),
            });
        },
    };
}
