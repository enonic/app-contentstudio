import {type SearchOptionsData} from '../data/options';
import {type Editor, type Highlight, type SearchNode} from '../types';
import {HIGHLIGHT_CLASS} from '../view/markup';

type Range = CKEDITOR.dom.range;

const isTextNode = (node: CKEDITOR.dom.node): node is CKEDITOR.dom.text => node.type === CKEDITOR.NODE_TEXT;
const isElementNode = (node: CKEDITOR.dom.node): node is CKEDITOR.dom.element => node.type === CKEDITOR.NODE_ELEMENT;

export function findAndHighlight(node: SearchNode, options: SearchOptionsData, editor: Editor): Highlight[] {
    const highlights: Highlight[] = [];
    findAndHighlightRecursively(node, options, editor, highlights);
    return highlights;
}

function findAndHighlightRecursively(node: SearchNode, options: SearchOptionsData, editor: Editor, highlights: Highlight[]) {
    if (isTextNode(node)) {
        highlightNode(node, options, editor, highlights);
    } else if (isElementNode(node)) {
        for (let child of node.getChildren().toArray()) {
            findAndHighlightRecursively(child, options, editor, highlights);
        }
    }
}

function highlightNode(node: SearchNode, options: SearchOptionsData, editor: Editor, highlights: Highlight[]) {
    const nodeValue = node.$.nodeValue;
    const flags = options.matchCase ? 'g' : 'gi';
    const text = options.wholeWords ? `\\b${escapeRegExp(options.term)}\\b` : escapeRegExp(options.term);
    const regexp = RegExp(text, flags);

    const ranges: Range[] = [];

    let match = regexp.exec(nodeValue);
    while (match) {
        const range = editor.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + options.term.length);
        ranges.push(range);
        match = regexp.exec(nodeValue);
    }

    // Start from last range to avoid changing indexes of previous ranges
    [...ranges].reverse().forEach(range => {
        highlight(range, editor);
    });

    ranges.forEach(range => {
        highlights.push(range.getEnclosedNode());
    });
}

function escapeRegExp(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function highlight(range: CKEDITOR.dom.range, editor: Editor): void {
    const style = new CKEDITOR.style({
        element: 'span',
        attributes: {'class': HIGHLIGHT_CLASS}
    }, {});
    style.applyToRange(range, editor);
}
