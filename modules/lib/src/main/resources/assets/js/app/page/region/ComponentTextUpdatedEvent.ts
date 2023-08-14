import {ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';

export class ComponentTextUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly text: string;

    constructor(componentPath: ComponentPath, value: string) {
        super(componentPath);

        this.text = value;
    }

    getText(): string {
        return this.text;
    }
}
