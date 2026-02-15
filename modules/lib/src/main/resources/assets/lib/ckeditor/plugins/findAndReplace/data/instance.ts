import {findAndHighlight} from '../actions/find';
import {replace, replaceAll} from '../actions/replace';
import {type Editor, type Highlight} from '../types';
import {Classes, SELECTION_CLASS} from '../view/markup';
import {fixPanelPosition} from '../view/position';
import {SearchOptions} from './options';
import {SearchResult} from './result';

export enum Mode {
    FIND = 'fnr-mode_find',
    REPLACE = 'fnr-mode_replace',
}

export interface InstanceConfig {
    id: string;
    editor: Editor;
    panel: CKEDITOR.dom.element;
    block: CKEDITOR.dom.element;
}

export class Instance {

    private readonly id: string;

    private readonly editor: Editor;

    private readonly panel: CKEDITOR.dom.element;

    private readonly block: CKEDITOR.dom.element;

    private readonly findInput: CKEDITOR.dom.element;

    private readonly replaceInput: CKEDITOR.dom.element;

    private readonly matchCaseCheckbox: CKEDITOR.dom.element;

    private readonly wholeWordsCheckbox: CKEDITOR.dom.element;

    private readonly prevButton: CKEDITOR.dom.element;

    private readonly nextButton: CKEDITOR.dom.element;

    private readonly replaceButton: CKEDITOR.dom.element;

    private readonly replaceAllButton: CKEDITOR.dom.element;

    private readonly counterElement: HTMLElement;

    private readonly options: SearchOptions;

    private readonly result: SearchResult;

    private mode: Mode;

    constructor(config: InstanceConfig) {
        this.id = config.id;
        this.editor = config.editor;
        this.panel = config.panel;
        this.block = config.block;

        this.options = new SearchOptions();
        this.result = new SearchResult();

        this.findInput = this.findByClass(Classes.FIND);
        this.matchCaseCheckbox = this.findByClass(Classes.MATCH_CASE);
        this.wholeWordsCheckbox = this.findByClass(Classes.WHOLE_WORDS);
        this.prevButton = this.findByClass(Classes.PREV);
        this.nextButton = this.findByClass(Classes.NEXT);

        this.replaceInput = this.findByClass(Classes.REPLACE);
        this.replaceButton = this.findByClass(Classes.ACTION_REPLACE);
        this.replaceAllButton = this.findByClass(Classes.ACTION_REPLACE_ALL);

        this.counterElement = this.findByClass(Classes.COUNTER).$;

        this.initListeners();

        this.updateMode(Mode.FIND);
        this.refreshButtonsState(false);
    }

    search(): void {
        if (!this.options.hasTerm()) {
            this.renderCounter();
            return;
        }
        const rootNode = this.editor._?.editable ?? this.editor.document.getBody();
        const highlights = findAndHighlight(rootNode, this.options.getOptionsData(), this.editor);
        this.updateResult(highlights);
        this.renderCounter(); // render counter in case it won't be rendered later
        this.selectHighlightAndRender(0);

        this.refreshButtonsState();
    }

    selectHighlightAndRender(index: number): void {
        this.editor.getSelection().unlock(true);
        this.result.getCurrentHighlight()?.$.parentElement.classList.remove(SELECTION_CLASS);
        const highlight = this.result.selectHighlight(index);
        if (highlight) {
            highlight.$.parentElement.scrollIntoView({block: 'center'});
            highlight.$.parentElement.classList.add(SELECTION_CLASS);
            this.editor.getSelection().selectElement(highlight as CKEDITOR.dom.element);
            this.renderCounter();
            this.refreshArrowsState();
        }
    }

    removeHighlights(): void {
        this.replaceHighlights();
    }

    updateMode(mode: Mode): void {
        this.panel.$.classList.remove(this.mode);
        this.block.$.classList.remove(this.mode);
        this.mode = mode;
        this.panel.$.classList.add(this.mode);
        this.block.$.classList.add(this.mode);
    }

    prepare(): void {
        fixPanelPosition(this.id, this.panel.$);
    }

    reset(): void {
        this.updateMode(Mode.FIND);

        this.findInput.setValue('');
        this.replaceInput.setValue('');

        (this.matchCaseCheckbox.$ as HTMLInputElement).checked = false;
        (this.wholeWordsCheckbox.$ as HTMLInputElement).checked = false;

        this.refreshButtonsState(false);

        this.removeHighlights();
        this.options.clear();
    }

    private renderCounter(): void {
        this.counterElement.innerHTML = this.result.createResultText();
    }

    private updateResult(highlights: Highlight[]): void {
        this.result.updateHighlights(highlights);

        if (highlights.length === 0) {
            this.editor.getSelection().removeAllRanges();
        }
    }

    private removeHighlightAndRender(index: number) {
        this.result.removeHighlight(index);
        this.renderCounter();
    }

    private selectPreviousHighlight(): void {
        this.selectHighlightAndRender(this.result.getCurrentIndex() - 1);
    }

    private selectNextHighlight(): void {
        this.selectHighlightAndRender(this.result.getCurrentIndex() + 1);
    }

    private replaceHighlights(text?: string): void {
        if (!this.options.hasTerm()) {
            return;
        }

        replaceAll(this.editor, text);

        this.result.setReplaced(true);
        this.renderCounter();

        this.editor.getSelection().removeAllRanges();
        this.editor.document.getBody().$.normalize();
        this.updateResult([]);

        this.refreshButtonsState();
    }

    private replaceCurrentHighlight(text?: string): void {
        const highlight = this.result.getCurrentHighlight();
        const current = this.result.getCurrentIndex();
        if (highlight && this.options.hasTerm()) {
            replace(highlight, text);

            this.removeHighlightAndRender(current);
            // Move to next highlight
            this.selectHighlightAndRender(current);
        }
    }

    private initListeners(): void {
        this.findInput.on('input', () => {
            if (this.findInput.$.offsetParent === null) {
                return;
            }
            this.removeHighlights();
            this.options.setTermOption(this.findInput.getValue() ?? '');
            this.search();
        });

        this.findInput.on('keydown', (e) => {
            if ((e.data.$ as KeyboardEvent).key === 'Enter' && this.hasHighlights()) {
                this.selectNextHighlight();
            }
        });

        this.matchCaseCheckbox.on('input', () => {
            if (this.matchCaseCheckbox.$.offsetParent === null) {
                return;
            }
            this.removeHighlights();
            this.options.setMatchCaseOption((this.matchCaseCheckbox.$ as HTMLInputElement).checked);
            this.search();
        });

        this.wholeWordsCheckbox.on('input', () => {
            if (this.wholeWordsCheckbox.$.offsetParent === null) {
                return;
            }
            this.removeHighlights();
            this.options.setWholeWordsOption((this.wholeWordsCheckbox.$ as HTMLInputElement).checked);
            this.search();
        });

        this.prevButton.on('click', () => {
            this.selectPreviousHighlight();
        });

        this.nextButton.on('click', () => {
            this.selectNextHighlight();
        });

        this.replaceButton.on('click', () => {
            this.replaceCurrentHighlight(this.replaceInput.getValue() ?? '');
        });

        this.replaceAllButton.on('click', () => {
            this.replaceHighlights(this.replaceInput.getValue() ?? '');
        });

        this.findByClass(Classes.SWITCH).on('click', () => {
            this.updateMode(this.mode === Mode.FIND ? Mode.REPLACE : Mode.FIND);
        });
    }

    private findByClass(id: string): CKEDITOR.dom.element {
        return this.block.findOne(`.${id}`);
    }

    private hasHighlights(): boolean {
        return this.result.hasHighlights();
    }

    private refreshArrowsState(enabled?: boolean): void {
        (this.prevButton.$ as HTMLButtonElement).disabled =
            enabled == null ? !this.result.hasHighlights() || this.result.isFirstHighlighted() : !enabled;
        (this.nextButton.$ as HTMLButtonElement).disabled =
            enabled == null ? !this.result.hasHighlights() || this.result.isLastHighlighted() : !enabled;
    }

    private refreshButtonsState(enabled?: boolean): void {
        this.refreshArrowsState(enabled);
        (this.replaceButton.$ as HTMLButtonElement).disabled = enabled == null ? !this.hasHighlights() : !enabled;
        (this.replaceAllButton.$ as HTMLButtonElement).disabled = enabled == null ? !this.hasHighlights() : !enabled;
    }
}