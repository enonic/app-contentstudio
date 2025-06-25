type ImageUrlParams = {
    size?: number | null;
    crop?: boolean | null;
};

function trimUrlParams(url: string): string {
    const index = url.lastIndexOf('?');
    return index >= 0 ? url.substring(0, index) : url;
}

function encodeUrlParams(params: Record<string, unknown>): string {
    const entries = Object.entries(params).filter(([, value]) => value != null);
    return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
}

export function createImageUrl(url: string, params: ImageUrlParams): string {
return `${trimUrlParams(url)}?${encodeUrlParams(params)}`;
}
