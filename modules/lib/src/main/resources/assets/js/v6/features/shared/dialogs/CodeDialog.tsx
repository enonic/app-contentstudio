import {Button, Dialog, TextArea} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type FormEvent, type ReactElement, useLayoutEffect, useRef} from 'react';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type {CodeDialogParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {DialogOverrides} from '../form/input-types/html-area/setupEditor';
import {useI18n} from '../../hooks/useI18n';
import {
    $codeDialog,
    closeCodeDialog,
    finalizeCodeDialogClose,
    openCodeDialog,
    setCodeDialogValue,
    submitCodeDialog,
} from '../../store/dialogs/codeDialog.store';

const CODE_DIALOG_NAME = 'CodeDialog';

export const CodeDialog = (): ReactElement => {
    const {open, value} = useStore($codeDialog, {keys: ['open', 'value']});
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const title = useI18n('dialog.sourcecode.title');
    const submitLabel = useI18n('action.ok');

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $codeDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            textAreaRef.current,
            submitButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement | HTMLTextAreaElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        submitCodeDialog();
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeCodeDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        textAreaRef.current?.focus({focusVisible: true});
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(finalizeCodeDialogClose);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventOpenAutoFocus}
                    onCloseAutoFocus={handleCloseAutoFocus}
                    className='source-code-modal-dialog w-full gap-5.5 h-fit py-5 px-3 sm:py-10 sm:px-8 max-w-full md:max-w-240'
                    data-component={CODE_DIALOG_NAME}
                >
                    <Dialog.Header className='px-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5'>
                        <Dialog.Title className='col-start-1 row-start-1 min-w-0 font-semibold text-2xl'>{title}</Dialog.Title>
                        <Dialog.DefaultClose
                            ref={closeButtonRef}
                            className='col-start-2 row-start-1 self-start justify-self-end'
                        />
                    </Dialog.Header>
                    <form className='contents' onSubmit={handleSubmit}>
                        <Dialog.Body className='p-2'>
                            <TextArea
                                ref={textAreaRef}
                                id='source-textarea'
                                value={value}
                                onInput={(event) => {
                                    setCodeDialogValue(event.currentTarget.value);
                                }}
                            />
                        </Dialog.Body>
                        <Dialog.Footer className='px-2'>
                            <Button
                                ref={submitButtonRef}
                                type='submit'
                                size='lg'
                                variant='solid'
                                label={submitLabel}
                            />
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

CodeDialog.displayName = CODE_DIALOG_NAME;

export function createCodeDialogOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.CODE]: (event: CreateHtmlAreaDialogEvent) => {
            openCodeDialog(event.getConfig() as CodeDialogParams);
        },
    };
}
