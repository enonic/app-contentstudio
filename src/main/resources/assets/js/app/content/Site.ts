import Property = api.data.Property;
import ApplicationKey = api.application.ApplicationKey;
import ApplicationConfig = api.application.ApplicationConfig;
import {Content, ContentBuilder} from './Content';
import {ContentJson} from './ContentJson';

export class Site
    extends Content
    implements api.Equitable, api.Cloneable {

    constructor(builder: SiteBuilder) {
        super(builder);
    }

    isSite(): boolean {
        return true;
    }

    getDescription(): string {
        return this.getContentData().getString('description');
    }

    getSiteConfigs(): ApplicationConfig[] {

        let siteConfigs: ApplicationConfig[] = [];
        this.getContentData().forEachProperty('siteConfig', (applicationProperty: Property) => {
            let siteConfigData = applicationProperty.getPropertySet();
            if (siteConfigData) {
                let siteConfig = ApplicationConfig.create().fromData(siteConfigData).build();
                siteConfigs.push(siteConfig);
            }
        });

        return siteConfigs;
    }

    getApplicationKeys(): ApplicationKey[] {
        return this.getSiteConfigs().map((config: ApplicationConfig) => config.getApplicationKey());
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Site)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): Site {

        return this.newBuilder().build();
    }

    newBuilder(): SiteBuilder {
        return new SiteBuilder(this);
    }
}

export class SiteBuilder
    extends ContentBuilder {

    constructor(source?: Site) {
        super(source);
    }

    fromContentJson(contentJson: ContentJson): SiteBuilder {
        super.fromContentJson(contentJson);
        return this;
    }

    build(): Site {
        return new Site(this);
    }
}
