/*global CKEDITOR*/
import {type HtmlEditorParams} from './HtmlEditorParams';

type editor = CKEDITOR.editor;

export interface HtmlEditorCursorPosition {
    selectionIndexes: number[];
    indexOfSelectedElement: number;
    startOffset: number;
}

export interface FullScreenDialogParams {
    editor: editor,
    editorParams: HtmlEditorParams,
    cursorPosition: HtmlEditorCursorPosition
}

export interface AnchorDialogParams {
    editor: editor,
    bookmarks?: ReturnType<CKEDITOR.dom.selection['createBookmarks2']>
}

export interface CodeDialogParams {
    editor: editor,
    initialValue: string
}

export interface SpecialCharDialogParams {
    editor: editor
}

export type SearchPopupMode = 'find' | 'replace';

export interface SearchPopupParams {
    editor: editor,
    mode: SearchPopupMode
}

export interface TableQuicktablePopupParams {
    editor: editor
}

export interface Macro {
    name: string;
    attributes: string[];
    macroStart: CKEDITOR.dom.element;
    index: number,
    body?: string | HTMLElement[];
    macroEnd?: CKEDITOR.dom.element;
}

export interface MacroDialogParams {
    editor: editor,
    macro: Macro
}
