import '../../api.ts';
import ApplicationKey = api.application.ApplicationKey;
import ApplicationConfig = api.application.ApplicationConfig;

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
