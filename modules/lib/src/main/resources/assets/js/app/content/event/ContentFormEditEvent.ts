import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentSummary} from '../ContentSummary';

export class ContentFormEditEvent
    extends Event {

    private readonly model: ContentSummary;

    constructor(model: ContentSummary) {
        super();
        this.model = model;
    }

    static on(handler: (event: ContentFormEditEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ContentFormEditEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    getModels(): ContentSummary {
        return this.model;
    }
}
