import {Button, Dialog, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type FormEvent, type ReactElement, useLayoutEffect, useRef} from 'react';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type {AnchorDialogParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {DialogOverrides} from '../form/input-types/html-area/setupEditor';
import {useI18n} from '../../hooks/useI18n';
import {
    $anchorDialog,
    closeAnchorDialog,
    finalizeAnchorDialogClose,
    openAnchorDialog,
    setAnchorDialogName,
    submitAnchorDialog,
    validateAnchorDialog,
} from '../../store/dialogs/anchorDialog.store';

const ANCHOR_DIALOG_NAME = 'AnchorDialog';

export const AnchorDialog = (): ReactElement => {
    const {open, name, validationError} = useStore($anchorDialog, {keys: ['open', 'name', 'validationError']});
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const title = useI18n('dialog.anchor.title');
    const nameLabel = useI18n('dialog.anchor.formitem.name');
    const insertLabel = useI18n('action.insert');

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $anchorDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            inputRef.current,
            cancelButtonRef.current,
            submitButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement | HTMLInputElement => !!element);

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
        submitAnchorDialog();
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeAnchorDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        inputRef.current?.focus({focusVisible: true});
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(finalizeAnchorDialogClose);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventOpenAutoFocus}
                    onCloseAutoFocus={handleCloseAutoFocus}
                    className='w-full gap-5.5 h-fit py-5 px-3 sm:py-10 sm:px-8 max-w-full md:max-w-140'
                    data-component={ANCHOR_DIALOG_NAME}
                >
                    <Dialog.Header className='px-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5'>
                        <Dialog.Title className='col-start-1 row-start-1 min-w-0 font-semibold text-2xl'>{title}</Dialog.Title>
                        <Dialog.DefaultClose
                            ref={closeButtonRef}
                            className='col-start-2 row-start-1 self-start justify-self-end'
                        />
                    </Dialog.Header>
                    <form className='contents' onSubmit={handleSubmit}>
                        <Dialog.Body className='flex flex-col gap-2.5 overflow-visible p-2'>
                            <Input
                                ref={inputRef}
                                label={nameLabel}
                                value={name}
                                error={validationError}
                                onChange={(event) => {
                                    setAnchorDialogName(event.currentTarget.value);
                                }}
                                onBlur={() => {
                                    validateAnchorDialog();
                                }}
                            />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button
                                ref={submitButtonRef}
                                type='submit'
                                size='lg'
                                variant='solid'
                                label={insertLabel}
                            />
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

AnchorDialog.displayName = ANCHOR_DIALOG_NAME;

export function createAnchorDialogOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.ANCHOR]: (event: CreateHtmlAreaDialogEvent) => {
            openAnchorDialog(event.getConfig() as AnchorDialogParams);
        },
    };
}
