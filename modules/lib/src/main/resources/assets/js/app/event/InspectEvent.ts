import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {PageNavigationEventSource} from '../wizard/PageNavigationEventData';
import {InternalWidgetType} from '../view/context/WidgetView';

export class InspectEvent extends Event {
    private readonly widgetType: InternalWidgetType;

    private readonly showWidget: boolean;

    private readonly showPanel: boolean;

    private readonly source: PageNavigationEventSource;

    constructor(builder: InspectEventBuilder) {
        super();

        this.widgetType = builder.widgetType;
        this.showWidget = builder.showWidget;
        this.showPanel = builder.showPanel;
        this.source = builder.source;
    }

    isSetWidget(): boolean {
        return this.widgetType !== undefined;
    }

    isShowWidget(): boolean {
        return this.showWidget;
    }

    isShowPanel(): boolean {
        return this.showPanel;
    }

    getSource(): PageNavigationEventSource {
        return this.source;
    }

    getWidgetType(): InternalWidgetType {
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
    widgetType: InternalWidgetType;

    showWidget: boolean;

    showPanel: boolean;

    source: PageNavigationEventSource;

    setWidgetType(value: InternalWidgetType): InspectEventBuilder {
        this.widgetType = value;
        return this;
    }

    setShowWidget(value: boolean): InspectEventBuilder {
        this.showWidget = value;
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
