import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {type ProjectSiteConfigJson} from '../../resource/json/ProjectSiteConfigJson';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export class ApplicationConfigHelper {

    public static siteConfigJsonToAppConfig(json: ProjectSiteConfigJson): ApplicationConfig {
        const propertySet: PropertySet = PropertyTree.fromJson(json.config).getRoot();
        return ApplicationConfig.create().setApplicationKey(ApplicationKey.fromString(json.key)).setConfig(propertySet).build();
    }
}
