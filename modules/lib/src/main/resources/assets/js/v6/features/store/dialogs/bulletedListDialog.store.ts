import {map} from 'nanostores';
import {consumeListStyleDialogSelectionBookmarks} from '../../../../app/inputtype/ui/text/ListStyleDialogContextMenu';
import eventInfo = CKEDITOR.eventInfo;

export type BulletedListDialogType = 'notset' | 'circle' | 'disc' | 'square';
type CkEditorBookmarks = ReturnType<CKEDITOR.dom.selection['createBookmarks2']>;

type BulletedListDialogOption = {
    value: BulletedListDialogType;
    label: string;
};

type BulletedListDialogStore = {
    open: boolean;
    type: BulletedListDialogType;
    typeOptions: BulletedListDialogOption[];
    editor?: CKEDITOR.editor;
    dialog?: CKEDITOR.dialog;
    selectionBookmarks?: CkEditorBookmarks;
};

const initialState: BulletedListDialogStore = {
    open: false,
    type: 'notset',
    typeOptions: [],
    editor: undefined,
    dialog: undefined,
    selectionBookmarks: undefined,
};

export const $bulletedListDialog = map<BulletedListDialogStore>(structuredClone(initialState));

const resetBulletedListDialog = (): void => {
    $bulletedListDialog.set(structuredClone(initialState));
};

const hideOriginalDialog = (dialog: CKEDITOR.dialog): void => {
    const dialogElement = dialog.getElement()?.$;
    const backgroundCover = dialogElement?.ownerDocument.getElementsByClassName('cke_dialog_background_cover')[0] as HTMLElement | undefined;

    if (dialogElement) {
        dialogElement.style.display = 'none';
    }

    if (backgroundCover) {
        backgroundCover.style.left = '-10000px';
    }
};

const restoreOriginalDialogVisibility = (dialog?: CKEDITOR.dialog): void => {
    const dialogElement = dialog?.getElement()?.$;

    if (dialogElement) {
        dialogElement.style.display = 'block';
    }
};

const getDialogElement = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
): CKEDITOR.ui.dialog.uiElement => {
    return dialog.getContentElement(pageId, elementId);
};

const getDialogValue = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
): string => {
    return getDialogElement(dialog, pageId, elementId).getValue();
};

const setDialogValue = (
    dialog: CKEDITOR.dialog,
    pageId: string,
    elementId: string,
    value: string,
): void => {
    getDialogElement(dialog, pageId, elementId).setValue(value, false);
};

const toInternalBulletedListDialogType = (value: string): BulletedListDialogType => {
    return value === 'circle' || value === 'disc' || value === 'square' ? value : 'notset';
};

const toExternalBulletedListDialogType = (value: BulletedListDialogType): string => {
    return value === 'notset' ? '' : value;
};

const restoreEditorSelection = (
    editor: CKEDITOR.editor,
    bookmarks?: CkEditorBookmarks,
): void => {
    if (!bookmarks) {
        return;
    }

    editor.getSelection()?.selectBookmarks(bookmarks);
};

const getBulletedListDialogOptions = (editor: CKEDITOR.editor): BulletedListDialogOption[] => {
    const lang = editor.lang.liststyle as Record<string, string | undefined> | undefined;

    return [
        {value: 'notset', label: lang?.notset || 'Not Set'},
        {value: 'circle', label: lang?.circle || 'Circle'},
        {value: 'disc', label: lang?.disc || 'Disc'},
        {value: 'square', label: lang?.square || 'Square'},
    ];
};

export const openBulletedListDialog = (config: eventInfo): void => {
    const dialog = config.data as CKEDITOR.dialog;

    hideOriginalDialog(dialog);

    $bulletedListDialog.set({
        ...structuredClone(initialState),
        open: true,
        type: toInternalBulletedListDialogType(getDialogValue(dialog, 'info', 'type')),
        typeOptions: getBulletedListDialogOptions(config.editor),
        editor: config.editor,
        dialog,
        selectionBookmarks: consumeListStyleDialogSelectionBookmarks(config.editor),
    });
};

export const closeBulletedListDialog = (): void => {
    const state = $bulletedListDialog.get();

    if (!state.open) {
        return;
    }

    $bulletedListDialog.set({
        ...state,
        open: false,
    });
};

export const setBulletedListDialogType = (type: BulletedListDialogType): void => {
    const state = $bulletedListDialog.get();

    $bulletedListDialog.set({
        ...state,
        type,
    });
};

export const submitBulletedListDialog = (): void => {
    const {dialog, type} = $bulletedListDialog.get();

    if (!dialog) {
        return;
    }

    $bulletedListDialog.setKey('selectionBookmarks', undefined);
    setDialogValue(dialog, 'info', 'type', toExternalBulletedListDialogType(type));
    dialog.getButton('ok').click();
    closeBulletedListDialog();
};

export const finalizeBulletedListDialogClose = (): void => {
    const {dialog, editor, selectionBookmarks} = $bulletedListDialog.get();

    restoreOriginalDialogVisibility(dialog);
    dialog?.hide();

    if (editor && !editor['destroyed']) {
        editor.focus();
        restoreEditorSelection(editor, selectionBookmarks);
    }

    resetBulletedListDialog();
};
