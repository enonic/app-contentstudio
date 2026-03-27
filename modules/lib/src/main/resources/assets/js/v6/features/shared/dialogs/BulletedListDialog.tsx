import {Button, Dialog, Selector} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type FormEvent, type ReactElement, useLayoutEffect, useRef} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {
    $bulletedListDialog,
    closeBulletedListDialog,
    finalizeBulletedListDialogClose,
    setBulletedListDialogType,
    submitBulletedListDialog,
    type BulletedListDialogType,
} from '../../store/dialogs/bulletedListDialog.store';

const BULLETED_LIST_DIALOG_NAME = 'BulletedListDialog';

export const BulletedListDialog = (): ReactElement => {
    const {open, type, typeOptions} = useStore($bulletedListDialog, {keys: ['open', 'type', 'typeOptions']});
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const typeTriggerRef = useRef<HTMLButtonElement | null>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const title = useI18n('dialog.list.bulleted.title');
    const typeLabel = useI18n('dialog.list.type');
    const submitLabel = useI18n('action.ok');
    const typeLabels = Object.fromEntries(typeOptions.map((option) => [option.value, option.label]));

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $bulletedListDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            typeTriggerRef.current,
            submitButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement => !!element);

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
        submitBulletedListDialog();
    };

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeBulletedListDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        typeTriggerRef.current?.focus({focusVisible: true});
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(finalizeBulletedListDialogClose);
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
                    data-component={BULLETED_LIST_DIALOG_NAME}
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
                            <div className='flex flex-col gap-2.5'>
                                <span className='font-semibold'>{typeLabel}</span>
                                <Selector.Root
                                    value={type}
                                    onValueChange={(value) => {
                                        setBulletedListDialogType(value as BulletedListDialogType);
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

BulletedListDialog.displayName = BULLETED_LIST_DIALOG_NAME;
