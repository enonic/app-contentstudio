import { SITE_PATH } from '../../../../shared/lib/form/form';

type ScopeOptions = {
    isInSite: boolean;
    showAllContent: boolean;
};

export function resolveAllowedContentPaths({ isInSite, showAllContent }: ScopeOptions): string[] | undefined {
    if (showAllContent || !isInSite) {
        return undefined;
    }

    return [SITE_PATH];
}
