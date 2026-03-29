import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {consumeListStyleDialogSelectionBookmarks} from '../../../../app/inputtype/ui/text/ListStyleDialogContextMenu';
import {
    type CkEditorBookmarks,
    getDialogElement,
    hideOriginalDialog,
    restoreEditorSelection,
    restoreOriginalDialogVisibility,
} from './ckeditorDialogUtils';
import eventInfo = CKEDITOR.eventInfo;

export type NumberedListDialogType =
    'notset' |
    'lower-roman' |
    'upper-roman' |
    'lower-alpha' |
    'upper-alpha' |
    'decimal';

type NumberedListDialogOption = {
    value: NumberedListDialogType;
    label: string;
};

type NumberedListDialogStore = {
    open: boolean;
    start: string;
    type: NumberedListDialogType;
    typeOptions: NumberedListDialogOption[];
    startValidationError?: string;
    editor?: CKEDITOR.editor;
    dialog?: CKEDITOR.dialog;
    selectionBookmarks?: CkEditorBookmarks;
};

const initialState: NumberedListDialogStore = {
    open: false,
    start: '',
    type: 'notset',
    typeOptions: [],
    startValidationError: undefined,
    editor: undefined,
    dialog: undefined,
    selectionBookmarks: undefined,
};

export const $numberedListDialog = map<NumberedListDialogStore>(structuredClone(initialState));

const resetNumberedListDialog = (): void => {
    $numberedListDialog.set(structuredClone(initialState));
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

const toInternalNumberedListDialogType = (value: string): NumberedListDialogType => {
    return value === 'lower-roman' ||
           value === 'upper-roman' ||
           value === 'lower-alpha' ||
           value === 'upper-alpha' ||
           value === 'decimal'
        ? value
        : 'notset';
};

const toExternalNumberedListDialogType = (value: NumberedListDialogType): string => {
    return value === 'notset' ? '' : value;
};

const normalizeNumberedListDialogStart = (value: string): string => value.trim();

const getNumberedListDialogStartError = (value: string): string | undefined => {
    const normalizedValue = normalizeNumberedListDialogStart(value);

    if (!normalizedValue) {
        return i18n('field.value.required');
    }

    if (!/^\d+$/.test(normalizedValue) || Number(normalizedValue) <= 0) {
        return i18n('field.value.invalid');
    }

    return undefined;
};

const getNumberedListDialogOptions = (editor: CKEDITOR.editor): NumberedListDialogOption[] => {
    const lang = editor.lang.liststyle as Record<string, string | undefined> | undefined;

    return [
        {value: 'notset', label: lang?.notset || 'Not Set'},
        {value: 'lower-roman', label: lang?.lowerRoman || 'Lower Roman'},
        {value: 'upper-roman', label: lang?.upperRoman || 'Upper Roman'},
        {value: 'lower-alpha', label: lang?.lowerAlpha || 'Lower Alpha'},
        {value: 'upper-alpha', label: lang?.upperAlpha || 'Upper Alpha'},
        {value: 'decimal', label: lang?.decimal || 'Decimal'},
    ];
};

export const openNumberedListDialog = (config: eventInfo): void => {
    const dialog = config.data as CKEDITOR.dialog;

    hideOriginalDialog(dialog);

    $numberedListDialog.set({
        ...structuredClone(initialState),
        open: true,
        start: getDialogValue(dialog, 'info', 'start'),
        type: toInternalNumberedListDialogType(getDialogValue(dialog, 'info', 'type')),
        typeOptions: getNumberedListDialogOptions(config.editor),
        editor: config.editor,
        dialog,
        selectionBookmarks: consumeListStyleDialogSelectionBookmarks(config.editor),
    });
};

export const closeNumberedListDialog = (): void => {
    const state = $numberedListDialog.get();

    if (!state.open) {
        return;
    }

    $numberedListDialog.set({
        ...state,
        open: false,
    });
};

export const setNumberedListDialogStart = (start: string): void => {
    const state = $numberedListDialog.get();

    $numberedListDialog.set({
        ...state,
        start,
        startValidationError: state.startValidationError ? getNumberedListDialogStartError(start) : state.startValidationError,
    });
};

export const setNumberedListDialogType = (type: NumberedListDialogType): void => {
    const state = $numberedListDialog.get();

    $numberedListDialog.set({
        ...state,
        type,
    });
};

export const validateNumberedListDialog = (): boolean => {
    const state = $numberedListDialog.get();
    const startValidationError = getNumberedListDialogStartError(state.start);

    $numberedListDialog.set({
        ...state,
        startValidationError,
    });

    return !startValidationError;
};

export const submitNumberedListDialog = (): void => {
    const {dialog, start, type} = $numberedListDialog.get();

    if (!validateNumberedListDialog() || !dialog) {
        return;
    }

    $numberedListDialog.setKey('selectionBookmarks', undefined);
    setDialogValue(dialog, 'info', 'start', normalizeNumberedListDialogStart(start));
    setDialogValue(dialog, 'info', 'type', toExternalNumberedListDialogType(type));
    dialog.getButton('ok').click();
    closeNumberedListDialog();
};

export const finalizeNumberedListDialogClose = (): void => {
    const {dialog, editor, selectionBookmarks} = $numberedListDialog.get();

    restoreOriginalDialogVisibility(dialog);
    dialog?.hide();

    if (editor && !editor['destroyed']) {
        editor.focus();
        restoreEditorSelection(editor, selectionBookmarks);
    }

    resetNumberedListDialog();
};
