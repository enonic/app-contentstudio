import {type PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';

export class PageNavigationEvent {

    private readonly type: PageNavigationEventType;

    private readonly data: PageNavigationEventData;

    constructor(type: PageNavigationEventType, data?: PageNavigationEventData) {
        this.type = type;
        this.data = data || new PageNavigationEventData();
    }

    getType(): PageNavigationEventType {
        return this.type;
    }

    getData(): PageNavigationEventData {
        return this.data;
    }

}
