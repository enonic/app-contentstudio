import {ComponentChangedEvent} from './ComponentChangedEvent';
import {Component} from './Component';

export class ComponentPropertyChangedEvent
    extends ComponentChangedEvent {

    private readonly component: Component;

    private readonly propertyName: string;

    constructor(builder: ComponentPropertyChangedEventBuilder) {
        super(builder.component.getPath());

        this.component = builder.component;
        this.propertyName = builder.propertyName;
    }

    public getComponent(): Component {
        return this.component;
    }

    public getPropertyName(): string {
        return this.propertyName;
    }

    public static create(): ComponentPropertyChangedEventBuilder {
        return new ComponentPropertyChangedEventBuilder();
    }
}

export class ComponentPropertyChangedEventBuilder {

    propertyName: string;

    component: Component;

    setPropertyName(value: string): ComponentPropertyChangedEventBuilder {
        this.propertyName = value;
        return this;
    }

    setComponent(value: Component): ComponentPropertyChangedEventBuilder {
        this.component = value;
        return this;
    }

    build(): ComponentPropertyChangedEvent {
        return new ComponentPropertyChangedEvent(this);
    }
}
