import {type PageNavigationEvent} from './PageNavigationEvent';
import {type PageNavigationHandler} from './PageNavigationHandler';

export class PageNavigationMediator {

    private static INSTANCE: PageNavigationMediator;

    private pageNavigationHandlers: PageNavigationHandler[] = [];

    private constructor() {
        //
    }

    static get(): PageNavigationMediator {
        if (!PageNavigationMediator.INSTANCE) {
            PageNavigationMediator.INSTANCE = new PageNavigationMediator();
        }

        return PageNavigationMediator.INSTANCE;
    }

    notify(event: PageNavigationEvent, source?: PageNavigationHandler) {
        this.pageNavigationHandlers.forEach((item) => {
            if (item !== source) {
                item.handle(event);
            }
        });
    }

    addPageNavigationHandler(item: PageNavigationHandler) {
        this.pageNavigationHandlers.push(item);
    }

    removePageNavigationItem(item: PageNavigationHandler) {
        this.pageNavigationHandlers = this.pageNavigationHandlers.filter((i) => i !== item);
    }
}
