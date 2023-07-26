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

export type ComponentPropertyChangedEventHandler =  (event: ComponentPropertyChangedEvent) => void;
export type ComponentChangedEventHandler =  (event: ComponentChangedEvent) => void;
export type ComponentPropertyValueChangedEventHandler =  (event: ComponentPropertyValueChangedEvent) => void;
export type ComponentResetEventHandler =  (event: ComponentResetEvent) => void;
export type ComponentAddedEventHandler =  (event: ComponentAddedEvent) => void;

export abstract class Component
    implements Equitable, Cloneable, PageItem {

    public static PROPERTY_NAME: string = 'name';

    private name: ComponentName;

    private parent: Region;

    private changedListeners: ComponentChangedEventHandler[] = [];

    private propertyChangedListeners: ComponentPropertyChangedEventHandler[] = [];

    private propertyValueChangedListeners: ComponentPropertyValueChangedEventHandler[] = [];

    private resetListeners: ComponentResetEventHandler[] = [];

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
        return new ComponentPath(this.getIndex(), this.parent?.getPath());
    }

    getName(): ComponentName {
        return this.name;
    }

    setName(newValue: ComponentName) {
        let oldValue = this.name;
        this.name = newValue;
        if (!ObjectHelper.equals(oldValue, newValue)) {
            this.notifyPropertyChanged(Component.PROPERTY_NAME);
        }
    }

    doReset() {
        throw new Error('Must be implemented by inheritors');
    }

    reset() {
        this.doReset();
        this.notifyResetEvent();
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

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Component)) {
            return false;
        }

        let other = <Component>o;

        if (!ObjectHelper.equals(this.name, other.name)) {
            return false;
        }

        return true;
    }

    getComponentByPath(path: ComponentPath): PageItem {
        return null;
    }

    clone(): Component {
        throw new Error('Must be implemented by inheritors');
    }

    onChanged(listener: ComponentChangedEventHandler) {
        this.changedListeners.push(listener);
    }

    unChanged(listener: ComponentChangedEventHandler) {
        this.changedListeners =
            this.changedListeners.filter((curr: ComponentPropertyChangedEventHandler) => {
                return listener !== curr;
            });
    }

    private notifyChangedEvent(event: ComponentChangedEvent) {
        this.changedListeners.forEach((listener: ComponentChangedEventHandler) => {
            listener(event);
        });
    }

    onReset(listener: ComponentResetEventHandler) {
        if (!this.resetListeners.some((existingListener: ComponentResetEventHandler) => existingListener === listener)) {
            this.resetListeners.push(listener);
        }
    }

    unReset(listener: ComponentResetEventHandler) {
        this.resetListeners = this.resetListeners.filter((curr: ComponentResetEventHandler) => {
            return listener !== curr;
        });
    }

    private notifyResetEvent() {
        let event = new ComponentResetEvent(this.getPath());
        this.resetListeners.forEach((listener: ComponentResetEventHandler) => {
            listener(event);
        });
    }

    /**
     * Observe when a property of Component have been reassigned.
     */
    onPropertyChanged(listener: ComponentPropertyChangedEventHandler) {
        if (!this.propertyChangedListeners.some((currentListener: ComponentPropertyChangedEventHandler) => currentListener === listener)) {
            this.propertyChangedListeners.push(listener);
        }
    }

    unPropertyChanged(listener: ComponentPropertyChangedEventHandler) {
        this.propertyChangedListeners =
            this.propertyChangedListeners.filter((curr: ComponentPropertyChangedEventHandler) => {
                return listener !== curr;
            });
    }

    notifyPropertyChanged(propertyName: string) {
        let event = ComponentPropertyChangedEvent.create().setComponent(this).setPropertyName(propertyName).build();
        this.propertyChangedListeners.forEach((listener: ComponentPropertyChangedEventHandler) => {
            listener(event);
        });
        this.notifyChangedEvent(event);
    }

    forwardComponentPropertyChangedEvent(event: ComponentPropertyChangedEvent) {
        this.propertyChangedListeners.forEach((listener: ComponentPropertyChangedEventHandler) => {
            listener(event);
        });
    }

    /**
     * Observe when a property of Component have changed (happens only for mutable objects).
     */
    onPropertyValueChanged(listener: ComponentPropertyValueChangedEventHandler) {
        this.propertyValueChangedListeners.push(listener);
    }

    unPropertyValueChanged(listener: ComponentPropertyValueChangedEventHandler) {
        this.propertyValueChangedListeners =
            this.propertyValueChangedListeners.filter((curr: ComponentPropertyValueChangedEventHandler) => {
                return listener !== curr;
            });
    }

    notifyPropertyValueChanged(propertyName: string) {
        let event = new ComponentPropertyValueChangedEvent(this.getPath(), propertyName);
        this.propertyValueChangedListeners.forEach((listener: ComponentPropertyValueChangedEventHandler) => {
            listener(event);
        });
        this.notifyChangedEvent(event);
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
