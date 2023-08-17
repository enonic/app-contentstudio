import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ComponentName} from './ComponentName';
import {Region} from './Region';
import {ComponentChangedEvent} from './ComponentChangedEvent';
import {ComponentPropertyChangedEvent} from './ComponentPropertyChangedEvent';
import {ComponentPropertyValueChangedEvent} from './ComponentPropertyValueChangedEvent';
import {ComponentResetEvent} from './ComponentResetEvent';
import {ComponentType} from './ComponentType';
import {ComponentPath} from './ComponentPath';
import {ComponentTypeWrapperJson} from './ComponentTypeWrapperJson';
import {ComponentJson} from './ComponentJson';
import {PageItem} from './PageItem';
import {ComponentAddedEvent} from './ComponentAddedEvent';
import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';

export type ComponentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => void;
export type ComponentResetEventHandler = (event: ComponentResetEvent) => void;
export type ComponentAddedEventHandler = (event: ComponentAddedEvent) => void;
export type ComponentRemovedEventHandler = (event: ComponentRemovedEvent) => void;
export type ComponentUpdatedEventHandler = (event: ComponentUpdatedEvent) => void;

export abstract class Component
    implements Equitable, Cloneable, PageItem {

    private name: ComponentName;

    private parent: Region;

    private componentUpdatedListeners: ((event: ComponentUpdatedEvent) => void)[] = [];

    private readonly type: ComponentType;

    protected constructor(builder: ComponentBuilder) {
        this.name = builder.name;
        this.parent = builder.parent;
        this.type = builder.type;
    }

    setParent(parent: Region) {
        this.parent = parent;
    }

    getIndex(): number {
        return this.parent?.getComponentIndex(this) ?? -1;
    }

    getType(): ComponentType {
        return this.type;
    }

    getPath(): ComponentPath {
        return this.parent ? new ComponentPath(this.getIndex(), this.parent.getPath()) : ComponentPath.root();
    }

    getName(): ComponentName {
        return this.name;
    }

    setName(newValue: ComponentName) {
        this.name = newValue;
    }

    doReset() {
        throw new Error('Must be implemented by inheritors');
    }

    reset() {
        this.doReset();
    }

    isEmpty(): boolean {
        throw new Error('Must be implemented by inheritors');
    }

    getParent(): Region {
        return this.parent;
    }

    duplicate(): Component {
        let duplicateName = this.getName();
        let duplicatedComponent = this.clone();
        duplicatedComponent.setName(duplicateName);

        return duplicatedComponent;
    }

    remove() {
        this.parent.removeComponent(this);
    }

    toJson(): ComponentTypeWrapperJson {
        throw new Error('Must be implemented by inheritor: ' + ClassHelper.getClassName(this));
    }

    toString(): string {
        return 'Component[' + (this.name ? this.name.toString() : '') + ']';
    }

    equals(o: Equitable): boolean {
        return o instanceof Component;
    }

    getComponentByPath(path: ComponentPath): PageItem {
        return null;
    }

    clone(): Component {
        throw new Error('Must be implemented by inheritors');
    }

    onComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.componentUpdatedListeners.push(listener);
    }

    unComponentUpdated(listener: (event: ComponentUpdatedEvent) => void) {
        this.componentUpdatedListeners = this.componentUpdatedListeners.filter(l => l !== listener);
    }

    notifyComponentUpdated(event: ComponentUpdatedEvent) {
        this.componentUpdatedListeners.forEach(listener => listener(event));
    }
}

export abstract class ComponentBuilder {

    name: ComponentName;

    index: number;

    parent: Region;

    type: ComponentType;

    protected constructor(source?: Component) {
        if (source) {
            this.name = source.getName();
            this.parent = source.getParent();
            this.index = source.getIndex();
            this.type = source.getType();
        }
    }

    public setIndex(value: number): this {
        this.index = value;
        return this;
    }

    public setName(value: ComponentName): this {
        this.name = value;
        return this;
    }

    public setParent(value: Region): this {
        this.parent = value;
        return this;
    }

    public setType(value: ComponentType): this {
        this.type = value;
        return this;
    }

    public fromJson(json: ComponentJson): this {
        this.setName(json.name ? new ComponentName(json.name) : null);

        return this;
    }

    public abstract build(): Component;
}
