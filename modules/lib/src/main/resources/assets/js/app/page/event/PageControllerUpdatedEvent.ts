import {PageUpdatedEvent} from './PageUpdatedEvent';
import {type DescriptorKey} from '../DescriptorKey';

export class PageControllerUpdatedEvent extends PageUpdatedEvent {

    private readonly oldValue?: DescriptorKey;
    private readonly newValue: DescriptorKey;

    constructor(newValue: DescriptorKey, oldValue?: DescriptorKey) {
        super();

        this.newValue = newValue;
        this.oldValue = oldValue;
    }

    getPageController(): DescriptorKey {
        return this.newValue;
    }

    getOldPageController(): DescriptorKey {
        return this.oldValue;
    }
}
