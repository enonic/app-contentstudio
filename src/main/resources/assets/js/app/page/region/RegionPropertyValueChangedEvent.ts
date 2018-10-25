import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {RegionPath} from './RegionPath';

export class RegionPropertyValueChangedEvent
    extends BaseRegionChangedEvent {

    private propertyName: string;

    constructor(path: RegionPath, propertyName: string) {
        super(path);
        this.propertyName = propertyName;
    }

    public getPropertyName(): string {
        return this.propertyName;
    }

}
