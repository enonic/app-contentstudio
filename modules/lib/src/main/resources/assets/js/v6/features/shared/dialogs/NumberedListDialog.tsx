import {Button, Dialog, Input, Selector} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type FormEvent, type ReactElement, useLayoutEffect, useRef} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {
    $numberedListDialog,
    closeNumberedListDialog,
    finalizeNumberedListDialogClose,
    setNumberedListDialogStart,
    setNumberedListDialogType,
    submitNumberedListDialog,
    type NumberedListDialogType,
    validateNumberedListDialog,
} from '../../store/dialogs/numberedListDialog.store';

const NUMBERED_LIST_DIALOG_NAME = 'NumberedListDialog';

export const NumberedListDialog = (): ReactElement => {
    const {open, start, type, typeOptions, startValidationError} = useStore($numberedListDialog, {
        keys: ['open', 'start', 'type', 'typeOptions', 'startValidationError'],
    });
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const startInputRef = useRef<HTMLInputElement | null>(null);
    const typeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const title = useI18n('dialog.list.numbered.title');
    const startLabel = useI18n('dialog.list.numbered.start');
    const typeLabel = useI18n('dialog.list.type');
    const submitLabel = useI18n('action.ok');
    const typeLabels = Object.fromEntries(typeOptions.map((option) => [option.value, option.label]));

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $numberedListDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            startInputRef.current,
            typeTriggerRef.current,
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
        submitNumberedListDialog();
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeNumberedListDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        startInputRef.current?.focus({focusVisible: true});
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(finalizeNumberedListDialogClose);
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
                    data-component={NUMBERED_LIST_DIALOG_NAME}
                >
                    <Dialog.Header className='px-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5'>
                        <Dialog.Title className='col-start-1 row-start-1 min-w-0 font-semibold text-2xl'>{title}</Dialog.Title>
                        <Dialog.DefaultClose
                            ref={closeButtonRef}
                            className='col-start-2 row-start-1 self-start justify-self-end'
                        />
                    </Dialog.Header>
                    <form className='contents' onSubmit={handleSubmit}>
                        <Dialog.Body className='grid gap-7.5 p-2'>
                            <Input
                                ref={startInputRef}
                                label={startLabel}
                                value={start}
                                error={startValidationError}
                                inputMode='numeric'
                                onChange={(event) => {
                                    setNumberedListDialogStart(event.currentTarget.value);
                                }}
                                onBlur={() => {
                                    validateNumberedListDialog();
                                }}
                            />
                            <div className='flex flex-col gap-2.5'>
                                <span className='font-semibold'>{typeLabel}</span>
                                <Selector.Root
                                    value={type}
                                    onValueChange={(value) => {
                                        setNumberedListDialogType(value as NumberedListDialogType);
                                    }}
                                >
                                    <Selector.Trigger ref={typeTriggerRef} aria-label={typeLabel}>
                                        <Selector.Value>
                                            {(value) => typeLabels[value] ?? typeLabels.notset ?? ''}
                                        </Selector.Value>
                                        <Selector.Icon />
                                    </Selector.Trigger>
                                    <Selector.Content portal={false} onPointerDown={(event) => event.stopPropagation()}>
                                        <Selector.Viewport>
                                            {typeOptions.map((option) => (
                                                <Selector.Item
                                                    key={option.value}
                                                    value={option.value}
                                                    textValue={option.label}
                                                >
                                                    <Selector.ItemText>{option.label}</Selector.ItemText>
                                                    <Selector.ItemIndicator />
                                                </Selector.Item>
                                            ))}
                                        </Selector.Viewport>
                                    </Selector.Content>
                                </Selector.Root>
                            </div>
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

NumberedListDialog.displayName = NUMBERED_LIST_DIALOG_NAME;
