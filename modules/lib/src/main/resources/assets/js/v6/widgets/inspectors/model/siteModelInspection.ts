import type { SiteModel } from '../../../../app/site/SiteModel';

export function listenForSiteModelChanges(siteModel: SiteModel, listener: () => void): () => void {
    siteModel.onApplicationAdded(listener);
    siteModel.onApplicationRemoved(listener);
    siteModel.onSiteModelUpdated(listener);
    return () => {
        siteModel.unApplicationAdded(listener);
        siteModel.unApplicationRemoved(listener);
        siteModel.unSiteModelUpdated(listener);
    };
}
