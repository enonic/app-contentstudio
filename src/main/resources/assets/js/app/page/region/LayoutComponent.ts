import PropertyTree = api.data.PropertyTree;
import LayoutDescriptor = api.content.page.region.LayoutDescriptor;
import {Regions} from './Regions';
import {ComponentPropertyChangedEvent} from './ComponentPropertyChangedEvent';
import {Region} from './Region';
import {ComponentPath, ComponentPathRegionAndComponent} from './ComponentPath';
import {Component} from './Component';
import {LayoutComponentJson} from './LayoutComponentJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {LayoutComponentType} from './LayoutComponentType';
import {ComponentName} from './ComponentName';
import {LayoutRegionsMerger} from './LayoutRegionsMerger';
import {LayoutBasedComponent, LayoutBasedComponentBuilder} from './LayoutBasedComponent';

export class LayoutComponent
    extends LayoutBasedComponent
    implements api.Equitable, api.Cloneable {

    public static debug: boolean = false;

    private regions: Regions;

    private componentPropertyChangedListeners: { (event: ComponentPropertyChangedEvent): void }[] = [];

    private componentPropertyChangedEventHandler: (event: any) => void;

    private regionsChangedEventHandler: (event: any) => void;

    constructor(builder: LayoutComponentBuilder) {
        super(builder);

        this.initRegionsListeners();
        this.initRegions(builder.regions);
    }

    private initRegionsListeners() {
        this.componentPropertyChangedEventHandler = (event: any) => this.forwardComponentPropertyChangedEvent(event);

        this.regionsChangedEventHandler = (event: any) => {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].onChanged: ', event);
            }
            this.notifyPropertyValueChanged('regions');
        };
    }

    private initRegions(regions: Regions) {
        const result: Regions = !!regions ? this.updateRegionsParentPath(regions) : Regions.create().build();
        this.setRegions(result);
    }

    private updateRegionsParentPath(regions: Regions): Regions {
        regions.getRegions().forEach((region: Region) => region.setParentPath(this.getPath()));

        return regions;
    }

    public getComponent(path: ComponentPath): Component {
        const first: ComponentPathRegionAndComponent = path.getFirstLevel();
        const region = this.regions.getRegionByName(first.getRegionName());
        const component = region.getComponentByIndex(first.getComponentIndex());

        if (path.numberOfLevels() === 1) {
            return component;
        }

        if (!api.ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
            throw new Error('Expected component to be a LayoutComponent: ' + api.ClassHelper.getClassName(component));
        }

        return (<LayoutComponent> component).getComponent(path.removeFirstLevel());
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
        this.registerRegionsListeners();

        if (!api.ObjectHelper.equals(oldValue, value)) {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].regions reassigned: ', event);
            }
            this.notifyPropertyChanged('regions');
        }
    }

    setDescriptor(descriptor: LayoutDescriptor) {
        super.setDescriptor(descriptor);

        if (descriptor) {
            this.addRegions(descriptor);
        }
    }

    addRegions(layoutDescriptor: LayoutDescriptor) {
        const sourceRegions = this.getRegions();
        const mergedRegions = new LayoutRegionsMerger().merge(sourceRegions, layoutDescriptor.getRegions(), this);
        this.setRegions(mergedRegions);
    }

    isEmpty(): boolean {
        return !this.hasDescriptor();
    }

    public toJson(): ComponentTypeWrapperJson {
        const json: LayoutComponentJson = <LayoutComponentJson>super.toComponentJson();
        json.regions = this.regions.toJson();

        return <ComponentTypeWrapperJson> {
            LayoutComponent: json
        };
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, LayoutComponent)) {
            return false;
        }

        const other = <LayoutComponent>o;

        if (!super.equals(o)) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.regions, other.regions)) {
            return false;
        }

        return true;
    }

    clone(): LayoutComponent {
        return new LayoutComponentBuilder(this).build();
    }

    private registerRegionsListeners() {
        this.regions.onChanged(this.regionsChangedEventHandler);
        this.regions.onComponentPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    private unregisterRegionsListeners() {
        this.regions.unChanged(this.regionsChangedEventHandler);
        this.regions.unComponentPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    onComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
        this.componentPropertyChangedListeners.push(listener);
    }

    unComponentPropertyChanged(listener: (event: ComponentPropertyChangedEvent) => void) {
        this.componentPropertyChangedListeners =
            this.componentPropertyChangedListeners.filter((curr: (event: ComponentPropertyChangedEvent) => void) => {
                return listener !== curr;
            });
    }

}

export class LayoutComponentBuilder
    extends LayoutBasedComponentBuilder<LayoutComponent> {

    regions: Regions;

    constructor(source?: LayoutComponent) {

        super(source);

        if (source) {
            this.regions = source.getRegions().clone();
        }

        this.setType(LayoutComponentType.get());
    }

    public fromJson(json: LayoutComponentJson, region: Region): LayoutComponentBuilder {

        if (json.descriptor) {
            this.setDescriptor(api.content.page.DescriptorKey.fromString(json.descriptor));
        }

        this.setName(json.name ? new ComponentName(json.name) : null);

        if (json.config) {
            this.setConfig(PropertyTree.fromJson(json.config));
        }

        this.setParent(region);

        return this;
    }

    public setRegions(value: Regions): LayoutComponentBuilder {
        this.regions = value;
        return this;
    }

    public build(): LayoutComponent {
        return new LayoutComponent(this);
    }
}
