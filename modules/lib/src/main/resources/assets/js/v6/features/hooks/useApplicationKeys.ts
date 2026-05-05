import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {useStore} from '@nanostores/preact';
import {useEffect, useMemo, useState} from 'react';
import type {Site} from '../../../app/content/Site';
import {loadNearestSite} from '../api/details';
import {$activeProject} from '../store/projects.store';
import {$contextContent} from '../store/context/contextContent.store';

export function useApplicationKeys(): ApplicationKey[] {
    const contextContent = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const [nearestSite, setNearestSite] = useState<Site | undefined>(undefined);
    const [siteLoaded, setSiteLoaded] = useState(false);

    const contentId = useMemo(
        () => contextContent?.getContentId(),
        [contextContent],
    );

    // Load the nearest site ancestor for this content
    useEffect(() => {
        setSiteLoaded(false);
        setNearestSite(undefined);

        if (!contentId) {
            setSiteLoaded(true);
            return;
        }

        let cancelled = false;

        loadNearestSite(contentId).then((site) => {
            if (!cancelled) {
                setNearestSite(site);
                setSiteLoaded(true);
            }
        }).catch(() => {
            if (!cancelled) {
                setSiteLoaded(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [contentId]);

    return useMemo(() => {
        if (!siteLoaded) {
            return [];
        }

        // If content is under a site, use the site's application keys
        if (nearestSite) {
            return nearestSite.getApplicationKeys();
        }

        // Fall back to project site configs for non-site content (e.g. headless)
        const projectSiteConfigs = activeProject?.getSiteConfigs();
        if (projectSiteConfigs) {
            return projectSiteConfigs.map((config) => config.getApplicationKey());
        }

        return [];
    }, [siteLoaded, nearestSite, activeProject]);
}
