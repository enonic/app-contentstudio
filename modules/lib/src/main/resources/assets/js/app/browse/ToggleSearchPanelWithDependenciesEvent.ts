import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentSummary} from '../content/ContentSummary';

export class ToggleSearchPanelWithDependenciesEvent
    extends Event {

    private item: ContentSummary;

    private inbound: boolean;

    private type: string;

    constructor(item: ContentSummary, inbound: boolean, type?: string) {
        super();
        this.item = item;
        this.inbound = inbound;
        this.type = type;
    }

    getContent(): ContentSummary {
        return this.item;
    }

    isInbound(): boolean {
        return this.inbound;
    }

    getType(): string {
        return this.type;
    }

    static on(handler: (event: ToggleSearchPanelWithDependenciesEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ToggleSearchPanelWithDependenciesEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
