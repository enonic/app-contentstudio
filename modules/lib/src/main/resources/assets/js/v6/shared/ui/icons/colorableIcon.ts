/** Set by the server on SVG icons painted only with `currentColor`. */
const COLORABLE_PARAM = 'colorable';

export function isColorableIconUrl(url: string): boolean {
    const queryIndex = url.indexOf('?');
    return queryIndex >= 0 && new URLSearchParams(url.substring(queryIndex + 1)).get(COLORABLE_PARAM) === 'true';
}
