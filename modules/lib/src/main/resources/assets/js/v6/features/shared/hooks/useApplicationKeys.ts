import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { useEffect, useMemo, useState } from 'react';
import type { Site } from '../../../../app/content/Site';
import { loadNearestSite } from '../../../widgets/inspectors/api/details.api';
import { useFormScope } from '../form/FormScopeContext';

export function useApplicationKeys(): ApplicationKey[] {
    const { project, content: contextContent } = useFormScope();
    const projectName = project?.getName();
    const [nearestSite, setNearestSite] = useState<Site | undefined>(undefined);
    const [siteLoaded, setSiteLoaded] = useState(false);

    const contentId = useMemo(() => contextContent?.getContentId(), [contextContent]);

    // Load the nearest site ancestor for this content
    useEffect(() => {
        setSiteLoaded(false);
        setNearestSite(undefined);

        if (!contentId) {
            setSiteLoaded(true);
            return;
        }

        let cancelled = false;

        loadNearestSite(contentId, projectName)
            .unwrapOr(undefined)
            .then((site) => {
                if (!cancelled) {
                    setNearestSite(site);
                    setSiteLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [contentId, projectName]);

    return useMemo(() => {
        if (!siteLoaded) {
            return [];
        }

        // If content is under a site, use the site's application keys
        if (nearestSite) {
            return nearestSite.getApplicationKeys();
        }

        // Fall back to project site configs for non-site content (e.g. headless)
        const projectSiteConfigs = project?.getSiteConfigs();
        if (projectSiteConfigs) {
            return projectSiteConfigs.map((config) => config.getApplicationKey());
        }

        return [];
    }, [siteLoaded, nearestSite, project]);
}
