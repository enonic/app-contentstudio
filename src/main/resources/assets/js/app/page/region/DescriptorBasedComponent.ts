import PropertyTree = api.data.PropertyTree;
import PropertyEvent = api.data.PropertyEvent;
import DescriptorKey = api.content.page.DescriptorKey;
import Descriptor = api.content.page.Descriptor;
import {Component, ComponentBuilder} from './Component';
import {ComponentName} from './ComponentName';
import {DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';

export class DescriptorBasedComponent
    extends Component
    implements api.Equitable, api.Cloneable {

    public static debug: boolean = false;

    public static PROPERTY_DESCRIPTOR: string = 'descriptor';

    public static PROPERTY_CONFIG: string = 'config';

    private disableEventForwarding: boolean;

    private descriptorKey: DescriptorKey;

    private description: string;

    private config: PropertyTree;

    private configChangedHandler: (event: PropertyEvent) => void;

    constructor(builder: DescriptorBasedComponentBuilder<any>) {

        super(builder);

        this.descriptorKey = builder.descriptor;
        this.config = builder.config;

        this.configChangedHandler = (event: PropertyEvent) => {
            if (DescriptorBasedComponent.debug) {
                console.debug('DescriptorBasedComponent[' + this.getPath().toString() + '].config.onChanged: ', event);
            }
            if (!this.disableEventForwarding) {
                this.notifyPropertyValueChanged(DescriptorBasedComponent.PROPERTY_CONFIG);
            }
        };

        this.config.onChanged(this.configChangedHandler);
    }

    setDisableEventForwarding(value: boolean) {
        this.disableEventForwarding = value;
    }

    hasDescriptor(): boolean {
        return !!this.descriptorKey;
    }

    getDescriptorKey(): DescriptorKey {
        return this.descriptorKey;
    }

    setDescriptor(descriptor: Descriptor) {
        const oldDescriptorKeyValue = this.descriptorKey;
        this.descriptorKey = descriptor ? descriptor.getKey() : null;

        this.setName(descriptor ? new ComponentName(descriptor.getDisplayName()) : this.getType().getDefaultName());
        this.description = descriptor ? descriptor.getDescription() : null;

        if (!api.ObjectHelper.equals(oldDescriptorKeyValue, this.descriptorKey)) {
            this.notifyPropertyChanged(DescriptorBasedComponent.PROPERTY_DESCRIPTOR);
        }

        this.setConfig(new PropertyTree());
    }

    setConfig(config: PropertyTree) {
        let oldValue = this.config;
        if (oldValue) {
            this.config.unChanged(this.configChangedHandler);
        }
        this.config = config;
        this.config.onChanged(this.configChangedHandler);

        if (!api.ObjectHelper.equals(oldValue, config)) {
            this.notifyPropertyChanged(DescriptorBasedComponent.PROPERTY_CONFIG);
        }
    }

    getConfig(): PropertyTree {
        return this.config;
    }

    getDescription(): string {
        return this.description;
    }

    setDescription(value: string) {
        this.description = value;
    }

    doReset() {
        this.setDescriptor(null);
    }

    toComponentJson(): DescriptorBasedComponentJson {

        return <DescriptorBasedComponentJson>{
            name: this.getName() ? this.getName().toString() : null,
            descriptor: this.descriptorKey != null ? this.descriptorKey.toString() : null,
            config: this.config != null ? this.config.toJson() : null
        };
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, DescriptorBasedComponent)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }
        let other = <DescriptorBasedComponent>o;

        if (!api.ObjectHelper.equals(this.descriptorKey, other.descriptorKey)) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.config, other.config)) {
            return false;
        }

        return true;
    }

    clone(): DescriptorBasedComponent {
        throw new Error('Must be implemented by inheritors');
    }
}

export class DescriptorBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT extends DescriptorBasedComponent>
    extends ComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {

    descriptor: DescriptorKey;

    config: PropertyTree;

    constructor(source?: DescriptorBasedComponent) {
        super(source);
        if (source) {
            this.descriptor = source.getDescriptorKey();
            this.config = source.getConfig() ? source.getConfig().copy() : null;
        } else {
            this.config = new PropertyTree();
        }
    }

    public setDescriptor(value: DescriptorKey): ComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {
        this.descriptor = value;
        return this;
    }

    public setConfig(value: PropertyTree): ComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {
        this.config = value;
        return this;
    }

    public build(): DESCRIPTOR_BASED_COMPONENT {
        throw new Error('Must be implemented by inheritor');
    }
}
