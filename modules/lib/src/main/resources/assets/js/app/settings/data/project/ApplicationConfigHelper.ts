import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectSiteConfigJson} from '../../resource/json/ProjectSiteConfigJson';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';

export class ApplicationConfigHelper {

    public static siteConfigJsonToAppConfig(json: ProjectSiteConfigJson): ApplicationConfig {
        return ApplicationConfig.create().setApplicationKey(ApplicationKey.fromString(json.key)).setConfig(new PropertySet()).build();
    }
}
