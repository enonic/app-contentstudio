export type CkEditorBookmarks = ReturnType<CKEDITOR.dom.selection['createBookmarks2']>;

export type CkEditorToolbarButton = {
    _: {
        id?: string;
    };
};

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

export const captureEditorBookmarks = (editor: CKEDITOR.editor): CkEditorBookmarks | undefined => {
    const selection = editor.getSelection();

    return selection ? selection.createBookmarks2(true) : undefined;
};

export const restoreEditorSelection = (
    editor: CKEDITOR.editor,
    bookmarks?: CkEditorBookmarks,
): void => {
    if (!bookmarks) {
        return;
    }

    editor.getSelection()?.selectBookmarks(bookmarks);
};

export const restoreEditorSelectionSafe = (
    editor: CKEDITOR.editor,
    bookmarks?: CkEditorBookmarks,
): void => {
    if (!bookmarks) {
        return;
    }

    try {
        editor.getSelection()?.selectBookmarks(bookmarks);
    } catch {
        // Bookmarks may become invalid if the DOM changed between capture and restore
    }
};

export const hideOriginalDialog = (dialog: CKEDITOR.dialog): void => {
    const dialogElement = dialog.getElement()?.$;
    const backgroundCover = dialogElement?.ownerDocument.getElementsByClassName('cke_dialog_background_cover')[0] as HTMLElement | undefined;

    if (dialogElement) {
        dialogElement.style.display = 'none';
    }

    if (backgroundCover) {
        backgroundCover.style.left = '-10000px';
    }
};

export const restoreOriginalDialogVisibility = (dialog?: CKEDITOR.dialog): void => {
    const dialogElement = dialog?.getElement()?.$;

    if (dialogElement) {
        dialogElement.style.display = 'block';
    }
};

export const getDialogElement = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
): CKEDITOR.ui.dialog.uiElement => {
    return dialog.getContentElement(pageId, elementId);
};

export const getDialogValue = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
): string => {
    return getDialogElement(dialog, pageId, elementId).getValue();
};

export const setDialogValue = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
    value: string,
): void => {
    getDialogElement(dialog, pageId, elementId).setValue(value, false);
};

export const getTriggerButtonId = (editor: CKEDITOR.editor, buttonName: string): string | undefined => {
    const button = editor.ui.get(buttonName) as unknown as CkEditorToolbarButton | undefined;

    return button?._?.id;
};

export const getTriggerElement = (
    triggerButtonId: string | undefined,
    editor: CKEDITOR.editor | undefined,
    fallbackSelector: string,
): HTMLElement | null => {
    if (triggerButtonId) {
        return document.getElementById(triggerButtonId);
    }

    return editor?.container?.$?.querySelector?.(fallbackSelector) ?? null;
};
