import {type Editor, type Highlight} from '../types';
import {HIGHLIGHT_CLASS} from '../view/markup';

export function replaceAll(editor: Editor, text?: string): void {
    if (!editor.document) {
        return;
    }

    const highlights = editor.document.find(`.${HIGHLIGHT_CLASS}`).toArray();
    for (let highlight of highlights) {
        (highlight.$ as HTMLElement).replaceWith(text ?? (highlight as CKEDITOR.dom.text).getText());
    }

    editor.getSelection().removeAllRanges();
    editor.document.getBody().$.normalize();
}

export function replace(highlight: Highlight, text: string = ''): void {
    highlight.getParent().$.replaceWith(text);
}