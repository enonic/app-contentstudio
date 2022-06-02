import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ProjectUpdatedEvent} from './ProjectUpdatedEvent';
import {ProjectCreatedEvent} from './ProjectCreatedEvent';
import {ProjectDeletedEvent} from './ProjectDeletedEvent';

export class SettingsEventAggregator {

    private static TIMEOUT: number = 1000;

    private updateEvents: Map<string, Function> = new Map<string, Function>();

    private createEvents: Map<string, Function> = new Map<string, Function>();

    private deleteEvents: Map<string, Function> = new Map<string, Function>();

    public appendUpdateEvent(projectName: string) {
        if (this.updateEvents.get(projectName)) {
            this.updateEvents.get(projectName)();
        } else {
            const debouncedFunc: Function = AppHelper.debounce(() => {
                this.updateEvents.delete(projectName);
                new ProjectUpdatedEvent(projectName).fire();
            }, SettingsEventAggregator.TIMEOUT);

            this.updateEvents.set(projectName, debouncedFunc);

            debouncedFunc();
        }
    }

    public appendCreateEvent(projectName: string) {
        if (this.createEvents.get(projectName)) {
            this.createEvents.get(projectName)();
        } else {
            const debouncedFunc: Function = AppHelper.debounce(() => {
                this.createEvents.delete(projectName);
                new ProjectCreatedEvent(projectName).fire();
            }, SettingsEventAggregator.TIMEOUT);

            this.createEvents.set(projectName, debouncedFunc);

            debouncedFunc();
        }
    }

    public appendDeleteEvent(projectName: string) {
        if (this.deleteEvents.get(projectName)) {
            this.deleteEvents.get(projectName)();
        } else {
            const debouncedFunc: Function = AppHelper.debounce(() => {
                this.deleteEvents.delete(projectName);
                new ProjectDeletedEvent(projectName).fire();
            }, SettingsEventAggregator.TIMEOUT);

            this.deleteEvents.set(projectName, debouncedFunc);

            debouncedFunc();
        }
    }

}
