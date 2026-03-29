import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import type {TableQuicktablePopupParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import {
    type CkEditorBookmarks,
    captureEditorBookmarks,
    clamp,
    getTriggerButtonId,
    getTriggerElement,
    restoreEditorSelectionSafe,
} from './ckeditorDialogUtils';

type TableQuicktablePopupStore = {
    open: boolean;
    gridRows: number;
    gridCols: number;
    previewRows: number;
    previewCols: number;
    previewSize: string;
    previewBorder: string;
    previewBackground: string;
    tableWidth?: string;
    tableClass: string;
    tableStyles?: Record<string, string>;
    tableBorder?: string;
    cellPadding?: string;
    cellSpacing?: string;
    tableLabel: string;
    moreLabel: string;
    triggerButtonId?: string;
    editor?: CKEDITOR.editor;
    bookmarks?: CkEditorBookmarks;
};

type CloseTableQuicktablePopupOptions = {
    focusTrigger?: boolean;
};

const DEFAULT_GRID_ROWS = 10;
const DEFAULT_GRID_COLS = 10;
const DEFAULT_TABLE_WIDTH = '500px';
const DEFAULT_TABLE_BORDER = '1';
const DEFAULT_CELL_PADDING = '1';
const DEFAULT_CELL_SPACING = '1';
const DEFAULT_PREVIEW_SIZE = '14px';
const DEFAULT_PREVIEW_BORDER = '1px solid #aaa';
const DEFAULT_PREVIEW_BACKGROUND = '#e5e5e5';

const initialState: TableQuicktablePopupStore = {
    open: false,
    gridRows: DEFAULT_GRID_ROWS,
    gridCols: DEFAULT_GRID_COLS,
    previewRows: 1,
    previewCols: 1,
    previewSize: DEFAULT_PREVIEW_SIZE,
    previewBorder: DEFAULT_PREVIEW_BORDER,
    previewBackground: DEFAULT_PREVIEW_BACKGROUND,
    tableWidth: undefined,
    tableClass: '',
    tableStyles: undefined,
    tableBorder: DEFAULT_TABLE_BORDER,
    cellPadding: DEFAULT_CELL_PADDING,
    cellSpacing: DEFAULT_CELL_SPACING,
    tableLabel: 'Table',
    moreLabel: i18n('dialog.table.more'),
    triggerButtonId: undefined,
    editor: undefined,
    bookmarks: undefined,
};

export const $tableQuicktablePopup = map<TableQuicktablePopupStore>(structuredClone(initialState));

const resetTableQuicktablePopup = (): void => {
    $tableQuicktablePopup.set(structuredClone(initialState));
};

const getPositiveNumberConfig = (value: unknown, fallback: number): number => {
    const parsedValue = Number.parseInt(String(value ?? ''), 10);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const getOptionalStringConfig = (value: unknown, fallback: string): string | undefined => {
    if (value === null) {
        return undefined;
    }

    if (typeof value === 'string' && value.length > 0) {
        return value;
    }

    if (typeof value === 'number') {
        return String(value);
    }

    return fallback;
};

const getOptionalStyleConfig = (value: unknown): Record<string, string> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    return Object.fromEntries(
        Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
};

export const getTableQuicktableTriggerElement = (
    triggerButtonId: string | undefined,
    editor: CKEDITOR.editor | undefined,
): HTMLElement | null => {
    return getTriggerElement(triggerButtonId, editor, '.cke_button__table');
};

const focusTriggerButton = (state: TableQuicktablePopupStore): void => {
    getTableQuicktableTriggerElement(state.triggerButtonId, state.editor)?.focus();
};

const createTableElement = (editor: CKEDITOR.editor, tagName: string): CKEDITOR.dom.element => {
    return new CKEDITOR.dom.element(tagName, editor.document);
};

const insertQuicktable = (
    editor: CKEDITOR.editor,
    state: TableQuicktablePopupStore,
    rows: number,
    cols: number,
): void => {
    const table = createTableElement(editor, 'table');
    const tableBody = table.append(createTableElement(editor, 'tbody')) as CKEDITOR.dom.element;

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
        const row = tableBody.append(createTableElement(editor, 'tr')) as CKEDITOR.dom.element;

        for (let colIndex = 0; colIndex < cols; colIndex += 1) {
            const cell = row.append(createTableElement(editor, 'td')) as CKEDITOR.dom.element;
            cell.appendBogus(false);
        }
    }

    if (state.cellPadding) {
        table.setAttribute('cellpadding', state.cellPadding);
    }

    if (state.cellSpacing) {
        table.setAttribute('cellspacing', state.cellSpacing);
    }

    if (state.tableBorder) {
        table.setAttribute('border', state.tableBorder);
    }

    if (state.tableClass) {
        table.setAttribute('class', state.tableClass);
    }

    if (state.tableStyles) {
        table.setStyles(state.tableStyles);
    }

    if (state.tableWidth) {
        table.setStyle('width', state.tableWidth);
    }

    editor.insertElement(table);
    editor.fire('removeFormatCleanup', table);
};

const getTableLabel = (editor: CKEDITOR.editor): string => {
    return editor.lang.table?.toolbar || 'Table';
};

const getMoreLabel = (editor: CKEDITOR.editor): string => {
    const quicktableLang = editor.lang as {quicktable?: {more?: string}};

    return quicktableLang.quicktable?.more || i18n('dialog.table.more');
};

export const openTableQuicktablePopup = ({editor}: TableQuicktablePopupParams): void => {
    const state = $tableQuicktablePopup.get();
    const triggerButtonId = getTriggerButtonId(editor, 'Table');

    if (state.open && state.editor === editor && state.triggerButtonId === triggerButtonId) {
        resetTableQuicktablePopup();
        return;
    }

    $tableQuicktablePopup.set({
        ...structuredClone(initialState),
        open: true,
        gridRows: getPositiveNumberConfig(editor.config['qtRows'], DEFAULT_GRID_ROWS),
        gridCols: getPositiveNumberConfig(editor.config['qtColumns'], DEFAULT_GRID_COLS),
        previewSize: getOptionalStringConfig(editor.config['qtPreviewSize'], DEFAULT_PREVIEW_SIZE) ?? DEFAULT_PREVIEW_SIZE,
        previewBorder: getOptionalStringConfig(editor.config['qtPreviewBorder'], DEFAULT_PREVIEW_BORDER) ?? DEFAULT_PREVIEW_BORDER,
        previewBackground: getOptionalStringConfig(editor.config['qtPreviewBackground'], DEFAULT_PREVIEW_BACKGROUND) ?? DEFAULT_PREVIEW_BACKGROUND,
        tableWidth: getOptionalStringConfig(editor.config['qtWidth'], DEFAULT_TABLE_WIDTH),
        tableClass: getOptionalStringConfig(editor.config['qtClass'], '') ?? '',
        tableStyles: getOptionalStyleConfig(editor.config['qtStyle']),
        tableBorder: getOptionalStringConfig(editor.config['qtBorder'], DEFAULT_TABLE_BORDER),
        cellPadding: getOptionalStringConfig(editor.config['qtCellPadding'], DEFAULT_CELL_PADDING),
        cellSpacing: getOptionalStringConfig(editor.config['qtCellSpacing'], DEFAULT_CELL_SPACING),
        tableLabel: getTableLabel(editor),
        moreLabel: getMoreLabel(editor),
        triggerButtonId,
        editor,
        bookmarks: captureEditorBookmarks(editor),
    });
};

export const closeTableQuicktablePopup = ({focusTrigger = false}: CloseTableQuicktablePopupOptions = {}): void => {
    const state = $tableQuicktablePopup.get();

    if (!state.open) {
        return;
    }

    if (focusTrigger) {
        focusTriggerButton(state);
    }

    resetTableQuicktablePopup();
};

export const setTableQuicktablePreview = (rows: number, cols: number): void => {
    const state = $tableQuicktablePopup.get();

    if (!state.open) {
        return;
    }

    $tableQuicktablePopup.set({
        ...state,
        previewRows: clamp(rows, 1, state.gridRows),
        previewCols: clamp(cols, 1, state.gridCols),
    });
};

export const submitTableQuicktablePopup = (rows: number, cols: number): void => {
    const state = $tableQuicktablePopup.get();
    const {editor, bookmarks} = state;

    if (!editor || editor['destroyed']) {
        resetTableQuicktablePopup();
        return;
    }

    const nextRows = clamp(rows, 1, state.gridRows);
    const nextCols = clamp(cols, 1, state.gridCols);

    editor.focus();
    restoreEditorSelectionSafe(editor, bookmarks);
    editor.fire('saveSnapshot');
    insertQuicktable(editor, state, nextRows, nextCols);

    setTimeout(() => {
        if (!editor['destroyed']) {
            editor.fire('saveSnapshot');
        }
    }, 0);

    resetTableQuicktablePopup();
};

export const openTableQuicktableDialog = (): void => {
    const state = $tableQuicktablePopup.get();
    const {editor, bookmarks} = state;

    if (!editor || editor['destroyed']) {
        resetTableQuicktablePopup();
        return;
    }

    editor.focus();
    restoreEditorSelectionSafe(editor, bookmarks);
    resetTableQuicktablePopup();
    editor.openDialog('table', undefined);
};
