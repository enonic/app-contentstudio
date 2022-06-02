import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DescriptorKey} from './DescriptorKey';
import {DescriptorName} from './DescriptorName';
import {RegionDescriptor} from './RegionDescriptor';
import {DescriptorJson} from './DescriptorJson';
import {ComponentType} from './region/ComponentType';

export class Descriptor
    implements Cloneable, Equitable {

    private readonly key: DescriptorKey;

    private readonly name: DescriptorName;

    private readonly displayName: string;

    private readonly description: string;

    private readonly config: Form;

    private readonly icon: string;

    private readonly regions: RegionDescriptor[];

    private iconCls: string;

    private componentType: ComponentType;

    constructor(builder: DescriptorBuilder) {
        this.name = builder.name;
        this.key = builder.key;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.config = builder.config;
        this.icon = builder.icon;
        this.regions = builder.regions;
    }

    static fromJson(json: DescriptorJson): Descriptor {
        return DescriptorBuilder.fromJson(json).build();
    }

    getKey(): DescriptorKey {
        return this.key;
    }

    getName(): DescriptorName {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getConfig(): Form {
        return this.config;
    }

    setComponentType(componentType: ComponentType) {
        this.componentType = componentType;
        return this;
    }

    getComponentType(): ComponentType {
        return this.componentType;
    }

    setIconCls(iconCls: string) {
        this.iconCls = iconCls;
        return this;
    }

    getIconCls(): string {
        return this.componentType.getIconCls();
    }

    getIcon(): string {
        return this.icon;
    }

    getRegions(): RegionDescriptor[] {
        return this.regions;
    }

    clone(): Descriptor {
        return new DescriptorBuilder(this).build();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Descriptor)) {
            return false;
        }

        let other = <Descriptor>o;

        return this.name.toString() === other.getName().toString() &&
                this.componentType === other.getComponentType() &&
                this.key.equals(other.getKey()) &&
                this.displayName === other.getDisplayName() &&
                this.description === other.getDescription() &&
                this.config.equals(other.getConfig()) &&
                ObjectHelper.arrayEquals(this.regions, other.getRegions());
    }
}

export class DescriptorBuilder {

    key: DescriptorKey;

    name: DescriptorName;

    displayName: string;

    description: string;

    config: Form;

    icon: string;

    regions: RegionDescriptor[] = [];

    constructor(source?: Descriptor) {
        if (source) {
            this.key = source.getKey();
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.config = source.getConfig();
            this.icon = source.getIcon();
            this.regions = source.getRegions();
        }
    }

    static fromJson(json: DescriptorJson): DescriptorBuilder {
        const descriptorKey: DescriptorKey = DescriptorKey.fromString(json.key);
        return new DescriptorBuilder()
            .setName(new DescriptorName(json.name))
            .setDisplayName(json.displayName)
            .setDescription(json.description)
            .setConfig(json.config != null ? Form.fromJson(json.config, descriptorKey.getApplicationKey()) : null)
            .setIcon(json.icon)
            .setKey(descriptorKey)
            .setRegions(json.regions?.map(regionJson => RegionDescriptor.fromJson(regionJson)));
    }

    public setKey(value: DescriptorKey): DescriptorBuilder {
        this.key = value;
        return this;
    }

    public setName(value: DescriptorName): DescriptorBuilder {
        this.name = value;
        return this;
    }

    public setDisplayName(value: string): DescriptorBuilder {
        this.displayName = value;
        return this;
    }

    public setDescription(value: string): DescriptorBuilder {
        this.description = value;
        return this;
    }

    public setConfig(value: Form): DescriptorBuilder {
        this.config = value;
        return this;
    }

    public setIcon(value: string): DescriptorBuilder {
        this.icon = value;
        return this;
    }

    public setRegions(value: RegionDescriptor[]): DescriptorBuilder {
        this.regions = value;
        return this;
    }

    public build(): Descriptor {
        return new Descriptor(this);
    }
}
