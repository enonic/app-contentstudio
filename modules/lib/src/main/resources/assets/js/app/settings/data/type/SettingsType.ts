import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class SettingsType {

    private readonly name: string;

    private readonly displayName: string;

    private readonly displayNamePlaceholder: string;

    private readonly description: string;

    private readonly iconClass: string;

    private readonly instantiable: boolean;

    constructor(builder: SettingsTypeBuilder) {
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconClass = builder.iconClass;
        this.instantiable = builder.instantiable;
        this.displayNamePlaceholder = builder.displayNamePlaceholder;
    }

    static create(): SettingsTypeBuilder {
        return new SettingsTypeBuilder();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getIconClass(): string {
        return this.iconClass;
    }

    getDescription(): string {
        return this.description;
    }

    getInstantiable(): boolean {
        return this.instantiable;
    }

    getDisplayNamePlaceholder(): string {
        return this.displayNamePlaceholder;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsType)) {
            return false;
        }

        const other: SettingsType = o as SettingsType;

        return ObjectHelper.objectEquals(this.name, other.name)
               && ObjectHelper.objectEquals(this.displayName, other.displayName)
               && ObjectHelper.objectEquals(this.iconClass, other.iconClass);
    }
}

export class SettingsTypeBuilder {

    name: string;

    displayName: string;

    description: string;

    iconClass: string;

    instantiable: boolean = true;

    displayNamePlaceholder: string;

    setName(value: string): SettingsTypeBuilder {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): SettingsTypeBuilder {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): SettingsTypeBuilder {
        this.description = value;
        return this;
    }

    setIconClass(value: string): SettingsTypeBuilder {
        this.iconClass = value;
        return this;
    }

    setInstantiable(value: boolean): SettingsTypeBuilder {
        this.instantiable = value;
        return this;
    }

    setDisplayNamePlaceholder(value: string): SettingsTypeBuilder {
        this.displayNamePlaceholder = value;
        return this;
    }

    build(): SettingsType {
        return new SettingsType(this);
    }
}
