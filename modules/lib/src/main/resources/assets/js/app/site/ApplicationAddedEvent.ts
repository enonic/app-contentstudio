import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ApplicationAddedEvent
    extends Event {

    private readonly applicationConfig: ApplicationConfig;

    constructor(applicationConfig: ApplicationConfig) {
        super();
        this.applicationConfig = applicationConfig;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationConfig.getApplicationKey();
    }

    getApplicationConfig(): ApplicationConfig {
        return this.applicationConfig;
    }

    static on(handler: (event: ApplicationAddedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ApplicationAddedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
