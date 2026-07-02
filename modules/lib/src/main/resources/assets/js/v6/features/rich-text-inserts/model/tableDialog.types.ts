export type TableDialogMode = 'table' | 'tableProperties';

export type TableDialogHeaderValue = '' | 'row' | 'col' | 'both';

export type TableDialogValidationErrors = {
    rows?: string;
    cols?: string;
};

export type TableDialogNumericField = keyof TableDialogValidationErrors;
