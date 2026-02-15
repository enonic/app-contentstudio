import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Region} from './Region';
import {RegionAddedEvent} from './RegionAddedEvent';
import {RegionRemovedEvent} from './RegionRemovedEvent';
import {type RegionJson} from './RegionJson';
import {type RegionDescriptor} from '../RegionDescriptor';
import {type ComponentPath} from './ComponentPath';
import {type ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {type ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {ComponentEventsHolder} from '../../wizard/page/ComponentEventsHolder';
import {ComponentEventsWrapper} from '../../wizard/page/ComponentEventsWrapper';
import {type ComponentAddedEventHandler, type ComponentRemovedEventHandler, type ComponentUpdatedEventHandler} from './Component';

export class Regions
    implements Equitable {

    public static debug: boolean = false;

    private readonly regionByName: Map<string, Region> = new Map<string, Region>();

    private readonly componentEventsHolder: ComponentEventsHolder;

    private readonly componentAddedHandler: ComponentAddedEventHandler;

    private readonly componentRemovedHandler: ComponentRemovedEventHandler;

    private readonly componentUpdatedHandler: ComponentUpdatedEventHandler;

    constructor(builder: RegionsBuilder) {
        this.componentEventsHolder = new ComponentEventsHolder();
        this.componentAddedHandler = (event: ComponentAddedEvent) => this.notifyComponentAdded(event);
        this.componentRemovedHandler = (event: ComponentRemovedEvent) => this.notifyComponentRemoved(event);
        this.componentUpdatedHandler = (event: ComponentUpdatedEvent) => this.notifyComponentUpdated(event);

        builder.regions.forEach((region: Region) => {
            if (this.regionByName.has(region.getName())) {
                throw new Error('Regions must be unique by name, duplicate found: ' + region.getName());
            }

            this.addRegion(region);
        });
    }

    addRegion(region: Region): void {
        this.regionByName.set(region.getName(), region);

        this.notifyRegionAdded(region.getPath());
        this.registerRegionListeners(region);
    }

    private registerRegionListeners(region: Region): void {
        region.getEventsManager().onComponentAdded(this.componentAddedHandler);
        region.getEventsManager().onComponentRemoved(this.componentRemovedHandler);
        region.getEventsManager().onComponentUpdated(this.componentUpdatedHandler);
    }

    private unregisterRegionListeners(region: Region) {
        region.getEventsManager().unComponentAdded(this.componentAddedHandler);
        region.getEventsManager().unComponentRemoved(this.componentRemovedHandler);
        region.getEventsManager().unComponentUpdated(this.componentUpdatedHandler);
    }

    removeRegions(regions: Region[]) {
        regions.forEach((region: Region) => {
            this.regionByName.delete(region.getName());

            this.notifyComponentRemoved(new ComponentRemovedEvent(region.getPath()));
            this.unregisterRegionListeners(region);
        });
    }

    removeAllRegions(): void {
        this.removeRegions(this.getRegions());
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
        const regionsToRemove: Region[] = this.getRegions().filter((region: Region) => {
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

        const regionJsons: RegionJson[] = [];
        this.getRegions().forEach((region: Region) => {
            regionJsons.push(region.toJson());
        });
        return regionJsons;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Regions)) {
            return false;
        }

        const other = o as Regions;

        const thisRegions = this.getRegions()?.filter((region: Region) => !region.isEmpty());
        const otherRegions = other.getRegions()?.filter((region: Region) => !region.isEmpty());

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

    private notifyRegionAdded(regionPath: ComponentPath) {
        const event: RegionAddedEvent = new RegionAddedEvent(regionPath);

        if (Regions.debug) {
            console.debug('Regions.notifyRegionAdded: ' + event.getRegionPath().toString());
        }
    }

    private notifyRegionRemoved(regionPath: ComponentPath) {
        const event: RegionRemovedEvent = new RegionRemovedEvent(regionPath);

        if (Regions.debug) {
            console.debug('Regions.notifyRegionRemoved: ' + event.getRegionPath().toString());
        }

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
