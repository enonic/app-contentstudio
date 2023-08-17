import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Regions} from './Regions';
import {Region} from './Region';
import {ComponentPath} from './ComponentPath';
import {LayoutComponentJson} from './LayoutComponentJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {LayoutComponentType} from './LayoutComponentType';
import {LayoutRegionsMerger} from './LayoutRegionsMerger';
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';
import {Descriptor} from '../Descriptor';
import {PageItem} from './PageItem';
import {ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {ComponentAddedEventHandler, ComponentRemovedEventHandler, ComponentUpdatedEventHandler} from './Component';

export class LayoutComponent
    extends DescriptorBasedComponent {

    private regions: Regions;

    private componentAddedEventHandler: ComponentAddedEventHandler;

    private componentRemovedEventHandler: ComponentRemovedEventHandler;

    private componentUpdatedEventHandler: ComponentUpdatedEventHandler;

    constructor(builder: LayoutComponentBuilder) {
        super(builder);

        this.initRegionsListeners();
        this.initRegions(builder.regions);
    }

    private initRegionsListeners() {
        this.componentAddedEventHandler = (event: ComponentAddedEvent) => this.getParent()?.notifyComponentAddedEvent(event);
        this.componentRemovedEventHandler = (event: ComponentRemovedEvent) => this.getParent()?.notifyComponentRemovedEvent(event);
        this.componentUpdatedEventHandler = (event: ComponentUpdatedEvent) => this.getParent()?.notifyComponentUpdatedEvent(event);
    }

    private initRegions(regions: Regions) {
        const result: Regions = regions || Regions.create().build();
        this.setRegions(result);
    }

    public getRegions(): Regions {
        return this.regions;
    }

    public setRegions(value: Regions) {
        const oldValue = this.regions;

        if (oldValue) {
            this.unregisterRegionsListeners();
        }

        this.regions = value;
        this.regions.getRegions().forEach((region) => region.setParent(this));
        this.registerRegionsListeners();

        if (!ObjectHelper.equals(oldValue, value)) {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].regions reassigned: ', event);
            }
        }
    }

    setDescriptor(descriptor: Descriptor) {
        super.setDescriptor(descriptor);

        this.regions.getRegions().forEach((region: Region) => region.empty());
        this.regions.removeAllRegions();

        if (descriptor) {
            this.addRegions(descriptor);
        }
    }

    private addRegions(descriptor: Descriptor) {
        const sourceRegions = this.getRegions();
        const mergedRegions = new LayoutRegionsMerger().merge(sourceRegions, descriptor.getRegions(), this);
        this.setRegions(mergedRegions);
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

    private registerRegionsListeners(): void {
        this.regions.getEventsManager().onComponentAdded(this.componentAddedEventHandler);
        this.regions.getEventsManager().onComponentRemoved(this.componentRemovedEventHandler);
        this.regions.getEventsManager().onComponentUpdated(this.componentUpdatedEventHandler);
    }

    private unregisterRegionsListeners(): void {
        this.regions.getEventsManager().unComponentAdded(this.componentAddedEventHandler);
        this.regions.getEventsManager().unComponentRemoved(this.componentRemovedEventHandler);
        this.regions.getEventsManager().unComponentUpdated(this.componentUpdatedEventHandler);
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
