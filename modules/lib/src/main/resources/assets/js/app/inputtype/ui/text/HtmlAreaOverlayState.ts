import {$anchorDialog} from '../../../../v6/features/store/dialogs/anchorDialog.store';
import {$bulletedListDialog} from '../../../../v6/features/store/dialogs/bulletedListDialog.store';
import {$codeDialog} from '../../../../v6/features/store/dialogs/codeDialog.store';
import {$fullscreenDialog} from '../../../../v6/features/store/dialogs/fullscreenDialog.store';
import {$searchPopup} from '../../../../v6/features/store/dialogs/searchPopup.store';
import {$specialCharDialog} from '../../../../v6/features/store/dialogs/specialCharDialog.store';
import {$tableDialog} from '../../../../v6/features/store/dialogs/tableDialog.store';
import {$tableQuicktablePopup} from '../../../../v6/features/store/dialogs/tableQuicktablePopup.store';

const HTMLAREA_OVERLAY_SELECTOR = [
    '[data-component="AnchorDialog"]',
    '[data-component="BulletedListDialog"]',
    '[data-component="CodeDialog"]',
    '[data-component="FullscreenDialog"]',
    '[data-component="SearchPopup"]',
    '[data-component="SpecialCharDialog"]',
    '[data-component="TableDialog"]',
    '[data-component="TableQuicktablePopup"]',
    '.html-area-modal-dialog',
].join(', ');

interface HtmlAreaDialogState {
    open: boolean;
    editor?: CKEDITOR.editor;
}

let suppressBlurUntil = 0;
let suppressBlurEditorName: string | undefined;

const now = (): number => Date.now();

const getEditorName = (editor: CKEDITOR.editor | undefined): string | undefined => editor?.name;

const toElement = (target: EventTarget | null | undefined): Element | null => {
    if (!(target instanceof Node)) {
        return null;
    }

    return target.nodeType === Node.ELEMENT_NODE ? target as Element : target.parentElement;
};

const isSameEditor = (editor: CKEDITOR.editor | undefined, other: CKEDITOR.editor | undefined): boolean => {
    const editorName = getEditorName(editor);
    const otherEditorName = getEditorName(other);

    return !!editorName && !!otherEditorName && editorName === otherEditorName;
};

const isMatchingDialogState = (
    state: HtmlAreaDialogState,
    editor: CKEDITOR.editor | undefined,
): boolean => {
    if (!state.open) {
        return false;
    }

    if (!editor) {
        return true;
    }

    return isSameEditor(state.editor, editor);
};

export const suppressHtmlAreaBlur = (editor?: CKEDITOR.editor, duration = 300): void => {
    suppressBlurUntil = Math.max(suppressBlurUntil, now() + duration);
    suppressBlurEditorName = getEditorName(editor);
};

export const isHtmlAreaOverlayOpen = (editor?: CKEDITOR.editor): boolean => {
    return isMatchingDialogState($anchorDialog.get(), editor) ||
        isMatchingDialogState($bulletedListDialog.get(), editor) ||
        isMatchingDialogState($codeDialog.get(), editor) ||
        isMatchingDialogState($fullscreenDialog.get(), editor) ||
        isMatchingDialogState($searchPopup.get(), editor) ||
        isMatchingDialogState($specialCharDialog.get(), editor) ||
        isMatchingDialogState($tableDialog.get(), editor) ||
        isMatchingDialogState($tableQuicktablePopup.get(), editor) ||
        !!document.querySelector('.html-area-modal-dialog');
};

export const isWithinHtmlAreaOverlay = (target: EventTarget | null | undefined): boolean => {
    return !!toElement(target)?.closest(HTMLAREA_OVERLAY_SELECTOR);
};

export const shouldIgnoreHtmlAreaBlur = (
    editor?: CKEDITOR.editor,
    target: EventTarget | null | undefined = document.activeElement,
): boolean => {
    if (now() < suppressBlurUntil && (!suppressBlurEditorName || suppressBlurEditorName === getEditorName(editor))) {
        return true;
    }

    if (!isHtmlAreaOverlayOpen(editor)) {
        return false;
    }

    return isWithinHtmlAreaOverlay(target) || isWithinHtmlAreaOverlay(document.activeElement);
};
