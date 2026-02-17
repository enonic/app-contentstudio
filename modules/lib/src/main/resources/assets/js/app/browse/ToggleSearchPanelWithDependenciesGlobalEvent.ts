import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentSummary} from '../content/ContentSummary';

export class ToggleSearchPanelWithDependenciesGlobalEvent
    extends Event {

    private item: ContentSummary;

    private inbound: boolean;

    constructor(item: ContentSummary, inbound: boolean) {
        super();
        this.item = item;
        this.inbound = inbound;
    }

    getContent(): ContentSummary {
        return this.item;
    }

    isInbound(): boolean {
        return this.inbound;
    }

    static on(handler: (event: ToggleSearchPanelWithDependenciesGlobalEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ToggleSearchPanelWithDependenciesGlobalEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
