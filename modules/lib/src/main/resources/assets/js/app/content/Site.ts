import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {Content, ContentBuilder} from './Content';
import {ContentJson} from './ContentJson';

export class Site
    extends Content
    implements Equitable, Cloneable {

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

    equals(o: Equitable, ignoreEmptyValues: boolean = false): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Site)) {
            return false;
        }

        return super.equals(o, ignoreEmptyValues);
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
