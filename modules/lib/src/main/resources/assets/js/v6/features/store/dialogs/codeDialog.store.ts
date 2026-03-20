import {map} from 'nanostores';
import {type CodeDialogParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';

type CodeDialogStore = {
    open: boolean;
    value: string;
    initialValue: string;
    editor?: CKEDITOR.editor;
};

const initialState: CodeDialogStore = {
    open: false,
    value: '',
    initialValue: '',
    editor: undefined,
};

export const $codeDialog = map<CodeDialogStore>(structuredClone(initialState));

const resetCodeDialog = (): void => {
    $codeDialog.set(structuredClone(initialState));
};

const selectEditorStart = (editor: CKEDITOR.editor): void => {
    const editable = editor.editable();

    if (!editable) {
        return;
    }

    const range = editor.createRange();

    range.moveToElementEditStart(editable);
    range.select();
};

export const openCodeDialog = ({editor, initialValue}: CodeDialogParams): void => {
    $codeDialog.set({
        ...structuredClone(initialState),
        open: true,
        editor,
        initialValue,
        value: initialValue,
    });
};

export const closeCodeDialog = (): void => {
    const state = $codeDialog.get();

    if (!state.open) {
        return;
    }

    $codeDialog.set({
        ...state,
        open: false,
    });
};

export const setCodeDialogValue = (value: string): void => {
    const state = $codeDialog.get();

    $codeDialog.set({
        ...state,
        value,
    });
};

export const submitCodeDialog = (): void => {
    const {editor, initialValue, value} = $codeDialog.get();

    if (!editor || editor['destroyed']) {
        resetCodeDialog();
        return;
    }

    const normalizedValue = value.replace(/\r/g, '');

    if (normalizedValue !== initialValue) {
        editor.focus();
        editor.setData(normalizedValue, {
            callback: () => {
                if (editor['destroyed']) {
                    resetCodeDialog();
                    return;
                }

                selectEditorStart(editor);
                closeCodeDialog();
            },
        });

        return;
    }

    closeCodeDialog();
};

export const finalizeCodeDialogClose = (): void => {
    const {editor} = $codeDialog.get();

    if (editor && !editor['destroyed']) {
        editor.focus();
    }

    resetCodeDialog();
};
