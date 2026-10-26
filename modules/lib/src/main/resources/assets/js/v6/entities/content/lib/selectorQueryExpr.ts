import {
    DEFAULT_ORDER,
    QUERY_FIELD,
    and,
    escapeSearchString,
    fulltextSearch,
    like,
    or,
    pathMatch,
    query,
    weightedField,
} from './query';

const MAX_PATH_LENGTH = 80;

const SELECTOR_FIELDS = [
    weightedField(QUERY_FIELD.DISPLAY_NAME, 5),
    weightedField(QUERY_FIELD.NAME, 3),
    weightedField(QUERY_FIELD.ALL),
];

function pathSearchString(searchString: string): string {
    const withoutRoot = searchString.startsWith('/') ? searchString.slice(1) : searchString;
    return `/content/*${withoutRoot.trim().replace(/\s+/g, '*')}*`;
}

/**
 * Content-selector search: fulltext over the selector fields, or a wildcard path match on the
 * search string, scoped to the context path. Serialized identically to the legacy
 * ContentSelectorRequest. Used by: entities/content/api/selectorQuery.
 */
export function buildSelectorSearchExpr(searchString: string, path: string): string {
    const text = fulltextSearch(SELECTOR_FIELDS, searchString);
    const scope = pathMatch(path);

    if (searchString.length > MAX_PATH_LENGTH) {
        return query(and(text, scope), DEFAULT_ORDER);
    }

    const byPath = like(QUERY_FIELD.PATH, pathSearchString(escapeSearchString(searchString)));
    return query(and(or(text, byPath), scope), DEFAULT_ORDER);
}
