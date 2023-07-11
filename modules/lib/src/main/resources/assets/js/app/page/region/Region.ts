import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Component, ComponentChangedEventHandler, ComponentPropertyChangedEventHandler} from './Component';
import {BaseRegionChangedEvent} from './BaseRegionChangedEvent';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentPropertyChangedEvent} from './ComponentPropertyChangedEvent';
import {RegionPropertyValueChangedEvent} from './RegionPropertyValueChangedEvent';
import {ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionJson} from './RegionJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {assertState} from '@enonic/lib-admin-ui/util/Assert';
import {ComponentChangedEvent} from './ComponentChangedEvent';
import {PageItem} from './PageItem';

export class Region
    implements Equitable, Cloneable, PageItem {

    public static debug: boolean = false;

    private readonly name: string;

    private components: Component[] = [];

    private parent: PageItem;

    private changedListeners: { (event: BaseRegionChangedEvent): void }[] = [];

    private componentAddedListeners: { (event: ComponentAddedEvent): void }[] = [];

    private componentRemovedListeners: { (event: ComponentRemovedEvent): void }[] = [];

    private componentPropertyChangedListeners: { (event: ComponentPropertyChangedEvent): void }[] = [];

    private propertyValueChangedListeners: { (event: RegionPropertyValueChangedEvent): void }[] = [];

    private readonly componentChangedEventHandler: ComponentChangedEventHandler;

    private readonly componentPropertyChangedEventHandler: (event: ComponentChangedEvent) => void;

    constructor(builder: RegionBuilder) {
        this.name = builder.name;
        this.parent = builder.parent;

        this.componentChangedEventHandler = (event: any) => {
            if (Region.debug) {
                console.debug(this.toString() + '.handleComponentChanged: ', event);
            }
            this.notifyRegionPropertyValueChanged('components');
        };

        this.componentPropertyChangedEventHandler = (event: any) => this.forwardComponentPropertyChangedEvent(event);

        builder.components.forEach((component: Component) => {
            this.registerComponent(component);
        });
    }

    setParent(parent: PageItem) {
        this.parent = parent;
    }

    getName(): string {
        return this.name;
    }

    getParent(): PageItem {
        return this.parent;
    }

    getPath(): ComponentPath {
        return new ComponentPath(this.name, this.parent?.getPath());
    }

    isEmpty(): boolean {
        return !this.components || this.components.length === 0;
    }

    empty() {
        if (Region.debug) {
            console.debug(this.toString() + '.empty()', this.components);
        }

        while (this.components.length > 0) {
            // remove component modifies the components array so we can't rely on forEach
            this.removeComponent(this.components[0]);
        }
    }

    addComponent(component: Component, index?: number): Component {
        if (Region.debug) {
            console.debug(this.toString() + '.addComponent: ' + component.toString());
        }

        this.registerComponent(component, index);
        this.notifyComponentAdded(component.getPath());

        return component;
    }

    removeComponent(component: Component): Component {
        if (Region.debug) {
            console.debug(this.toString() + '.removeComponent: ' + component.toString(), this.components);
        }

        // parent will be cleared on unregister so grab path before it
        let path = component.getPath();
        this.unregisterComponent(component);
        this.notifyComponentRemoved(path);

        return component;
    }

    getComponents(): Component[] {
        return this.components;
    }

    getComponentByIndex(index: number): Component {
        let component = this.components[index];
        if (!component) {
            let message = 'The rendered page is not consistent with the page components structure. Expected component with index ' +
                          `${index} was not found in region '${this.getName()}'.`;
            console.error(message);
            throw new Exception(message, ExceptionType.ERROR);
        }
        assertState(component.getIndex() === index,
            'Index of Component is not as expected. Expected [' + index + '], was: ' + component.getIndex());
        return component;
    }

    toJson(): RegionJson {

        let componentJsons: ComponentTypeWrapperJson[] = [];

        this.components.forEach((component: Component) => {
            componentJsons.push(component.toJson());
        });

        return <RegionJson>{
            name: this.name,
            components: componentJsons
        };
    }

    toString(): string {
        return 'Region[' + this.getPath().toString() + ']';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Region)) {
            return false;
        }

        let other = <Region>o;

        if (!ObjectHelper.stringEquals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.components, other.components)) {
            return false;
        }

        return true;
    }

    clone(): Region {
        return new RegionBuilder(this).build();
    }

    private refreshIndexes(start?: number) {
        for (let i = Math.min(0, start); i < this.components.length; i++) {
            this.components[i].setIndex(i);
        }
    }

    private registerComponent(component: Component, index?: number) {
        if (Region.debug) {
            console.debug(this.toString() + '.registerComponent: ' + component.toString() + ' at ' + component.getIndex());
        }

        if (index >= 0 && index < this.components.length) {

            this.components.splice(index, 0, component);
            // update indexes for inserted component and components after it
            this.refreshIndexes(index);

        } else {

            this.components.push(component);
            component.setIndex(this.components.length - 1);
        }

        component.setParent(this);

        component.onChanged(this.componentChangedEventHandler);
        component.onPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    private unregisterComponent(component: Component) {
        if (Region.debug) {
            console.debug(this.toString() + '.unregisterComponent: ' + component.toString(), this.components);
        }
        component.unChanged(this.componentChangedEventHandler);
        component.unPropertyChanged(this.componentPropertyChangedEventHandler);

        let index = component.getIndex();
        if (index === -1) {
            throw new Error(component.toString() + ' to remove does not exist in ' + this.toString());
        }

        this.components.splice(index, 1);
        // update indexes for inserted component and components after it
        this.refreshIndexes(index);

        component.setParent(null);
        component.setIndex(-1);
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

    private notifyChangedEvent(event: BaseRegionChangedEvent) {
        this.changedListeners.forEach((listener: (event: BaseRegionChangedEvent) => void) => {
            listener(event);
        });
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners =
            this.componentAddedListeners.filter((curr: (event: ComponentAddedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyComponentAdded(componentPath: ComponentPath) {
        let event = new ComponentAddedEvent(componentPath);
        this.componentAddedListeners.forEach((listener: (event: ComponentAddedEvent) => void) => {
            listener(event);
        });
        this.notifyChangedEvent(event);
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners =
            this.componentRemovedListeners.filter((curr: (event: ComponentRemovedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyComponentRemoved(componentPath: ComponentPath) {
        let event = new ComponentRemovedEvent(componentPath);
        this.componentRemovedListeners.forEach((listener: (event: ComponentRemovedEvent) => void) => {
            listener(event);
        });
        this.notifyChangedEvent(event);
    }

    onComponentPropertyChangedEvent(listener: ComponentPropertyChangedEventHandler) {
        this.componentPropertyChangedListeners.push(listener);
    }

    unComponentPropertyChangedEvent(listener: ComponentPropertyChangedEventHandler) {
        this.componentPropertyChangedListeners =
            this.componentPropertyChangedListeners.filter((curr: ComponentPropertyChangedEventHandler) => {
                return listener !== curr;
            });
    }

    private forwardComponentPropertyChangedEvent(event: ComponentPropertyChangedEvent): void {
        this.componentPropertyChangedListeners.forEach((listener: ComponentPropertyChangedEventHandler) => {
            listener(event);
        });
    }

    onRegionPropertyValueChanged(listener: (event: RegionPropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners.push(listener);
    }

    unRegionPropertyValueChanged(listener: (event: RegionPropertyValueChangedEvent) => void) {
        this.propertyValueChangedListeners =
            this.propertyValueChangedListeners.filter((curr: (event: RegionPropertyValueChangedEvent) => void) => {
                return listener !== curr;
            });
    }

    private notifyRegionPropertyValueChanged(propertyName: string) {
        let event = new RegionPropertyValueChangedEvent(this.getPath(), propertyName);
        this.propertyValueChangedListeners.forEach((listener: (event: RegionPropertyValueChangedEvent) => void) => {
            listener(event);
        });
        this.notifyChangedEvent(event);
    }

    static create(source?: Region): RegionBuilder {
        return new RegionBuilder(source);
    }
}

export class RegionBuilder {

    name: string;

    components: Component[] = [];

    parent: PageItem;

    constructor(source?: Region) {
        if (source) {
            this.name = source.getName();
            this.parent = source.getParent();
            source.getComponents().forEach((component: Component) => {
                this.components.push(component.clone());
            });
        }
    }

    public setName(value: string): RegionBuilder {
        this.name = value;
        return this;
    }

    public setParent(value: PageItem): RegionBuilder {
        this.parent = value;
        return this;
    }

    public addComponent(value: Component): RegionBuilder {
        this.components.push(value);
        return this;
    }

    public setComponents(value: Component[]): RegionBuilder {
        this.components = value;
        return this;
    }

    public build(): Region {
        return new Region(this);
    }
}
