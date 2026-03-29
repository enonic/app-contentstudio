import {type RefObject, useLayoutEffect} from 'react';

type ElementRef = RefObject<HTMLElement | null>;

/**
 * Registers DOM elements with a CKEditor focusManager so the editor
 * does not lose focus when the user interacts with dialog/popup controls.
 *
 * Automatically removes elements on cleanup or when the editor is destroyed.
 */
export function useCkEditorFocusManager(
    editor: CKEDITOR.editor | undefined,
    refs: (ElementRef | HTMLElement | null)[],
    deps: readonly unknown[] = [],
): void {
    useLayoutEffect(() => {
        if (!editor || editor['destroyed']) {
            return;
        }

        const elements = refs
            .map((ref) => (ref && 'current' in ref ? ref.current : ref))
            .filter((element): element is HTMLElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [editor, ...deps]);
}
