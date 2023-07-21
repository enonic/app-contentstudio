import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {RegionPath} from './RegionPath';
import {ComponentPath} from './ComponentPath';

export class RegionPropertyValueChangedEvent
    extends BaseRegionChangedEvent {

    private readonly propertyName: string;

    constructor(path: ComponentPath, propertyName: string) {
        super(path);
        this.propertyName = propertyName;
    }

    public getPropertyName(): string {
        return this.propertyName;
    }

}
