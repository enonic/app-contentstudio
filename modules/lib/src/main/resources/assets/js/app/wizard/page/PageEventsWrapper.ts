import {ComponentEventsWrapper} from './ComponentEventsWrapper';
import {type PageEventsHolder} from './PageEventsHolder';
import {type PageConfigUpdateHandler, type PageResetHandler, type PageUpdatedEventHandler} from '../../page/Page';

export class PageEventsWrapper extends ComponentEventsWrapper {

    declare protected eventsHolder: PageEventsHolder;

    constructor(holder: PageEventsHolder) {
        super(holder);
    }

    onPageUpdated(listener: PageUpdatedEventHandler): void {
        this.eventsHolder.onPageUpdated(listener);
    }

    unPageUpdated(listener: PageUpdatedEventHandler): void {
        this.eventsHolder.unPageUpdated(listener);
    }

    onPageReset(listener: PageResetHandler): void {
        this.eventsHolder.onPageReset(listener);
    }

    unPageReset(listener: PageResetHandler): void {
        this.eventsHolder.unPageReset(listener);
    }

    onPageConfigUpdated(listener: PageConfigUpdateHandler): void {
        this.eventsHolder.onPageConfigUpdated(listener);
    }

    unPageConfigUpdated(listener: PageConfigUpdateHandler): void {
        this.eventsHolder.unPageConfigUpdated(listener);
    }

}
