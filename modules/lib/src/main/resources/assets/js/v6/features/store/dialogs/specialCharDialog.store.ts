import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {type CkEditorBookmarks, captureEditorBookmarks, restoreEditorSelectionSafe} from './ckeditorDialogUtils';

type CkEditorSpecialChar = string | [string, string];

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

    const name = specialChar.replace(/[&;#]/g, '');

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

export const submitSpecialCharDialog = (value: string): void => {
    const {editor, bookmarks} = $specialCharDialog.get();

    if (!editor || editor['destroyed']) {
        return;
    }

    editor.focus();
    restoreEditorSelectionSafe(editor, bookmarks);

    if (value === SPECIAL_CHAR_NBSP) {
        editor.insertHtml('&nbsp;', 'text');
    } else if (value === SPECIAL_CHAR_SHY) {
        editor.insertHtml(`<span class="shy" title="${i18n('text.htmlEditor.specialchars.shy')}">&shy;</span>`, 'text');
    } else {
        editor.insertText(value);
    }

    closeSpecialCharDialog();
};
