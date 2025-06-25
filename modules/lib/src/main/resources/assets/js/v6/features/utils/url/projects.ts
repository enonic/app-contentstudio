import {UrlHelper} from '../../../../app/util/UrlHelper';

export function resolveProjectIconUrl(projectName: string | undefined | null): string | undefined {
    if (projectName == null) {
        return undefined;
    }

    return `${UrlHelper.getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`;
}
