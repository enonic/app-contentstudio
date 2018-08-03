import '../../api.ts';
import ApplicationKey = api.application.ApplicationKey;
import SiteConfig = api.content.site.SiteConfig;

export class ApplicationAddedEvent {

    private siteConfig: SiteConfig;

    constructor(siteConfig: SiteConfig) {
        this.siteConfig = siteConfig;
    }

    getApplicationKey(): ApplicationKey {
        return this.siteConfig.getApplicationKey();
    }

    getSiteConfig(): SiteConfig {
        return this.siteConfig;
    }
}
