import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';

type ImageUrlParams = {
    size?: number | null;
    crop?: boolean | null;
};

export function createImageUrl(url: string, params: ImageUrlParams): string {
    return `${UriHelper.trimUrlParams(url)}?${UriHelper.encodeUrlParams(params)}`;
}
