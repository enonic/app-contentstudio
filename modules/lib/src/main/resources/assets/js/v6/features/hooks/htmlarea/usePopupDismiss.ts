import {useEffect} from 'react';

type UsePopupDismissOptions = {
    open: boolean;
    popupRef: { current: HTMLElement | null };
    editor: CKEDITOR.editor | undefined;
    getAnchorElement: () => HTMLElement | null;
    onClose: () => void;
    deps?: readonly unknown[];
};

export function usePopupDismiss({
    open,
    popupRef,
    editor,
    getAnchorElement,
    onClose,
    deps = [],
}: UsePopupDismissOptions): void {
    useEffect(() => {
        if (!open) {
            return;
        }

        const editable = editor?.editable();

        const isWithinContext = (target: Node | null): boolean => {
            if (!target) {
                return false;
            }

            const anchorElement = getAnchorElement();
            const editorContainer = editor?.container?.$;

            return popupRef.current?.contains(target) ||
                anchorElement?.contains(target) ||
                editorContainer?.contains(target) ||
                false;
        };

        const handleClose = (): void => {
            onClose();
        };

        const handleFocusIn = (event: FocusEvent): void => {
            if (!isWithinContext(event.target as Node | null)) {
                handleClose();
            }
        };

        const handlePointerDown = (event: PointerEvent): void => {
            if (!isWithinContext(event.target as Node | null)) {
                handleClose();
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('blur', handleClose);
        editable?.on('mousedown', handleClose);
        editor?.on('destroy', handleClose);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('blur', handleClose);
            editable?.removeListener('mousedown', handleClose);
            editor?.removeListener('destroy', handleClose);
        };
    }, [open, editor, ...deps]);
}
