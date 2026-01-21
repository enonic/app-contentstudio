import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type PageNavigationEventSource} from '../wizard/PageNavigationEventData';

export class InspectEvent
    extends Event {

    private readonly showExtension: boolean;

    private readonly showPanel: boolean;

    private readonly source: PageNavigationEventSource;

    constructor(builder: InspectEventBuilder) {
        super();

        this.showExtension = builder.showExtension;
        this.showPanel = builder.showPanel;
        this.source = builder.source;
    }

    isShowExtension(): boolean {
        return this.showExtension;
    }

    isShowPanel(): boolean {
        return this.showPanel;
    }

    getSource(): PageNavigationEventSource {
        return this.source;
    }

    static on(handler: (event: InspectEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: InspectEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    static create(): InspectEventBuilder {
        return new InspectEventBuilder();
    }

}

export class InspectEventBuilder {

    showExtension: boolean;

    showPanel: boolean;

    source: PageNavigationEventSource;

    setShowExtension(value: boolean): InspectEventBuilder {
        this.showExtension = value;
        return this;
    }

    setShowPanel(value: boolean): InspectEventBuilder {
        this.showPanel = value;
        return this;
    }

    setSource(value: PageNavigationEventSource): InspectEventBuilder {
        this.source = value;
        return this;
    }

    build(): InspectEvent {
        return new InspectEvent(this);
    }
}
