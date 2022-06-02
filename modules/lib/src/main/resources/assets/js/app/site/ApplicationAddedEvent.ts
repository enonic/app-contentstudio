import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export class ApplicationAddedEvent {

    private applicationConfig: ApplicationConfig;

    constructor(applicationConfig: ApplicationConfig) {
        this.applicationConfig = applicationConfig;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationConfig.getApplicationKey();
    }

    getApplicationConfig(): ApplicationConfig {
        return this.applicationConfig;
    }
}
