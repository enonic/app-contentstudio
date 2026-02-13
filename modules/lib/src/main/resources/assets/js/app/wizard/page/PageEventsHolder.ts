import {ComponentEventsHolder} from './ComponentEventsHolder';
import {type PageConfigUpdateHandler, type PageResetHandler, type PageUpdatedEventHandler} from '../../page/Page';
import {type PageUpdatedEvent} from '../../page/event/PageUpdatedEvent';

export class PageEventsHolder extends ComponentEventsHolder {

    private pageUpdatedListeners: PageUpdatedEventHandler[] = [];

    private pageResetListeners: PageResetHandler[] = [];

    private pageConfigUpdatedListeners: PageConfigUpdateHandler[] = [];

    onPageUpdated(listener: PageUpdatedEventHandler): void {
        this.pageUpdatedListeners.push(listener);
    }

    unPageUpdated(listener: PageUpdatedEventHandler): void {
        this.pageUpdatedListeners = this.pageUpdatedListeners.filter(l => l !== listener);
    }

    notifyPageUpdated(event: PageUpdatedEvent): void {
        this.pageUpdatedListeners.forEach(listener => listener(event));
    }

    onPageReset(listener: PageResetHandler): void {
        this.pageResetListeners.push(listener);
    }

    unPageReset(listener: PageResetHandler): void {
        this.pageResetListeners = this.pageResetListeners.filter(l => l !== listener);
    }

    notifyPageReset(): void {
        this.pageResetListeners.forEach(listener => listener());
    }

    onPageConfigUpdated(listener: PageConfigUpdateHandler): void {
        this.pageConfigUpdatedListeners.push(listener);
    }

    unPageConfigUpdated(listener: PageConfigUpdateHandler): void {
        this.pageConfigUpdatedListeners = this.pageConfigUpdatedListeners.filter(l => l !== listener);
    }

    notifyPageConfigUpdated(): void {
        this.pageConfigUpdatedListeners.forEach(listener => listener());
    }
}
