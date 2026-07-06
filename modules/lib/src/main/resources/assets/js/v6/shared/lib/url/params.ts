import { isBlank } from '../format/isBlank';

/**
 * Query-string helpers reproducing the semantics of the legacy lib-admin-ui
 * UriHelper utilities that v6 code relied on.
 */

/**
 * Parse the query portion of a URL into a plain record. Returns an empty object
 * when the URL is blank or has no query string.
 */
export function decodeUrlParams(url: string): Record<string, string> {
    if (isBlank(url)) {
        return {};
    }

    const queryStart = url.indexOf('?');
    const query = queryStart >= 0 ? url.slice(queryStart + 1) : '';
    const params: Record<string, string> = {};

    new URLSearchParams(query).forEach((value, key) => {
        params[key] = value;
    });

    return params;
}

/**
 * Strip the query string (everything from the last `?`) from a URL.
 */
export function trimUrlParams(url: string): string {
    const index = url.lastIndexOf('?');
    return index >= 0 ? url.substring(0, index) : url;
}

/**
 * Append params to a URL, skipping null/undefined values. Uses `?` or `&`
 * depending on whether the URL already carries a query string. When `encode` is
 * false, keys and values are written verbatim (no percent-encoding).
 */
export function appendUrlParams(url: string, params: Record<string, unknown>, encode: boolean = true): string {
    const serialized = encodeUrlParams(params, encode);
    if (serialized === '') {
        return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${serialized}`;
}

function encodeUrlParams(params: Record<string, unknown>, encode: boolean): string {
    const entries = Object.entries(params).filter(([, value]) => value != null);

    if (encode) {
        return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
    }

    return entries.map(([key, value]) => `${key}=${String(value)}`).join('&');
}
