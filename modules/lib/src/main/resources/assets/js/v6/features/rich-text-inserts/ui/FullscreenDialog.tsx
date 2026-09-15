import { cn, Dialog } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCkEditorFocusManager } from '../../../shared/lib/ckeditor/useCkEditorFocusManager';
import {
    type CreateHtmlAreaDialogEvent,
    HtmlAreaDialogType,
} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type { FullScreenDialogParams } from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type { DialogOverrides } from '../../shared/form/input-types/html-area/setupEditor';
import {
    $fullscreenDialog,
    closeFullscreenDialog,
    initializeFullscreenDialogEditor,
    openFullscreenDialog,
} from '../model/fullscreenDialog.store';
import { $isHtmlAreaChildModalOpen, $isHtmlAreaChildOverlayOpen } from '../model/htmlAreaModal.store';

const FULLSCREEN_DIALOG_NAME = 'FullscreenDialog';

const isOtherHtmlAreaDialogOpen = (): boolean => {
    return $isHtmlAreaChildOverlayOpen.get() || !!document.querySelector('.html-area-modal-dialog');
};

export const FullscreenDialog = (): ReactElement => {
    const { open, initializing, editorContainerId, hideBold, hideItalic, hideUnderline } = useStore($fullscreenDialog, {
        keys: ['open', 'initializing', 'editorContainerId', 'hideBold', 'hideItalic', 'hideUnderline'],
    });
    const childModalOpen = useStore($isHtmlAreaChildModalOpen);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const stackedDialogAtInputRef = useRef(false);

    const handleTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
        if (el == null) {
            return;
        }

        initializeFullscreenDialogEditor();
    }, []);

    const fullscreenCkEditor = useMemo(
        () => (open && editorContainerId ? CKEDITOR.instances[editorContainerId] : undefined),
        [open, initializing, editorContainerId],
    );

    useCkEditorFocusManager(fullscreenCkEditor, [contentRef, closeButtonRef], [open, initializing, editorContainerId]);

    useEffect(() => {
        if (!open) {
            return;
        }

        stackedDialogAtInputRef.current = false;

        const captureStackedDialogState = (): void => {
            stackedDialogAtInputRef.current = isOtherHtmlAreaDialogOpen();
        };

        document.addEventListener('pointerdown', captureStackedDialogState, true);
        document.addEventListener('keydown', captureStackedDialogState, true);

        return () => {
            document.removeEventListener('pointerdown', captureStackedDialogState, true);
            document.removeEventListener('keydown', captureStackedDialogState, true);
        };
    }, [open]);

    const handleOpenChange = (nextOpen: boolean): void => {
        if (nextOpen) {
            return;
        }

        if (stackedDialogAtInputRef.current || isOtherHtmlAreaDialogOpen()) {
            return;
        }

        closeFullscreenDialog();
    };

    const preventAutoFocus = (event: Event): void => {
        event.preventDefault();
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className={cn(childModalOpen && 'opacity-0')} />
                <Dialog.Content
                    ref={contentRef}
                    onOpenAutoFocus={preventAutoFocus}
                    onCloseAutoFocus={preventAutoFocus}
                    className="html-area-fullscreen-dialog w-full h-full max-w-[1600px] max-h-98/100 gap-0 overflow-hidden p-0"
                    data-component={FULLSCREEN_DIALOG_NAME}
                >
                    <Dialog.DefaultClose
                        ref={closeButtonRef}
                        className="absolute top-1.75 right-1.75 z-20 size-9 self-start justify-self-end [&_svg]:size-7"
                    />
                    <Dialog.Body className="flex h-full min-h-0 flex-col overflow-hidden p-0">
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
                                ref={handleTextareaRef}
                                className="hidden invisible"
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

export function createFullscreenDialogOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.FULLSCREEN]: (event: CreateHtmlAreaDialogEvent) => {
            openFullscreenDialog(event.getConfig() as FullScreenDialogParams);
        },
    };
}
