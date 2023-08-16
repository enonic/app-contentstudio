import {ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {DescriptorKey} from '../DescriptorKey';

export class ComponentDescriptorUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly descriptorKey: DescriptorKey;

    constructor(componentPath: ComponentPath, value: DescriptorKey) {
        super(componentPath);

        this.descriptorKey = value;
    }

    getDescriptorKey(): DescriptorKey {
        return this.descriptorKey;
    }
}
