import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {UrlHelper} from '../../util/UrlHelper';

interface ImageUrlParams {
    size?: number | null;
    crop?: boolean | null;
}

export interface ProjectIconUrlOptions {
    ts?: number;
}

export function createImageUrl(url: string, params: ImageUrlParams): string {
    return `${UriHelper.trimUrlParams(url)}?${UriHelper.encodeUrlParams(params)}`;
}

export const resolveProjectIconUrl = (projectName?: string): string | undefined =>
    projectName
        ? `${UrlHelper.getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`
        : undefined;
