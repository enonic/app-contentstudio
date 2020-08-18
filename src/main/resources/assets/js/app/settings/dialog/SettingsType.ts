import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class SettingsType {

    private readonly name: string;

    private readonly displayName: string;

    private readonly description: string;

    private readonly iconClass: string;

    private readonly instantiable: boolean;

    constructor(builder: SettingsTypeBuilder) {
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconClass = builder.iconClass;
        this.instantiable = builder.instantiable;
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

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsType)) {
            return false;
        }

        const other: SettingsType = <SettingsType>o;

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

    build(): SettingsType {
        return new SettingsType(this);
    }
}
