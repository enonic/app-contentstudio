import {SettingsItem, SettingsItemBuilder} from './SettingsItem';
import {ProjectItemJson} from '../resource/json/ProjectItemJson';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectItemPermissions} from './ProjectItemPermissions';

export class ProjectItem
    extends SettingsItem {

    public static DEFAULT: string = 'default';

    public static DEFAULT_ICON_CLASS: string = 'icon-tree-2';

    private name: string;

    private permissions: ProjectItemPermissions;

    constructor(builder: ProjectItemBuilder) {
        super(builder);

        this.name = builder.name;
        this.permissions = builder.permissions;
    }

    getName(): string {
        return this.name;
    }

    getPermissions(): ProjectItemPermissions {
        return this.permissions;
    }

    getId(): string {
        return this.name;
    }

    static fromJson(json: ProjectItemJson): ProjectItem {
        return new ProjectItemBuilder().fromJson(json).build();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectItem)) {
            return false;
        }

        const other: ProjectItem = <ProjectItem> o;

        if (!super.equals(o)) {
            return false;
        }

        return ObjectHelper.objectEquals(this.name, other.name);
    }

}

export class ProjectItemBuilder
    extends SettingsItemBuilder {

    name: string;

    permissions: ProjectItemPermissions;

    setName(value: string): ProjectItemBuilder {
        this.name = value;
        return this;
    }

    setPermissions(value: ProjectItemPermissions): ProjectItemBuilder {
        this.permissions = value;
        return this;
    }

    constructor(source?: ProjectItem) {
        super(source);

        if (!source || !source.getIconClass()) {
            this.setIconClass(ProjectItem.DEFAULT_ICON_CLASS);
        }
    }

    fromJson(json: ProjectItemJson): ProjectItemBuilder {
        super.fromJson(json);
        this.name = json.name;
        this.permissions = ProjectItemPermissions.fromJson(json.permissions);
        return this;
    }

    build(): ProjectItem {
        return new ProjectItem(this);
    }

}
