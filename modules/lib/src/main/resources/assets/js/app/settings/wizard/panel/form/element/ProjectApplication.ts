import {Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export class ProjectApplication {

    private readonly application: Application;

    private readonly config: ApplicationConfig;

    constructor(application: Application, config: ApplicationConfig) {
       this.application = application;
       this.config = config;
    }

    getApplication(): Application {
        return this.application;
    }

    getConfig(): ApplicationConfig {
        return this.config;
    }

}
