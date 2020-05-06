export interface TagSuggester {

    /**
     * Returns an array of suggestions based on given value.
     */
    suggest(value: string): Q.Promise<string[]>;

}
