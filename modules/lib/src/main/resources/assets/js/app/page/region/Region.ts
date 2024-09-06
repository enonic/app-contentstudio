import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Component, ComponentUpdatedEventHandler} from './Component';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentPath} from './ComponentPath';
import {RegionJson} from './RegionJson';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {assertState} from '@enonic/lib-admin-ui/util/Assert';
import {PageItem} from './PageItem';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {ComponentEventsHolder} from '../../wizard/page/ComponentEventsHolder';
import {ComponentEventsWrapper} from '../../wizard/page/ComponentEventsWrapper';
import {PageItemType} from './PageItemType';

export class Region
    implements Equitable, Cloneable, PageItem {

    public static debug: boolean = false;

    private readonly name: string;

    private components: Component[] = [];

    private parent: PageItem;

    private readonly componentEventsHolder: ComponentEventsHolder;

    private readonly componentUpdatedEventHandler: ComponentUpdatedEventHandler;

    constructor(builder: RegionBuilder) {
        this.componentEventsHolder = new ComponentEventsHolder();

        this.name = builder.name;
        this.parent = builder.parent;

        this.componentUpdatedEventHandler = (event: ComponentUpdatedEvent) => {
            this.notifyComponentUpdatedEvent(event);
        };

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

    getType(): PageItemType {
        return 'region';
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
            this.removeComponent(this.components[this.components.length - 1]);
        }
    }

    addComponent(component: Component, index?: number): Component {
        return this.addComponentViaEvent(new ComponentAddedEvent(component, index));
    }

    addComponentViaEvent(addEvent: ComponentAddedEvent): Component {
        if (Region.debug) {
            console.debug(this.toString() + '.addComponent: ' + addEvent.getComponent().toString());
        }

        this.registerComponent(addEvent.getComponent(), addEvent.getIndex());
        this.componentEventsHolder.notifyComponentAdded(addEvent || new ComponentAddedEvent(addEvent.getComponent()));

        return addEvent.getComponent();
    }

    removeComponent(component: Component): Component {
        return this.removeComponentViaEvent(new ComponentRemovedEvent(component.getPath()));
    }

    removeComponentViaEvent(removeEvent: ComponentRemovedEvent): Component | null {
        const componentToRemove: Component = this.components.find((component) => component.getPath().equals(removeEvent.getPath()));

        if (componentToRemove) {
            this.unregisterComponent(componentToRemove);
            this.componentEventsHolder.notifyComponentRemoved(removeEvent);
            return componentToRemove;
        }

        return null;
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
            throw Error(message);
        }
        assertState(component.getIndex() === index,
            'Index of Component is not as expected. Expected [' + index + '], was: ' + component.getIndex());
        return component;
    }

    getComponentIndex(component: Component): number {
        return this.components.indexOf(component);
    }

    getComponentByPath(path: ComponentPath): PageItem {
        let result = null;

        this.components.some((component: Component) => {
            if (component.getPath().equals(path)) {
                result = component;
                return true;
            }

            result = component.getComponentByPath(path);

            return !!result;
        });

        return result;
    }

    getEventsManager(): ComponentEventsWrapper {
        return new ComponentEventsWrapper(this.componentEventsHolder);
    }

    toJson(): RegionJson {

        let componentJsons: ComponentTypeWrapperJson[] = [];

        this.components.forEach((component: Component) => {
            componentJsons.push(component.toJson());
        });

        return {
            name: this.name,
            components: componentJsons
        } as RegionJson;
    }

    toString(): string {
        return 'Region[' + this.getPath().toString() + ']';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Region)) {
            return false;
        }

        let other = o as Region;

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

    private registerComponent(component: Component, index?: number) {
        if (Region.debug) {
            console.debug(this.toString() + '.registerComponent: ' + component.toString() + ' at ' + component.getIndex());
        }

        if (index >= 0 && index < this.components.length) {

            this.components.splice(index, 0, component);
            // update indexes for inserted component and components after it
        } else {

            this.components.push(component);
        }

        component.setParent(this);
        component.onComponentUpdated(this.componentUpdatedEventHandler);
    }

    private unregisterComponent(component: Component) {
        if (Region.debug) {
            console.debug(this.toString() + '.unregisterComponent: ' + component.toString(), this.components);
        }
        component.unComponentUpdated(this.componentUpdatedEventHandler);

        let index = component.getIndex();
        if (index === -1) {
            throw new Error(component.toString() + ' to remove does not exist in ' + this.toString());
        }

        this.components.splice(index, 1);
        // update indexes for inserted component and components after it
    }

    notifyComponentAddedEvent(event: ComponentAddedEvent) {
        this.componentEventsHolder.notifyComponentAdded(event);
    }

    notifyComponentRemovedEvent(event: ComponentRemovedEvent) {
        this.componentEventsHolder.notifyComponentRemoved(event);
    }

    notifyComponentUpdatedEvent(event: ComponentUpdatedEvent) {
        this.componentEventsHolder.notifyComponentUpdated(event);
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
