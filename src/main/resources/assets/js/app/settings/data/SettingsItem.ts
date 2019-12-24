import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {SettingsItemJson} from '../resource/json/SettingsItemJson';

export abstract class SettingsItem
    implements Equitable {

    private displayName: string;

    private description: string;

    private iconClass: string;

    constructor(builder: SettingsItemBuilder) {
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconClass = builder.iconClass;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getIconClass(): string {
        return this.iconClass;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsItem)) {
            return false;
        }

        const other: SettingsItem = <SettingsItem> o;

        if (!ObjectHelper.stringEquals(this.displayName, other.displayName)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.description, other.description)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.iconClass, other.iconClass)) {
            return false;
        }

        return true;
    }

    abstract getId(): string;

}

export abstract class SettingsItemBuilder {

    displayName: string;

    description: string;

    iconClass: string;

    constructor(source?: SettingsItem) {
        if (source) {
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.iconClass = source.getIconClass();
        }
    }

    fromJson(json: SettingsItemJson): SettingsItemBuilder {
        this.displayName = json.displayName;
        this.description = json.description;
        return this;
    }

    setDisplayName(displayName: string): SettingsItemBuilder {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): SettingsItemBuilder {
        this.description = description;
        return this;
    }

    setIconClass(value: string): SettingsItemBuilder {
        this.iconClass = value;
        return this;
    }

    abstract build(): SettingsItem;
}
