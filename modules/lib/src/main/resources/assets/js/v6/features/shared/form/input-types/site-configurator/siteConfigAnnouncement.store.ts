import { map } from 'nanostores';

export const $siteConfigErrorAnnouncers = map<Partial<Record<string, number>>>({});

/** Register only while a mounted field can announce its visible error. */
export function registerSiteConfigErrorAnnouncer(contentId: string): () => void {
    $siteConfigErrorAnnouncers.setKey(contentId, ($siteConfigErrorAnnouncers.get()[contentId] ?? 0) + 1);
    return () => {
        const remaining = ($siteConfigErrorAnnouncers.get()[contentId] ?? 1) - 1;
        $siteConfigErrorAnnouncers.setKey(contentId, remaining || undefined);
    };
}
