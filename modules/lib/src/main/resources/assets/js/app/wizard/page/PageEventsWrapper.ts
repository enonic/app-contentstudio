import {ComponentEventsWrapper} from './ComponentEventsWrapper';
import {PageEventsHolder} from './PageEventsHolder';
import {PageResetHandler, PageUpdatedEventHandler} from '../../page/Page';

export class PageEventsWrapper extends ComponentEventsWrapper {

    protected eventsHolder: PageEventsHolder;

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

}
