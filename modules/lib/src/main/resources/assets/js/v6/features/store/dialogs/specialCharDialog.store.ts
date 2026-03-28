import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';

type CkEditorSpecialChar = string | [string, string];
type CkEditorBookmarks = ReturnType<CKEDITOR.dom.selection['createBookmarks2']>;

const SPECIAL_CHAR_NBSP = '(_)';
const SPECIAL_CHAR_SHY = '(-)';


export type SpecialCharDialogItem = {
    value: string;
    title: string;
};

type SpecialCharDialogStore = {
    open: boolean;
    items: SpecialCharDialogItem[];
    editor?: CKEDITOR.editor;
    bookmarks?: CkEditorBookmarks;
};

const initialState: SpecialCharDialogStore = {
    open: false,
    items: [],
    editor: undefined,
    bookmarks: undefined,
};

export const $specialCharDialog = map<SpecialCharDialogStore>(structuredClone(initialState));

const decodeSpecialChar = (html: string): string => {
    const span = document.createElement('span');
    span.innerHTML = html;

    return span.textContent ?? html;
};

const toDialogItem = (
    specialChar: CkEditorSpecialChar,
    lang: Record<string, string | undefined>,
): SpecialCharDialogItem => {
    if (typeof specialChar !== 'string') {
        return {
            value: decodeSpecialChar(specialChar[0]),
            title: specialChar[1],
        };
    }

    const name = specialChar.replace('&', '').replace(';', '').replace('#', '');

    return {
        value: decodeSpecialChar(specialChar),
        title: lang[name] || specialChar,
    };
};

const getDialogItems = (editor: CKEDITOR.editor): SpecialCharDialogItem[] => {
    const specialChars = (editor.config.specialChars || []) as CkEditorSpecialChar[];
    const lang = editor.lang.specialchar as Record<string, string | undefined>;

    return specialChars.map((specialChar) => toDialogItem(specialChar, lang));
};

const captureEditorBookmarks = (editor: CKEDITOR.editor): CkEditorBookmarks | undefined => {
    const selection = editor.getSelection();

    return selection ? selection.createBookmarks2(true) : undefined;
};

export const openSpecialCharDialog = (editor: CKEDITOR.editor): void => {
    const bookmarks = captureEditorBookmarks(editor);

    $specialCharDialog.set({
        ...structuredClone(initialState),
        open: true,
        editor,
        items: getDialogItems(editor),
        bookmarks,
    });
};

export const closeSpecialCharDialog = (): void => {
    const {open} = $specialCharDialog.get();

    if (!open) {
        return;
    }

    $specialCharDialog.set(structuredClone(initialState));
};

const restoreEditorSelection = (
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

export const submitSpecialCharDialog = (value: string): void => {
    const {editor, bookmarks} = $specialCharDialog.get();

    if (!editor || editor['destroyed']) {
        return;
    }

    editor.focus();
    restoreEditorSelection(editor, bookmarks);

    if (value === SPECIAL_CHAR_NBSP) {
        editor.insertHtml('&nbsp;', 'text');
    } else if (value === SPECIAL_CHAR_SHY) {
        editor.insertHtml(`<span class="shy" title="${i18n('text.htmlEditor.specialchars.shy')}">&shy;</span>`, 'text');
    } else {
        editor.insertText(value);
    }

    closeSpecialCharDialog();
};
