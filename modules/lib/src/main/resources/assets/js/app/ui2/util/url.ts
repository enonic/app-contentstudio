import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {UrlHelper} from '../../util/UrlHelper';

interface ImageUrlParams {
    size?: number | null;
    crop?: boolean | null;
}

export function createImageUrl(url: string, params: ImageUrlParams): string {
    return `${UriHelper.trimUrlParams(url)}?${UriHelper.encodeUrlParams(params)}`;
}

export function resolveProjectIconUrl(projectName: string | undefined | null): string | undefined {
    if (projectName == null) {
        return undefined;
    }

    return `${UrlHelper.getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`;
}
