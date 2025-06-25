import {getCmsRestUri} from './cms';

export function resolveProjectIconUrl(projectName: string | undefined | null): string | undefined {
    if (projectName == null) {
        return undefined;
    }

    return `${getCmsRestUri('project/icon/')}${encodeURIComponent(projectName)}`;
}
