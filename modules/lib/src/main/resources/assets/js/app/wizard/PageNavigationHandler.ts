import {PageNavigationEvent} from './PageNavigationEvent';

export interface PageNavigationHandler {

    handle(event: PageNavigationEvent);
}
