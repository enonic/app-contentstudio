import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';

export class ApplicationRemovedEvent {

    private applicationKey: ApplicationKey;

    constructor(applicationKey: ApplicationKey) {
        this.applicationKey = applicationKey;
    }

    getApplicationKey(): ApplicationKey {
        return this.applicationKey;
    }
}
