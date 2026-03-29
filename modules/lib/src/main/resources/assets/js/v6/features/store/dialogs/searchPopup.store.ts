import {map} from 'nanostores';
import type {SearchPopupMode, SearchPopupParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import {getTriggerButtonId, getTriggerElement} from './ckeditorDialogUtils';

type SearchHighlight = CKEDITOR.dom.node;
type SearchNode = CKEDITOR.dom.node;

type SearchPopupStore = {
    open: boolean;
    mode: SearchPopupMode;
    findValue: string;
    replaceValue: string;
    matchCase: boolean;
    wholeWords: boolean;
    total: number;
    currentIndex: number;
    replacedCount?: number;
    triggerButtonId?: string;
    editor?: CKEDITOR.editor;
    highlights: SearchHighlight[];
};

type CloseSearchPopupOptions = {
    focusTrigger?: boolean;
};

const HIGHLIGHT_CLASS = 'cke__highlighted_term';
const SELECTION_CLASS = 'cke__selected_term';

const initialState: SearchPopupStore = {
    open: false,
    mode: 'find',
    findValue: '',
    replaceValue: '',
    matchCase: false,
    wholeWords: false,
    total: 0,
    currentIndex: 0,
    replacedCount: undefined,
    triggerButtonId: undefined,
    editor: undefined,
    highlights: [],
};

const cloneInitialState = (): SearchPopupStore => structuredClone(initialState);

export const $searchPopup = map<SearchPopupStore>(cloneInitialState());

const resetSearchPopup = (): void => {
    $searchPopup.set(cloneInitialState());
};

const lockEditorFocus = (editor: CKEDITOR.editor | undefined): void => {
    if (!editor || editor['destroyed']) {
        return;
    }

    editor.focusManager.lock();
};

const unlockEditorFocus = (editor: CKEDITOR.editor | undefined): void => {
    if (!editor || editor['destroyed']) {
        return;
    }

    editor.focusManager.unlock();
};

const hasSearchTerm = (value: string): boolean => value.length > 0;

const isTextNode = (node: SearchNode): node is CKEDITOR.dom.text => node.type === CKEDITOR.NODE_TEXT;

const isElementNode = (node: SearchNode): node is CKEDITOR.dom.element => node.type === CKEDITOR.NODE_ELEMENT;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getHighlightElement = (highlight: SearchHighlight | undefined): CKEDITOR.dom.element | null => {
    if (!highlight) {
        return null;
    }

    if (highlight.type === CKEDITOR.NODE_ELEMENT) {
        const element = highlight as CKEDITOR.dom.element;

        if (element.hasClass(HIGHLIGHT_CLASS)) {
            return element;
        }
    }

    const parent = highlight.getParent();

    return parent?.type === CKEDITOR.NODE_ELEMENT ? parent : null;
};

const clearSelectionMarker = (state: SearchPopupStore): void => {
    getHighlightElement(state.highlights[state.currentIndex])?.$?.classList.remove(SELECTION_CLASS);
};

const clearSearchResults = (
    state: SearchPopupStore,
    overrides: Partial<Pick<SearchPopupStore, 'replacedCount'>> = {},
): SearchPopupStore => ({
    ...state,
    total: 0,
    currentIndex: 0,
    replacedCount: undefined,
    highlights: [],
    ...overrides,
});

const cleanupOpenSearchPopupEditor = (state: SearchPopupStore): void => {
    if (!state.editor || state.editor['destroyed']) {
        return;
    }

    clearSelectionMarker(state);
    removeHighlights(state.editor);
    unlockEditorFocus(state.editor);
};

const removeHighlights = (editor: CKEDITOR.editor, replacementText?: string): void => {
    if (!editor.document) {
        return;
    }

    editor.document.find(`.${HIGHLIGHT_CLASS}`).toArray().forEach((highlight) => {
        const highlightElement = highlight as CKEDITOR.dom.element;

        highlightElement.$.replaceWith(replacementText ?? highlightElement.getText());
    });

    editor.getSelection()?.removeAllRanges();
    editor.document.getBody().$?.normalize();
};

const highlightRange = (range: CKEDITOR.dom.range, editor: CKEDITOR.editor): void => {
    const style = new CKEDITOR.style({
        element: 'span',
        attributes: {'class': HIGHLIGHT_CLASS},
    }, {});

    style.applyToRange(range, editor);
};

const highlightNode = (
    node: SearchNode,
    editor: CKEDITOR.editor,
    term: string,
    matchCase: boolean,
    wholeWords: boolean,
    highlights: SearchHighlight[],
): void => {
    const nodeValue = node.$.nodeValue;
    const flags = matchCase ? 'g' : 'gi';
    const expression = wholeWords ? `\\b${escapeRegExp(term)}\\b` : escapeRegExp(term);
    const regexp = RegExp(expression, flags);
    const ranges: CKEDITOR.dom.range[] = [];

    let match = regexp.exec(nodeValue);

    while (match) {
        const range = editor.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + term.length);
        ranges.push(range);
        match = regexp.exec(nodeValue);
    }

    [...ranges].reverse().forEach((range) => {
        highlightRange(range, editor);
    });

    ranges.forEach((range) => {
        highlights.push(range.getEnclosedNode());
    });
};

const findAndHighlightRecursively = (
    node: SearchNode,
    editor: CKEDITOR.editor,
    term: string,
    matchCase: boolean,
    wholeWords: boolean,
    highlights: SearchHighlight[],
): void => {
    if (isTextNode(node)) {
        highlightNode(node, editor, term, matchCase, wholeWords, highlights);
        return;
    }

    if (!isElementNode(node)) {
        return;
    }

    node.getChildren().toArray().forEach((child) => {
        findAndHighlightRecursively(child, editor, term, matchCase, wholeWords, highlights);
    });
};

const findHighlights = (editor: CKEDITOR.editor, state: SearchPopupStore): SearchHighlight[] => {
    const rootNode = (editor as CKEDITOR.editor & {_: {editable?: CKEDITOR.dom.element}})._?.editable ?? editor.document?.getBody();

    if (!rootNode || !hasSearchTerm(state.findValue)) {
        return [];
    }

    const highlights: SearchHighlight[] = [];

    findAndHighlightRecursively(rootNode, editor, state.findValue, state.matchCase, state.wholeWords, highlights);

    return highlights;
};

const selectHighlight = (state: SearchPopupStore, index: number): SearchPopupStore => {
    const {editor, highlights} = state;

    if (!editor || editor['destroyed'] || highlights.length === 0 || index < 0 || index >= highlights.length) {
        editor?.getSelection()?.removeAllRanges();
        return {
            ...state,
            currentIndex: 0,
        };
    }

    editor.getSelection()?.unlock(true);
    clearSelectionMarker(state);

    const highlight = highlights[index];
    const highlightElement = getHighlightElement(highlight);

    highlightElement?.$?.scrollIntoView({block: 'center'});
    highlightElement?.$?.classList.add(SELECTION_CLASS);

    if (highlightElement) {
        editor.getSelection()?.selectElement(highlightElement);
    }

    return {
        ...state,
        currentIndex: index,
    };
};

const refreshSearchResults = (state: SearchPopupStore): SearchPopupStore => {
    const {editor} = state;

    if (!editor || editor['destroyed']) {
        return structuredClone(initialState);
    }

    clearSelectionMarker(state);
    removeHighlights(editor);

    if (!hasSearchTerm(state.findValue)) {
        return clearSearchResults(state);
    }

    const highlights = findHighlights(editor, state);

    if (highlights.length === 0) {
        editor.getSelection()?.removeAllRanges();

        return clearSearchResults(state);
    }

    return selectHighlight({
        ...state,
        total: highlights.length,
        replacedCount: undefined,
        highlights,
    }, 0);
};

const updateSearchPopup = (patch: Partial<SearchPopupStore>): void => {
    const state = $searchPopup.get();

    if (!state.open) {
        return;
    }

    $searchPopup.set({
        ...state,
        ...patch,
    });
};

const refreshSearchPopup = (
    patch: Partial<Pick<SearchPopupStore, 'findValue' | 'matchCase' | 'wholeWords'>>,
): void => {
    const state = $searchPopup.get();

    if (!state.open) {
        return;
    }

    $searchPopup.set(refreshSearchResults({
        ...state,
        ...patch,
    }));
};

const goToSearchPopupResult = (offset: number): void => {
    const state = $searchPopup.get();
    const nextIndex = state.currentIndex + offset;

    if (!state.open || state.total === 0 || nextIndex < 0 || nextIndex >= state.total) {
        return;
    }

    $searchPopup.set(selectHighlight(state, nextIndex));
};

const applySearchPopupEditorMutation = (editor: CKEDITOR.editor, mutation: () => void): void => {
    editor.fire('saveSnapshot');
    mutation();
    editor.fire('saveSnapshot');
    editor.fire('change');
};

export const getSearchPopupTriggerElement = (
    triggerButtonId: string | undefined,
    editor: CKEDITOR.editor | undefined,
): HTMLElement | null => {
    return getTriggerElement(triggerButtonId, editor, '.cke_button__findandreplace');
};

const focusTriggerButton = (state: SearchPopupStore): void => {
    getSearchPopupTriggerElement(state.triggerButtonId, state.editor)?.focus();
};

export const openSearchPopup = ({editor, mode}: SearchPopupParams): void => {
    const state = $searchPopup.get();
    const triggerButtonId = getTriggerButtonId(editor, 'FindAndReplace');

    if (state.open && state.editor === editor && state.triggerButtonId === triggerButtonId) {
        if (state.mode === mode) {
            closeSearchPopup();
            return;
        }

        updateSearchPopup({mode});
        return;
    }

    if (state.open) {
        cleanupOpenSearchPopupEditor(state);
    }

    lockEditorFocus(editor);

    $searchPopup.set({
        ...cloneInitialState(),
        open: true,
        mode,
        triggerButtonId,
        editor,
    });
};

export const closeSearchPopup = ({focusTrigger = false}: CloseSearchPopupOptions = {}): void => {
    const state = $searchPopup.get();

    if (!state.open) {
        return;
    }

    cleanupOpenSearchPopupEditor(state);

    if (focusTrigger) {
        focusTriggerButton(state);
    }

    resetSearchPopup();
};

export const setSearchPopupMode = (mode: SearchPopupMode): void => {
    const state = $searchPopup.get();

    if (!state.open || state.mode === mode) {
        return;
    }

    updateSearchPopup({
        mode,
        replacedCount: undefined,
    });
};

export const setSearchPopupFindValue = (findValue: string): void => {
    refreshSearchPopup({findValue});
};

export const setSearchPopupReplaceValue = (replaceValue: string): void => {
    updateSearchPopup({replaceValue});
};

export const setSearchPopupMatchCase = (matchCase: boolean): void => {
    refreshSearchPopup({matchCase});
};

export const setSearchPopupWholeWords = (wholeWords: boolean): void => {
    refreshSearchPopup({wholeWords});
};

export const goToPreviousSearchPopupResult = (): void => {
    goToSearchPopupResult(-1);
};

export const goToNextSearchPopupResult = (): void => {
    goToSearchPopupResult(1);
};

export const replaceCurrentSearchPopupResult = (): void => {
    const state = $searchPopup.get();
    const {editor, currentIndex, replaceValue, highlights} = state;

    if (!state.open || !editor || editor['destroyed'] || highlights.length === 0) {
        return;
    }

    const highlightElement = getHighlightElement(highlights[currentIndex]);

    if (!highlightElement) {
        $searchPopup.set(refreshSearchResults(state));
        return;
    }

    clearSelectionMarker(state);
    applySearchPopupEditorMutation(editor, () => {
        highlightElement.$.replaceWith(replaceValue);
    });

    const nextHighlights = highlights.filter((_, index) => index !== currentIndex);

    if (nextHighlights.length === 0) {
        editor.getSelection()?.removeAllRanges();
        $searchPopup.set(clearSearchResults(state));
        return;
    }

    const nextIndex = Math.min(currentIndex, nextHighlights.length - 1);

    $searchPopup.set(selectHighlight({
        ...state,
        total: nextHighlights.length,
        currentIndex: nextIndex,
        replacedCount: undefined,
        highlights: nextHighlights,
    }, nextIndex));
};

export const replaceAllSearchPopupResults = (): void => {
    const state = $searchPopup.get();
    const {editor, replaceValue, total} = state;

    if (!state.open || !editor || editor['destroyed'] || total === 0) {
        return;
    }

    clearSelectionMarker(state);
    applySearchPopupEditorMutation(editor, () => {
        removeHighlights(editor, replaceValue);
    });

    $searchPopup.set(clearSearchResults(state, {replacedCount: total}));
};
