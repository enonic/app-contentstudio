import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import type {InternalExtensionType} from '../view/context/ExtensionView';
import {type PageNavigationEventSource} from '../wizard/PageNavigationEventData';

export class InspectEvent extends Event {
    private readonly widgetType: InternalExtensionType;

    private readonly showExtension: boolean;

    private readonly showPanel: boolean;

    private readonly source: PageNavigationEventSource;

    constructor(builder: InspectEventBuilder) {
        super();

        this.showExtension = builder.showExtension;
        this.widgetType = builder.widgetType;
        this.showPanel = builder.showPanel;
        this.source = builder.source;
    }

    isSetWidget(): boolean {
        return this.widgetType !== undefined;
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

    getWidgetType(): InternalExtensionType {
        return this.widgetType;
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
    widgetType: InternalExtensionType;

    showExtension: boolean;

    showPanel: boolean;

    source: PageNavigationEventSource;

    setWidgetType(value: InternalExtensionType): InspectEventBuilder {
        this.widgetType = value;
        return this;
    }

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
