import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Region} from './Region';
import {RegionsChangedEvent} from './RegionsChangedEvent';
import {RegionAddedEvent} from './RegionAddedEvent';
import {RegionRemovedEvent} from './RegionRemovedEvent';
import {RegionJson} from './RegionJson';
import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {RegionDescriptor} from '../RegionDescriptor';
import {ComponentPath} from './ComponentPath';
import {ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {ComponentEventsHolder} from '../../wizard/page/ComponentEventsHolder';
import {ComponentEventsWrapper} from '../../wizard/page/ComponentEventsWrapper';

export class Regions
    implements Equitable {

    public static debug: boolean = false;

    private regionByName: Map<string, Region> = new Map<string, Region>();

    private changedListeners: { (event: RegionsChangedEvent): void }[] = [];

    private readonly componentEventsHolder: ComponentEventsHolder;

    constructor(builder: RegionsBuilder) {
        this.componentEventsHolder = new ComponentEventsHolder();

        builder.regions.forEach((region: Region) => {
            if (this.regionByName.has(region.getName())) {
                throw new Error('Regions must be unique by name, duplicate found: ' + region.getName());
            }

            this.addRegion(region);
        });
    }

    addRegion(region: Region) {
        this.regionByName.set(region.getName(), region);

        this.notifyRegionAdded(region.getPath());
        this.registerRegionListeners(region);
    }

    private registerRegionListeners(region: Region) {
        region.getEventsManager().onComponentAdded((event: ComponentAddedEvent) => this.notifyComponentAdded(event));
        region.getEventsManager().onComponentRemoved((event: ComponentRemovedEvent) => this.notifyComponentRemoved(event));
        region.getEventsManager().onComponentUpdated((event: ComponentUpdatedEvent) => this.notifyComponentUpdated(event));
    }

    private unregisterRegionListeners(region: Region) {

    }

    removeRegions(regions: Region[]) {
        regions.forEach((region: Region) => {
            this.regionByName.delete(region.getName());

            this.notifyRegionRemoved(region.getPath());
            this.unregisterRegionListeners(region);
        });
    }

    getRegions(): Region[] {
        const regions: Region[] = [];

        this.regionByName.forEach((region: Region) => {
            regions.push(region);
        });

        return regions;
    }

    getRegionByName(name: string): Region {
        return this.regionByName.get(name);
    }

    /**
     * Keeps existing regions (including components) if they are listed in given regionDescriptors.
     * Removes others and adds those missing.
     * @param regionDescriptors
     */
    changeRegionsTo(regionDescriptors: RegionDescriptor[]) {

        // Remove regions not existing in regionDescriptors
        let regionsToRemove: Region[] = this.getRegions().filter((region: Region) => {
            return !regionDescriptors.some((regionDescriptor: RegionDescriptor) => {
                return regionDescriptor.getName() === region.getName();
            });
        });
        this.removeRegions(regionsToRemove);

        // Add missing regions
        regionDescriptors.forEach((regionDescriptor: RegionDescriptor) => {
            let region = this.getRegionByName(regionDescriptor.getName());
            if (!region) {
                region = Region.create().setName(regionDescriptor.getName()).build();
                this.addRegion(region);
            }
        });
    }

    getEventsManager(): ComponentEventsWrapper {
        return new ComponentEventsWrapper(this.componentEventsHolder);
    }

    public toJson(): RegionJson[] {

        let regionJsons: RegionJson[] = [];
        this.getRegions().forEach((region: Region) => {
            regionJsons.push(region.toJson());
        });
        return regionJsons;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Regions)) {
            return false;
        }

        let other = <Regions>o;

        let thisRegions = this.getRegions()?.filter((region: Region) => !region.isEmpty());
        let otherRegions = other.getRegions()?.filter((region: Region) => !region.isEmpty());

        if (!ObjectHelper.arrayEquals(thisRegions, otherRegions)) {
            return false;
        }

        return true;
    }

    isEmpty(): boolean {
        return this.getRegions().length === 0;
    }

    clone(): Regions {
        return new RegionsBuilder(this).build();
    }

    onChanged(listener: (event: BaseRegionChangedEvent) => void) {
        this.changedListeners.push(listener);
    }

    unChanged(listener: (event: BaseRegionChangedEvent) => void) {
        this.changedListeners =
            this.changedListeners.filter((curr: (event: BaseRegionChangedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyChanged(event: RegionsChangedEvent) {
        if (Regions.debug) {
            console.debug('Regions.notifyChanged');
        }
        this.changedListeners.forEach((listener: (event: RegionsChangedEvent) => void) => {
            listener(event);
        });
    }

    private notifyRegionAdded(regionPath: ComponentPath) {
        const event: RegionAddedEvent = new RegionAddedEvent(regionPath);

        if (Regions.debug) {
            console.debug('Regions.notifyRegionAdded: ' + event.getRegionPath().toString());
        }

        this.notifyChanged(event);
    }

    private notifyRegionRemoved(regionPath: ComponentPath) {
        const event: RegionRemovedEvent = new RegionRemovedEvent(regionPath);

        if (Regions.debug) {
            console.debug('Regions.notifyRegionRemoved: ' + event.getRegionPath().toString());
        }

        this.notifyChanged(event);
    }

    notifyComponentAdded(event: ComponentAddedEvent): void {
        this.componentEventsHolder.notifyComponentAdded(event);
    }

    notifyComponentRemoved(event: ComponentRemovedEvent): void {
        this.componentEventsHolder.notifyComponentRemoved(event);
    }

    notifyComponentUpdated(event: ComponentUpdatedEvent): void {
        this.componentEventsHolder.notifyComponentUpdated(event);
    }

    public static create(): RegionsBuilder {
        return new RegionsBuilder();
    }
}

export class RegionsBuilder {

    regions: Region[] = [];

    constructor(source?: Regions) {
        if (source) {
            source.getRegions().forEach((region: Region) => {
                this.regions.push(region.clone());
            });
        }
    }

    addRegion(value: Region): RegionsBuilder {
        this.regions.push(value);
        return this;
    }

    setRegions(value: Region[]): RegionsBuilder {
        this.regions = value;
        return this;
    }

    public build(): Regions {
        return new Regions(this);
    }
}
