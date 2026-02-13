import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Regions} from './Regions';
import {type Region} from './Region';
import {type ComponentPath} from './ComponentPath';
import {type LayoutComponentJson} from './LayoutComponentJson';
import {type ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {LayoutComponentType} from './LayoutComponentType';
import {LayoutRegionsMerger} from './LayoutRegionsMerger';
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';
import {type Descriptor} from '../Descriptor';
import {type PageItem} from './PageItem';
import {type ComponentAddedEvent} from './ComponentAddedEvent';
import {type ComponentRemovedEvent} from './ComponentRemovedEvent';
import {type ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {type ComponentAddedEventHandler, type ComponentRemovedEventHandler, type ComponentUpdatedEventHandler} from './Component';
import type Q from 'q';

export class LayoutComponent
    extends DescriptorBasedComponent {

    private readonly regions: Regions;

    private componentAddedEventHandler: ComponentAddedEventHandler;

    private componentRemovedEventHandler: ComponentRemovedEventHandler;

    private componentUpdatedEventHandler: ComponentUpdatedEventHandler;

    constructor(builder: LayoutComponentBuilder) {
        super(builder);

        this.regions = builder.regions || Regions.create().build();

        this.updateRegionsParent();
        this.initRegionsListeners();
        this.registerRegionsListeners();
    }

    private initRegionsListeners() {
        this.componentAddedEventHandler = (event: ComponentAddedEvent) => this.getParent()?.notifyComponentAddedEvent(event);
        this.componentRemovedEventHandler = (event: ComponentRemovedEvent) => this.getParent()?.notifyComponentRemovedEvent(event);
        this.componentUpdatedEventHandler = (event: ComponentUpdatedEvent) => this.getParent()?.notifyComponentUpdatedEvent(event);
    }

    public getRegions(): Regions {
        return this.regions;
    }

    setDescriptor(descriptor: Descriptor): Q.Promise<void> {
        // super.setDescriptor fires component updated event!
        // we need to have regions in place before that
        if (descriptor?.getRegions().length > 0) {
            this.mergeDescriptorRegions(descriptor);
        } else {
            this.getRegions().removeAllRegions();
        }
        return super.setDescriptor(descriptor);
    }

    // preserving this merging logic for now for the sake of backward compatibility
    private mergeDescriptorRegions(descriptor: Descriptor) {
        // merge existing regions that might already have components within with newly added from descriptor
        const mergedRegions = new LayoutRegionsMerger().merge(this.regions, descriptor.getRegions(), this);
        // remove all existing regions and add merged regions
        this.getRegions().removeAllRegions();

        mergedRegions.getRegions().forEach((region: Region) => {
           this.getRegions().addRegion(region);
           region.setParent(this);
        });
    }

    isEmpty(): boolean {
        return !this.hasDescriptor();
    }

    public toJson(): ComponentTypeWrapperJson {
        const json: LayoutComponentJson = super.toComponentJson() as LayoutComponentJson;
        json.regions = this.regions.toJson();

        return {
            LayoutComponent: json
        } as ComponentTypeWrapperJson;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, LayoutComponent)) {
            return false;
        }

        const other = o as LayoutComponent;

        if (!ObjectHelper.equals(this.regions, other.regions)) {
            return false;
        }

        return super.equals(o);
    }

    getComponentByPath(path: ComponentPath): PageItem {
        let result = null;

        this.regions.getRegions().some((region: Region) => {
            if (region.getPath().equals(path)) {
                result = region;
                return true;
            }

            result = region.getComponentByPath(path);

            return !!result;
        });

        return result;
    }

    clone(): LayoutComponent {
        return new LayoutComponentBuilder(this).build();
    }

    private updateRegionsParent(): void {
        this.regions.getRegions().forEach((region) => region.setParent(this));
    }

    private registerRegionsListeners(): void {
        this.regions.getEventsManager().onComponentAdded(this.componentAddedEventHandler);
        this.regions.getEventsManager().onComponentRemoved(this.componentRemovedEventHandler);
        this.regions.getEventsManager().onComponentUpdated(this.componentUpdatedEventHandler);
    }
}

export class LayoutComponentBuilder
    extends DescriptorBasedComponentBuilder {

    regions: Regions;

    constructor(source?: LayoutComponent) {

        super(source);

        if (source) {
            this.regions = source.getRegions().clone();
        }

        this.setType(LayoutComponentType.get());
    }

    public setRegions(value: Regions): this {
        this.regions = value;
        return this;
    }

    public build(): LayoutComponent {
        return new LayoutComponent(this);
    }
}
