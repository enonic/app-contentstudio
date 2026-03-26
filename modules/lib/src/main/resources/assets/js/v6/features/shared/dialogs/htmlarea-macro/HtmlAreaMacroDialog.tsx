import {Button, Dialog} from '@enonic/ui';
import {type ReactElement} from 'react';
import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {type CreateHtmlAreaMacroDialogEvent} from '../../../../../app/inputtype/ui/text/CreateHtmlAreaMacroDialogEvent';
import type {MacroDialogParams} from '../../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {DialogOverrides} from '../../form/input-types/html-area/setupEditor';
import {useI18n} from '../../../hooks/useI18n';
import {
    HtmlAreaMacroDialogProvider,
    type OpenHtmlAreaMacroDialogParams,
    useHtmlAreaMacroDialogContext,
} from './HtmlAreaMacroDialogContext';
import {HtmlAreaMacroDialogContent} from './HtmlAreaMacroDialogContent';

const DIALOG_NAME = 'HtmlAreaMacroDialog';

const HtmlAreaMacroDialogInner = (): ReactElement => {
    const {state: {open}, isEditing, canSubmit, close, submit} = useHtmlAreaMacroDialogContext();

    const title = useI18n('dialog.macro.title');
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
                <Dialog.Overlay />
                <Dialog.Content
                    className='w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-220 md:max-h-[85vh]'
                    data-component={DIALOG_NAME}
                >
                    <Dialog.DefaultHeader title={title} withClose />
                    <Dialog.Body className='flex flex-col gap-5 p-1.5'>
                        <HtmlAreaMacroDialogContent />
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
            </Dialog.Portal>
        </Dialog.Root>
    );
};

HtmlAreaMacroDialogInner.displayName = 'HtmlAreaMacroDialogInner';

type HtmlAreaMacroDialogProps = {
    openRef: { current: ((params: OpenHtmlAreaMacroDialogParams) => void) | undefined };
};

export const HtmlAreaMacroDialog = ({openRef}: HtmlAreaMacroDialogProps): ReactElement => {
    return (
        <HtmlAreaMacroDialogProvider openRef={openRef}>
            <HtmlAreaMacroDialogInner />
        </HtmlAreaMacroDialogProvider>
    );
};

HtmlAreaMacroDialog.displayName = DIALOG_NAME;

export function createMacroDialogOverride(
    openRef: { current: ((params: OpenHtmlAreaMacroDialogParams) => void) | undefined },
): DialogOverrides {
    return {
        [HtmlAreaDialogType.MACRO]: (event: CreateHtmlAreaDialogEvent) => {
            const macroEvent = event as CreateHtmlAreaMacroDialogEvent;
            const config = macroEvent.getConfig() as MacroDialogParams;

            openRef.current?.({
                ckeEditor: config.editor,
                content: macroEvent.getContent(),
                project: macroEvent.getProject(),
                applicationKeys: macroEvent.getApplicationKeys(),
                macro: config.macro,
            });
        },
    };
}
