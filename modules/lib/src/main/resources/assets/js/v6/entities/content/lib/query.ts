export const QUERY_FIELD = {
    DISPLAY_NAME: 'displayName',
    NAME: '_name',
    ALL: '_alltext',
    PATH: '_path',
    SCORE: '_score',
    CREATED_TIME: 'createdTime',
    MODIFIED_TIME: 'modifiedTime',
    MANUAL_ORDER_VALUE: '_manualOrderValue',
    PUBLISH_FIRST: 'publish.first',
} as const;

export type OrderDirection = 'ASC' | 'DESC';

export type OrderField = { field: string; direction: OrderDirection };

export const DEFAULT_ORDER: OrderField[] = [
    { field: QUERY_FIELD.SCORE, direction: 'DESC' },
    { field: QUERY_FIELD.MODIFIED_TIME, direction: 'DESC' },
];

const CONTENT_ROOT = '/content';

// ! A value with a single quote is double-quoted and not escaped, as lib-admin-ui's ValueExpr did.
export function quote(value: string): string {
    return value.includes("'") ? `"${value}"` : `'${value}'`;
}

// ! `+-=` is a character range in the original regex, so `,` `.` `/` digits and `;` are escaped too.
// ! Kept verbatim: the server has only ever seen search strings escaped this way.
export function escapeSearchString(value: string): string {
    return value.replace(/((\&\&)|(\|\|)|[+-=><!(){}\[\]^"~*?:\\/])/g, '\\$1');
}

export function weightedField(name: string, weight?: number): string {
    return weight ? `${name}^${weight}` : name;
}

export function and(left: string, right: string): string {
    return `(${left} AND ${right})`;
}

export function or(left: string, right: string): string {
    return `(${left} OR ${right})`;
}

export function like(field: string, value: string): string {
    return `${field} LIKE ${quote(value)}`;
}

export function pathMatch(path: string): string {
    return `pathMatch(${quote(QUERY_FIELD.PATH)}, ${quote(CONTENT_ROOT + path)})`;
}

export function fulltextSearch(fields: string[], searchString: string): string {
    const args = [quote(fields.join(',')), quote(escapeSearchString(searchString)), quote('AND')].join(', ');
    return or(`fulltext(${args})`, `ngram(${args})`);
}

export function orderBy(order: OrderField[]): string {
    return order.map(({ field, direction }) => `${field} ${direction}`).join(', ');
}

export function query(constraint: string, order: OrderField[] = []): string {
    return order.length > 0 ? `${constraint} ORDER BY ${orderBy(order)}` : constraint;
}
