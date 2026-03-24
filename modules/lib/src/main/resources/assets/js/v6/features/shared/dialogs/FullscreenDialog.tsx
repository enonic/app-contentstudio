import {cn, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useLayoutEffect, useRef} from 'react';
import {$anchorDialog} from '../../store/dialogs/anchorDialog.store';
import {$codeDialog} from '../../store/dialogs/codeDialog.store';
import {
    $fullscreenDialog,
    closeFullscreenDialog,
    initializeFullscreenDialogEditor,
} from '../../store/dialogs/fullscreenDialog.store';
import {$specialCharDialog} from '../../store/dialogs/specialCharDialog.store';
import {$tableDialog} from '../../store/dialogs/tableDialog.store';
import {$tableQuicktablePopup} from '../../store/dialogs/tableQuicktablePopup.store';

const FULLSCREEN_DIALOG_NAME = 'FullscreenDialog';

const isOtherHtmlAreaDialogOpen = (): boolean => {
    return $anchorDialog.get().open ||
        $codeDialog.get().open ||
        $specialCharDialog.get().open ||
        $tableDialog.get().open ||
        $tableQuicktablePopup.get().open ||
        !!document.querySelector('.html-area-modal-dialog');
};

export const FullscreenDialog = (): ReactElement => {
    const {open, initializing, editorContainerId, hideBold, hideItalic, hideUnderline} = useStore($fullscreenDialog, {
        keys: ['open', 'initializing', 'editorContainerId', 'hideBold', 'hideItalic', 'hideUnderline'],
    });
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);

    useLayoutEffect(() => {
        if (!open || !editorContainerId) {
            return;
        }

        initializeFullscreenDialogEditor();
    }, [open, initializing, editorContainerId]);

    useLayoutEffect(() => {
        if (!open || !editorContainerId || !contentRef.current) {
            return;
        }

        const editor = CKEDITOR.instances[editorContainerId];

        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = [
            contentRef.current,
            closeButtonRef.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open, initializing, editorContainerId]);

    const handleOpenChange = (nextOpen: boolean): void => {
        if (!nextOpen && isOtherHtmlAreaDialogOpen()) {
            return;
        }

        if (!nextOpen) {
            closeFullscreenDialog();
        }
    };

    const preventAutoFocus = (event: Event): void => {
        event.preventDefault();
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventAutoFocus}
                    onCloseAutoFocus={preventAutoFocus}
                    className='html-area-fullscreen-dialog w-full h-full max-w-full max-h-98/100 gap-0 overflow-hidden p-0'
                    data-component={FULLSCREEN_DIALOG_NAME}
                >
                    <Dialog.DefaultClose
                        ref={closeButtonRef}
                        className='absolute top-1.75 right-1.75 z-20 self-start justify-self-end size-6'
                    />
                    <Dialog.Body className='flex h-full min-h-0 flex-col overflow-hidden p-0'>
                        <div
                            className={cn(
                                'custom-html-editor-container flex h-full min-h-0 flex-col overflow-hidden',
                                hideBold && 'hide-bold',
                                hideItalic && 'hide-italic',
                                hideUnderline && 'hide-underline',
                            )}
                        >
                            <textarea
                                key={editorContainerId}
                                className='hidden invisible'
                                id={editorContainerId}
                                name={editorContainerId}
                            />
                        </div>
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

FullscreenDialog.displayName = FULLSCREEN_DIALOG_NAME;
