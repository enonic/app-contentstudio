import PropertyTree = api.data.PropertyTree;
import DescriptorKey = api.content.page.DescriptorKey;
import Descriptor = api.content.page.Descriptor;
import {ComponentName} from './ComponentName';
import {DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';

export abstract class DescriptorBasedComponent
    extends ConfigBasedComponent {

    public static PROPERTY_DESCRIPTOR: string = 'descriptor';

    private descriptorKey: DescriptorKey;

    private description: string;

    private icon: string;

    constructor(builder: DescriptorBasedComponentBuilder<DescriptorBasedComponent>) {
        super(builder);

        this.descriptorKey = builder.descriptor;
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

        this.icon = descriptor ? descriptor.getIcon() : null;

        this.setName(descriptor ? new ComponentName(descriptor.getDisplayName()) : this.getType().getDefaultName());
        this.description = descriptor ? descriptor.getDescription() : null;

        if (!api.ObjectHelper.equals(oldDescriptorKeyValue, this.descriptorKey)) {
            this.notifyPropertyChanged(DescriptorBasedComponent.PROPERTY_DESCRIPTOR);
        }

        this.setConfig(new PropertyTree());
    }

    setConfig(config: PropertyTree) {
        const oldValue: PropertyTree = this.config;
        if (oldValue) {
            this.config.unChanged(this.configChangedHandler);
        }
        this.config = config;
        this.config.onChanged(this.configChangedHandler);

        if (!api.ObjectHelper.equals(oldValue, config)) {
            this.notifyPropertyChanged(ConfigBasedComponent.PROPERTY_CONFIG);
        }
    }

    getDescription(): string {
        return this.description;
    }

    setDescription(value: string) {
        this.description = value;
    }

    getIcon(): string {
        return this.icon;
    }

    setIcon(value: string) {
        this.icon = value;
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

        const other: DescriptorBasedComponent = <DescriptorBasedComponent>o;

        if (!api.ObjectHelper.equals(this.descriptorKey, other.descriptorKey)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): DescriptorBasedComponent {
        throw new Error('Must be implemented by inheritors');
    }
}

export class DescriptorBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT extends DescriptorBasedComponent>
    extends ConfigBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {

    descriptor: DescriptorKey;

    constructor(source?: DescriptorBasedComponent) {
        super(source);
        if (source) {
            this.descriptor = source.getDescriptorKey();
        }
    }

    public fromJson(json: DescriptorBasedComponentJson): DescriptorBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {
        super.fromJson(json);

        if (json.descriptor) {
            this.setDescriptor(api.content.page.DescriptorKey.fromString(json.descriptor));
        }

        return this;
    }

    public setDescriptor(value: DescriptorKey): DescriptorBasedComponentBuilder<DESCRIPTOR_BASED_COMPONENT> {
        this.descriptor = value;
        return this;
    }
}
