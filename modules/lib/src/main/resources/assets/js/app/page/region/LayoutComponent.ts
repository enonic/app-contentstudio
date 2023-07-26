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
        this.registerRegionsListeners();

        if (!ObjectHelper.equals(oldValue, value)) {
            if (LayoutComponent.debug) {
                console.debug('LayoutComponent[' + this.getPath().toString() + '].regions reassigned: ', event);
            }
            this.notifyPropertyChanged('regions');
        }
    }

    setDescriptor(descriptor: Descriptor) {
        super.setDescriptor(descriptor);

        if (descriptor) {
            this.addRegions(descriptor);
        }
    }

    addRegions(descriptor: Descriptor) {
        const sourceRegions = this.getRegions();
        const mergedRegions = new LayoutRegionsMerger().merge(sourceRegions, descriptor.getRegions(), this);
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
        this.regions.onChanged(this.regionsChangedEventHandler);
        this.regions.onComponentPropertyChanged(this.componentPropertyChangedEventHandler);
        this.regions.onComponentAdded((event: ComponentAddedEvent) => this.getParent()?.notifyComponentAddedEvent(event));
        this.regions.onComponentRemoved((event: ComponentRemovedEvent) => this.getParent()?.notifyComponentRemovedEvent(event));
    }

    private unregisterRegionsListeners(): void {
        this.regions.unChanged(this.regionsChangedEventHandler);
        this.regions.unComponentPropertyChanged(this.componentPropertyChangedEventHandler);
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
