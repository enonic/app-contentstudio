import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {
    $specialCharDialog,
    closeSpecialCharDialog,
    submitSpecialCharDialog,
} from '../../store/dialogs/specialCharDialog.store';

const SPECIAL_CHAR_DIALOG_NAME = 'SpecialCharDialog';

export const SpecialCharDialog = (): ReactElement => {
    const {open, items} = useStore($specialCharDialog, {keys: ['open', 'items']});
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const editorRef = useRef<CKEDITOR.editor | undefined>(undefined);

    const title = useI18n('dialog.charmap.title');

    const [focusedIndex, setFocusedIndex] = useState(0);

    useEffect(() => {
        if (open) {
            setFocusedIndex(0);
            editorRef.current = $specialCharDialog.get().editor;
        }
    }, [open, items.length]);

    useLayoutEffect(() => {
        if (!open || !contentRef.current) {
            return;
        }

        const {editor} = $specialCharDialog.get();

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
            ...buttonRefs.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open, items.length]);

    const moveFocusTo = (nextIndex: number): void => {
        const clampedIndex = Math.max(0, Math.min(nextIndex, items.length - 1));

        setFocusedIndex(clampedIndex);
        buttonRefs.current[clampedIndex]?.focus({focusVisible: true});
    };

    const getColumnCount = (): number => {
        const firstTop = buttonRefs.current[0]?.offsetTop;

        if (firstTop == null) {
            return 1;
        }

        let count = 0;

        for (const element of buttonRefs.current) {
            if (!element || element.offsetTop !== firstTop) {
                break;
            }

            count += 1;
        }

        return Math.max(count, 1);
    };

    const handleCharKeyDown = (index: number) => (event: KeyboardEvent): void => {
        const columns = getColumnCount();

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveFocusTo(index + 1);
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveFocusTo(index - 1);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveFocusTo(index + columns);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveFocusTo(index - columns);
        }
    };


    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen) {
            closeSpecialCharDialog();
        }
    };

    const preventOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        closeButtonRef.current?.focus({focusVisible: true});
    };

    const handleCloseAutoFocus = (event: Event): void => {
        event.preventDefault();
        requestAnimationFrame(() => {
            if (editorRef.current && !editorRef.current['destroyed']) {
                editorRef.current.focus();
            }
        });
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventOpenAutoFocus}
                    onCloseAutoFocus={handleCloseAutoFocus}
                    className='w-full gap-5.5 h-fit py-5 px-3 sm:py-10 sm:px-8 max-w-full md:max-w-240'
                    data-component={SPECIAL_CHAR_DIALOG_NAME}
                >
                    <Dialog.Header className='px-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5'>
                        <Dialog.Title className='col-start-1 row-start-1 min-w-0 font-semibold text-2xl'>{title}</Dialog.Title>
                        <Dialog.DefaultClose
                            ref={closeButtonRef}
                            className='col-start-2 row-start-1 self-start justify-self-end'
                        />
                    </Dialog.Header>
                    <Dialog.Body className='grid grid-cols-14 gap-2 sm:grid-cols-18 md:grid-cols-24 p-2'>
                        {items.map((item, index) => (
                            <Button
                                key={`${item.value}-${index}`}
                                ref={(button) => {
                                    buttonRefs.current[index] = button;
                                }}
                                type='button'
                                title={item.title}
                                aria-label={item.title}
                                variant='text'
                                tabIndex={focusedIndex === index ? 0 : -1}
                                onFocus={() => setFocusedIndex(index)}
                                onKeyDown={handleCharKeyDown(index)}
                                onClick={() => submitSpecialCharDialog(item.value)}
                                className='flex px-0 h-fit items-center justify-center text-sm sm:text-lg md:text-lg focus-visible:ring-1 sm:focus-visible:ring-3 focus-visible:ring-offset-1 sm:focus-visible:ring-offset-3'
                            >
                                {item.value}
                            </Button>
                        ))}

                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

SpecialCharDialog.displayName = SPECIAL_CHAR_DIALOG_NAME;
