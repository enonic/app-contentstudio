type ImageUrlParams = {
    size?: number | null;
    crop?: boolean | null;
};

export function createImageUrl(url: string, params: ImageUrlParams): string {
    const queryIndex = url.indexOf('?');
    const base = queryIndex >= 0 ? url.substring(0, queryIndex) : url;

    // Preserve the existing query (e.g. the server's `ts` cache-buster) so a re-uploaded
    // icon yields a distinct, non-stale src, while overriding our own params by key.
    const search = new URLSearchParams(queryIndex >= 0 ? url.substring(queryIndex + 1) : '');
    for (const [key, value] of Object.entries(params)) {
        if (value != null) search.set(key, String(value));
    }

    return `${base}?${search.toString()}`;
}
