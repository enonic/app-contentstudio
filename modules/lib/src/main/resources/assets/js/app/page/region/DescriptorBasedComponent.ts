import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ComponentName} from './ComponentName';
import {DescriptorBasedComponentJson} from './DescriptorBasedComponentJson';
import {ConfigBasedComponent, ConfigBasedComponentBuilder} from './ConfigBasedComponent';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {DescriptorKey} from '../DescriptorKey';
import {Descriptor} from '../Descriptor';
import {ComponentDescriptorUpdatedEvent} from './ComponentDescriptorUpdatedEvent';
import {ComponentConfigUpdatedEvent} from './ComponentConfigUpdatedEvent';

export abstract class DescriptorBasedComponent
    extends ConfigBasedComponent {

    public static PROPERTY_DESCRIPTOR: string = 'descriptor';

    private descriptorKey: DescriptorKey;

    protected constructor(builder: DescriptorBasedComponentBuilder) {
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

        this.setName(descriptor ? new ComponentName(descriptor.getDisplayName()) : this.getType().getDefaultName());

        if (!ObjectHelper.equals(oldDescriptorKeyValue, this.descriptorKey)) {
            this.notifyComponentUpdated(new ComponentDescriptorUpdatedEvent(this.getPath(), this.descriptorKey));
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

        if (!ObjectHelper.equals(oldValue, config)) {
            this.notifyComponentUpdated(new ComponentConfigUpdatedEvent(this.getPath(), config));
        }
    }

    doReset() {
        this.setDescriptor(null);
    }

    toComponentJson(): DescriptorBasedComponentJson {

        return <DescriptorBasedComponentJson>{
            descriptor: this.descriptorKey != null ? this.descriptorKey.toString() : null,
            config: this.config != null ? this.config.toJson() : null
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, DescriptorBasedComponent)) {
            return false;
        }

        const other: DescriptorBasedComponent = <DescriptorBasedComponent>o;

        if (!ObjectHelper.equals(this.descriptorKey, other.descriptorKey)) {
            return false;
        }

        return super.equals(o);
    }

    clone(): DescriptorBasedComponent {
        throw new Error('Must be implemented by inheritors');
    }
}

export abstract class DescriptorBasedComponentBuilder
    extends ConfigBasedComponentBuilder {

    descriptor: DescriptorKey;

    description: string;

    icon: string;

    protected constructor(source?: DescriptorBasedComponent) {
        super(source);
        if (source) {
            this.descriptor = source.getDescriptorKey();
        }
    }

    public fromJson(json: DescriptorBasedComponentJson): this {
        super.fromJson(json);

        if (json.descriptor) {
            this.setDescriptor(DescriptorKey.fromString(json.descriptor));
        }

        return this;
    }

    public setDescriptor(value: DescriptorKey): this {
        this.descriptor = value;
        return this;
    }

    public setDescription(value: string): this {
        this.description = value;
        return this;
    }

    public setIcon(value: string): this {
        this.icon = value;
        return this;
    }
}
