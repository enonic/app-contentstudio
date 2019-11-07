import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {LayoutDescriptor} from 'lib-admin-ui/content/page/region/LayoutDescriptor';
import {Regions} from './Regions';
import {Region} from './Region';
import {ComponentPath, ComponentPathRegionAndComponent} from './ComponentPath';
import {Component} from './Component';
import {LayoutComponentJson} from './LayoutComponentJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {LayoutComponentType} from './LayoutComponentType';
import {LayoutRegionsMerger} from './LayoutRegionsMerger';
import {DescriptorBasedComponent, DescriptorBasedComponentBuilder} from './DescriptorBasedComponent';

export class LayoutComponent
    extends DescriptorBasedComponent {

    private regions: Regions;

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
        const newPath: ComponentPath = this.getPath();
        regions.getRegions().forEach((region: Region) => region.setParentPath(newPath));

        return regions;
    }

    public getComponent(path: ComponentPath): Component {
        const first: ComponentPathRegionAndComponent = path.getFirstLevel();
        const region = this.regions.getRegionByName(first.getRegionName());
        const component = region.getComponentByIndex(first.getComponentIndex());

        if (path.numberOfLevels() === 1) {
            return component;
        }

        if (!ObjectHelper.iFrameSafeInstanceOf(component, LayoutComponent)) {
            throw new Error('Expected component to be a LayoutComponent: ' + ClassHelper.getClassName(component));
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

        if (!ObjectHelper.equals(oldValue, value)) {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].regions reassigned: ', event);
            }
            this.notifyPropertyChanged('regions');
        }
    }

    setIndex(value: number) {
        const indexChanged: boolean = value !== this.getIndex();
        super.setIndex(value);
        if (indexChanged && !!this.regions) {
            this.updateRegionsParentPath(this.regions);
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

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, LayoutComponent)) {
            return false;
        }

        const other = <LayoutComponent>o;

        if (!ObjectHelper.equals(this.regions, other.regions)) {
            return false;
        }

        return super.equals(o);
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

}

export class LayoutComponentBuilder
    extends DescriptorBasedComponentBuilder<LayoutComponent> {

    regions: Regions;

    constructor(source?: LayoutComponent) {

        super(source);

        if (source) {
            this.regions = source.getRegions().clone();
        }

        this.setType(LayoutComponentType.get());
    }

    public setRegions(value: Regions): LayoutComponentBuilder {
        this.regions = value;
        return this;
    }

    public build(): LayoutComponent {
        return new LayoutComponent(this);
    }
}
