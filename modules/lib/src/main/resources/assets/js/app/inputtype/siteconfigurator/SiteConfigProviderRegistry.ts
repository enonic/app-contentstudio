import {ApplicationConfigProvider} from '@enonic/lib-admin-ui/form/inputtype/appconfig/ApplicationConfigProvider';

export class SiteConfigProviderRegistry {

    private static siteConfigProvider: ApplicationConfigProvider;

    private constructor() {
        //
    }

    public static setConfigProvider(siteConfigProvider: ApplicationConfigProvider): void {
        SiteConfigProviderRegistry.siteConfigProvider = siteConfigProvider;
    }

    public static getConfigProvider(): ApplicationConfigProvider | undefined {
        return SiteConfigProviderRegistry.siteConfigProvider;
    }
}
