import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Highlight} from '../types';

export class SearchResult {

    private total: number;

    private current: number;

    private highlights: Highlight[];

    private replaced: boolean;

    constructor() {
        this.updateHighlights([]);
    }

    updateHighlights(highlights: Highlight[]): void {
        this.updateResult(highlights.length, 0, highlights);
    }

    removeHighlight(index: number): void {
        if (index < 0 || index >= this.total) {
            return;
        }
        this.highlights.splice(index, 1);
        this.total -= 1;
        if (this.current >= this.total) {
            this.current = this.total - 1;
        }
    }

    selectHighlight(index: number): Highlight | undefined {
        if (index < 0 || index >= this.total) {
            return undefined;
        }
        this.current = index;

        return this.getCurrentHighlight();
    }

    hasHighlights(): boolean {
        return this.highlights.length > 0;
    }

    getCurrentIndex(): number {
        return this.current;
    }

    getCurrentHighlight(): Highlight {
        return this.highlights[this.current];
    }

    setReplaced(replaced: boolean): void {
        this.replaced = replaced;
    }

    isFirstHighlighted(): boolean {
        return this.total > 0 && this.current === 0;
    }

    isLastHighlighted(): boolean {
        return this.total > 0 && this.current === this.total - 1;
    }

    createResultText(): string {
        if (this.total === 0) {
            return i18n('dialog.search.result.noResults');
        }

        if (this.replaced) {
            return i18n('dialog.search.result.replaced', this.total);
        }

        return i18n('dialog.search.result.entries', this.current + 1, this.total);
    }

    private updateResult(total: number, current: number, highlights: Highlight[]): void {
        this.total = total;
        this.current = current;
        this.highlights = highlights;
        this.replaced = false;
    }
}
