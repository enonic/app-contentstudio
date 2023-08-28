export interface SearchOptionsData {
    readonly term: string;
    readonly matchCase: boolean;
    readonly wholeWords: boolean;
}

export class SearchOptions {

    private term: string;

    private matchCase: boolean;

    private wholeWords: boolean;

    constructor() {
        this.term = '';
        this.matchCase = false;
        this.wholeWords = false;
    }

    setTermOption(term: string): void {
        this.term = term;
    }

    hasTerm(): boolean {
        return !!this.term;
    }

    setMatchCaseOption(matchCase: boolean): void {
        this.matchCase = matchCase;
    }

    setWholeWordsOption(wholeWords: boolean): void {
        this.wholeWords = wholeWords;
    }

    getOptionsData(): SearchOptionsData {
        return {
            term: this.term,
            matchCase: this.matchCase,
            wholeWords: this.wholeWords,
        };
    }

    clear(): void {
        this.term = '';
        this.matchCase = false;
        this.wholeWords = false;
    }
}
