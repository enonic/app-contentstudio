import {type ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {type ComponentTextUpdatedOrigin} from './ComponentTextUpdatedOrigin';

export class ComponentTextUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly text: string;

    private readonly origin: ComponentTextUpdatedOrigin;

    constructor(componentPath: ComponentPath, value: string, origin?: ComponentTextUpdatedOrigin) {
        super(componentPath);

        this.text = value;
        this.origin = origin || 'unknown';
    }

    getText(): string {
        return this.text;
    }

    getOrigin(): ComponentTextUpdatedOrigin {
        return this.origin;
    }
}
