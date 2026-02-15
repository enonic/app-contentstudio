import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type Property} from '@enonic/lib-admin-ui/data/Property';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {Content, ContentBuilder} from './Content';

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

        const siteConfigs: ApplicationConfig[] = [];
        this.getContentData().forEachProperty('siteConfig', (applicationProperty: Property) => {
            const siteConfigData = applicationProperty.getPropertySet();
            if (siteConfigData) {
                const siteConfig = ApplicationConfig.create().fromData(siteConfigData).build();
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

    build(): Site {
        return new Site(this);
    }
}
