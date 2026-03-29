import type {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {InputBuilder} from '@enonic/lib-admin-ui/form/Input';
import {Occurrences} from '@enonic/lib-admin-ui/form/Occurrences';
import {InputTypeName} from '@enonic/lib-admin-ui/form/InputTypeName';
import type {NumberConfig} from '@enonic/lib-admin-ui/form2/descriptor/InputTypeConfig';
import type {ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor/ValidationResult';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {
    getDialogElement,
    hideOriginalDialog,
    restoreOriginalDialogVisibility,
} from './ckeditorDialogUtils';
import eventInfo = CKEDITOR.eventInfo;
import type {
    TableDialogHeaderValue,
    TableDialogMode,
    TableDialogNumericField,
    TableDialogValidationErrors,
} from './tableDialog.types';

export const TABLE_DIALOG_HEADER_NONE_VALUE = '__none__';
export const TABLE_DIALOG_LONG_INPUT_CONFIG: NumberConfig = {
    min: 1,
    max: undefined,
};
export const TABLE_DIALOG_ROWS_LONG_INPUT = new InputBuilder()
    .setName('tableRows')
    .setInputType(new InputTypeName('Long', false))
    .setLabel(i18n('dialog.table.formitem.rows'))
    .setOccurrences(Occurrences.minmax(0, 1))
    .setHelpText('')
    .setInputTypeConfig({})
    .build();
export const TABLE_DIALOG_COLS_LONG_INPUT = new InputBuilder()
    .setName('tableColumns')
    .setInputType(new InputTypeName('Long', false))
    .setLabel(i18n('dialog.table.formitem.columns'))
    .setOccurrences(Occurrences.minmax(0, 1))
    .setHelpText('')
    .setInputTypeConfig({})
    .build();

export const toInternalTableDialogHeaderValue = (value: string): string => {
    return value === 'row' || value === 'col' || value === 'both' ? value : TABLE_DIALOG_HEADER_NONE_VALUE;
};

export const toExternalTableDialogHeaderValue = (value: string): TableDialogHeaderValue => {
    return value === 'row' || value === 'col' || value === 'both' ? value : '';
};

export const toTableDialogLongInputValue = (value: string): Value => {
    return value === '' ? ValueTypes.LONG.newNullValue() : ValueTypes.LONG.newValue(value);
};

export const toTableDialogLongInputNextValue = (value: Value, rawValue?: string): string => {
    return rawValue ?? (value.isNull() ? '' : String(value.getLong() ?? ''));
};

export const toTableDialogLongInputErrors = (error?: string): ValidationResult[] => {
    return error ? [{message: error}] : [];
};

export const getTableDialogPositiveWholeNumberError = (value: string): string | undefined => {
    const trimmedValue = value.trim();

    if (!/^\d+$/.test(trimmedValue) || Number(trimmedValue) <= 0) {
        return i18n('dialog.table.notawholenumber');
    }

    return undefined;
};

export const isTableDialogSubmittable = (
    mode: TableDialogMode,
    rows: string,
    cols: string,
): boolean => {
    return mode === 'tableProperties' ||
        (!getTableDialogPositiveWholeNumberError(rows) && !getTableDialogPositiveWholeNumberError(cols));
};

type TableDialogStore = {
    open: boolean;
    mode: TableDialogMode;
    rows: string;
    cols: string;
    headers: TableDialogHeaderValue;
    caption: string;
    validationErrors: TableDialogValidationErrors;
    editor?: CKEDITOR.editor;
    dialog?: CKEDITOR.dialog;
};

const initialState: TableDialogStore = {
    open: false,
    mode: 'table',
    rows: '',
    cols: '',
    headers: '',
    caption: '',
    validationErrors: {},
    editor: undefined,
    dialog: undefined,
};

export const $tableDialog = map<TableDialogStore>(structuredClone(initialState));

const resetTableDialog = (): void => {
    $tableDialog.set(structuredClone(initialState));
};

const getMode = (dialog: CKEDITOR.dialog): TableDialogMode => {
    return dialog.getName() === 'table' ? 'table' : 'tableProperties';
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

const getTableDialogValidationErrors = (state: TableDialogStore): TableDialogValidationErrors => {
    if (state.mode === 'tableProperties') {
        return {};
    }

    return {
        rows: getTableDialogPositiveWholeNumberError(state.rows),
        cols: getTableDialogPositiveWholeNumberError(state.cols),
    };
};

const getTableDialogNumericFieldValue = (
    state: TableDialogStore,
    field: TableDialogNumericField,
): string => {
    return field === 'rows' ? state.rows : state.cols;
};

const getTableDialogNumericFieldError = (
    state: TableDialogStore,
    field: TableDialogNumericField,
): string | undefined => {
    return state.mode === 'tableProperties'
        ? undefined
        : getTableDialogPositiveWholeNumberError(getTableDialogNumericFieldValue(state, field));
};

const setTableDialogNumericField = (
    field: TableDialogNumericField,
    value: string,
): void => {
    const state = $tableDialog.get();
    const nextState = field === 'rows'
        ? {
            ...state,
            rows: value,
        }
        : {
            ...state,
            cols: value,
        };

    $tableDialog.set({
        ...nextState,
        validationErrors: {
            ...state.validationErrors,
            [field]: state.validationErrors[field] ? getTableDialogNumericFieldError(nextState, field) : state.validationErrors[field],
        },
    });
};

export const openTableDialog = (config: eventInfo): void => {
    const dialog = config.data as CKEDITOR.dialog;

    hideOriginalDialog(dialog);

    $tableDialog.set({
        ...structuredClone(initialState),
        open: true,
        mode: getMode(dialog),
        rows: getDialogValue(dialog, 'info', 'txtRows'),
        cols: getDialogValue(dialog, 'info', 'txtCols'),
        headers: toExternalTableDialogHeaderValue(getDialogValue(dialog, 'info', 'selHeaders')),
        caption: getDialogValue(dialog, 'info', 'txtCaption'),
        editor: config.editor,
        dialog,
    });
};

export const closeTableDialog = (): void => {
    const state = $tableDialog.get();

    if (!state.open) {
        return;
    }

    $tableDialog.set({
        ...state,
        open: false,
    });
};

export const setTableDialogRows = (rows: string): void => {
    setTableDialogNumericField('rows', rows);
};

export const setTableDialogCols = (cols: string): void => {
    setTableDialogNumericField('cols', cols);
};

export const setTableDialogHeaders = (headers: TableDialogHeaderValue): void => {
    const state = $tableDialog.get();

    $tableDialog.set({
        ...state,
        headers,
    });
};

export const setTableDialogCaption = (caption: string): void => {
    const state = $tableDialog.get();

    $tableDialog.set({
        ...state,
        caption,
    });
};

export const validateTableDialogField = (field: TableDialogNumericField): boolean => {
    const state = $tableDialog.get();
    const validationErrors = {
        ...state.validationErrors,
        [field]: getTableDialogNumericFieldError(state, field),
    };

    $tableDialog.set({
        ...state,
        validationErrors,
    });

    return !validationErrors[field];
};

export const validateTableDialog = (): boolean => {
    const state = $tableDialog.get();
    const validationErrors = getTableDialogValidationErrors(state);

    $tableDialog.set({
        ...state,
        validationErrors,
    });

    return !validationErrors.rows && !validationErrors.cols;
};

export const submitTableDialog = (): void => {
    const {dialog, rows, cols, headers, caption} = $tableDialog.get();

    if (!validateTableDialog() || !dialog) {
        return;
    }

    setDialogValue(dialog, 'info', 'txtRows', rows);
    setDialogValue(dialog, 'info', 'txtCols', cols);
    setDialogValue(dialog, 'info', 'selHeaders', headers);
    setDialogValue(dialog, 'info', 'txtCaption', caption);
    dialog.getButton('ok').click();
    closeTableDialog();
};

export const finalizeTableDialogClose = (): void => {
    const {dialog, editor} = $tableDialog.get();

    restoreOriginalDialogVisibility(dialog);
    dialog?.hide();

    if (editor && !editor['destroyed']) {
        editor.focus();
    }

    resetTableDialog();
};
