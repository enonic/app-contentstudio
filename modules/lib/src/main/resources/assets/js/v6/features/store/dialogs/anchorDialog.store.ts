import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {type AnchorDialogParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';

type CkEditorBookmarks = ReturnType<CKEDITOR.dom.selection['createBookmarks2']>;
type CkEditorElement = CKEDITOR.dom.element;
type CkEditorRange = CKEDITOR.dom.range;
type EditorWithFakeElement = CKEDITOR.editor & {
    createFakeElement: (
        realElement: CkEditorElement,
        className: string,
        realElementType: string,
        isResizable?: boolean,
    ) => CkEditorElement;
};
type AnchorStyle = {
    type: string | number;
    applyToRange: (range: CkEditorRange) => void;
};
type LinkPlugin = {
    getSelectedLink: (editor: CKEDITOR.editor, returnMultiple?: boolean) => CkEditorElement | CkEditorElement[] | null;
    tryRestoreFakeAnchor: (editor: CKEDITOR.editor, element?: CkEditorElement) => CkEditorElement | undefined;
};

type AnchorDialogStore = {
    open: boolean;
    name: string;
    validationError?: string;
    editor?: CKEDITOR.editor;
    bookmarks?: CkEditorBookmarks;
};

const ANCHOR_NAME_REGEX = /^\w[\w.]*$/;

const initialState: AnchorDialogStore = {
    open: false,
    name: '',
    validationError: undefined,
    editor: undefined,
    bookmarks: undefined,
};

export const $anchorDialog = map<AnchorDialogStore>(structuredClone(initialState));

const getLinkPlugin = (): LinkPlugin | undefined => {
    return CKEDITOR.plugins.link as unknown as LinkPlugin | undefined;
};

const getAnchorDialogValidationError = (name: string): string | undefined => {
    if (!name.trim()) {
        return i18n('field.value.required');
    }

    if (!ANCHOR_NAME_REGEX.test(name)) {
        return i18n('field.value.invalid');
    }

    return undefined;
};

const createFakeAnchor = (editor: CKEDITOR.editor, attributes: Record<string, string>): CkEditorElement => {
    const anchorElement = editor.document.createElement('a');
    const createFakeElement = editor.createFakeElement as unknown as EditorWithFakeElement['createFakeElement'];

    anchorElement.setAttributes(attributes);

    return createFakeElement.call(editor, anchorElement, 'cke_anchor', 'anchor', false);
};

const getAnchorModel = (editor: CKEDITOR.editor): CkEditorElement | undefined => {
    const selection = editor.getSelection();
    const range = selection?.getRanges()[0];
    let element = selection?.getSelectedElement();

    if (!selection || !range) {
        return undefined;
    }

    range.shrink(CKEDITOR.SHRINK_ELEMENT);

    const enclosedNode = range.getEnclosedNode();

    if (enclosedNode?.type === CKEDITOR.NODE_TEXT) {
        element = enclosedNode.getParent();
    } else if (enclosedNode?.type === CKEDITOR.NODE_ELEMENT) {
        element = enclosedNode as CkEditorElement;
    }

    if (element && !element.is('a')) {
        element = (element.getAscendant('a') as CkEditorElement) || element;
    }

    return element?.type === CKEDITOR.NODE_ELEMENT &&
           (element.data('cke-real-element-type') === 'anchor' || element.is('a'))
        ? element
        : undefined;
};

const restoreEditorSelection = (
    editor: CKEDITOR.editor,
    bookmarks?: CkEditorBookmarks,
): void => {
    if (!bookmarks) {
        return;
    }

    const selection = editor.getSelection();

    if (selection) {
        selection.selectBookmarks(bookmarks);
    }
};

const getCurrentAnchor = (editor: CKEDITOR.editor): CkEditorElement | undefined => {
    const model = getAnchorModel(editor);
    const linkPlugin = getLinkPlugin();

    if (!model) {
        return undefined;
    }

    if (model.data('cke-realelement')) {
        return linkPlugin?.tryRestoreFakeAnchor(editor, model);
    }

    const selectedLink = linkPlugin?.getSelectedLink(editor);

    if (selectedLink && !Array.isArray(selectedLink)) {
        return selectedLink;
    }

    return model.is('a') ? model : undefined;
};

const getCurrentAnchorName = (editor: CKEDITOR.editor): string => {
    const anchor = getCurrentAnchor(editor);

    return anchor?.data('cke-saved-name') || anchor?.getAttribute('name') || '';
};

const getSelectedRange = (editor: CKEDITOR.editor): CkEditorRange | undefined => {
    return editor.getSelection()?.getRanges()[0];
};

const applyAnchorToRange = (attributes: Record<string, string>, range: CkEditorRange): void => {
    const enlargedRange = range.clone();

    enlargedRange.enlarge(CKEDITOR.ENLARGE_ELEMENT);

    const walker = new CKEDITOR.dom.walker(enlargedRange);
    let currentNode = enlargedRange.collapsed ? enlargedRange.startContainer : walker.next();
    const bookmark = range.createBookmark();

    while (currentNode) {
        if (currentNode.type === CKEDITOR.NODE_ELEMENT &&
            (currentNode as CkEditorElement).getAttribute('data-cke-saved-name')) {
            currentNode.remove(true);
            walker.reset();
        }

        currentNode = walker.next();
    }

    range.moveToBookmark(bookmark);

    const style = new CKEDITOR.style({element: 'a', attributes}, null) as unknown as AnchorStyle;

    style.type = CKEDITOR.STYLE_INLINE;
    style.applyToRange(range);
};

const insertOrUpdateAnchor = (editor: CKEDITOR.editor, name: string): void => {
    const model = getAnchorModel(editor);
    const attributes = {
        id: name,
        name,
        'data-cke-saved-name': name,
    };

    if (model) {
        if (model.data('cke-realelement')) {
            createFakeAnchor(editor, attributes).replace(model);
        } else {
            model.setAttributes(attributes);
        }

        return;
    }

    const range = getSelectedRange(editor);

    if (!range) {
        return;
    }

    if (range.collapsed) {
        range.insertNode(createFakeAnchor(editor, attributes));
        return;
    }

    applyAnchorToRange(attributes, range);
};

const resetAnchorDialog = (): void => {
    $anchorDialog.set(structuredClone(initialState));
};

export const openAnchorDialog = ({editor, bookmarks}: AnchorDialogParams): void => {
    $anchorDialog.set({
        ...structuredClone(initialState),
        open: true,
        editor,
        name: getCurrentAnchorName(editor),
        bookmarks,
    });
};

export const closeAnchorDialog = (): void => {
    const state = $anchorDialog.get();

    if (!state.open) {
        return;
    }

    $anchorDialog.set({
        ...state,
        open: false,
    });
};

export const setAnchorDialogName = (name: string): void => {
    const state = $anchorDialog.get();

    $anchorDialog.set({
        ...state,
        name,
        validationError: state.validationError ? getAnchorDialogValidationError(name) : state.validationError,
    });
};

export const validateAnchorDialog = (): boolean => {
    const state = $anchorDialog.get();
    const validationError = getAnchorDialogValidationError(state.name);

    $anchorDialog.set({
        ...state,
        validationError,
    });

    return !validationError;
};

export const submitAnchorDialog = (): void => {
    if (!validateAnchorDialog()) {
        return;
    }

    const {editor, bookmarks, name} = $anchorDialog.get();

    if (!editor || editor['destroyed']) {
        resetAnchorDialog();
        return;
    }

    editor.focus();
    restoreEditorSelection(editor, bookmarks);
    editor.fire('saveSnapshot');
    insertOrUpdateAnchor(editor, name.trim());
    setTimeout(() => {
        if (!editor['destroyed']) {
            editor.fire('saveSnapshot');
        }
    }, 0);
    closeAnchorDialog();
};

export const finalizeAnchorDialogClose = (): void => {
    const {editor} = $anchorDialog.get();

    if (editor && !editor['destroyed']) {
        editor.focus();
    }

    resetAnchorDialog();
};
