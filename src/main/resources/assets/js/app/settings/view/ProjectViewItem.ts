import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {Project} from '../data/project/Project';
import {SettingsDataItemBuilder, SettingsDataViewItem} from './SettingsDataViewItem';

export class ProjectViewItem
    extends SettingsDataViewItem<Project> {

    public static DEFAULT_ICON_CLASS: string = 'icon-tree-2';

    constructor(builder: ProjectItemBuilder) {
        super(builder);
    }

    static create(): ProjectItemBuilder {
        return new ProjectItemBuilder();
    }

    getName(): string {
        return this.data.getName();
    }

    getDisplayName(): string {
        return this.data.getDisplayName();
    }

    getDescription(): string {
        return this.data.getDescription();
    }

    getIconClass(): string {
        return this.data.getIcon() || ProjectViewItem.DEFAULT_ICON_CLASS;
    }

    getId(): string {
        return this.data.getName();
    }

    getPermissions(): ProjectPermissions {
        return this.data.getPermissions();
    }

    getData(): Project {
        return this.data;
    }

    isEditAllowed(loginResult: LoginResult): boolean {
        if (loginResult.isContentAdmin()) {
            return true;
        }

        if (!this.getPermissions() || Project.DEFAULT_PROJECT_NAME === this.getName()) {
            return false;
        }

        return loginResult.getPrincipals().some(key => this.getPermissions().isOwner(key));
    }

    isDeleteAllowed(loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin() && Project.DEFAULT_PROJECT_NAME !== this.getName();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectViewItem)) {
            return false;
        }

        const other: ProjectViewItem = <ProjectViewItem>o;

        if (!super.equals(o)) {
            return false;
        }

        return ObjectHelper.objectEquals(this.data, other.data);
    }

}

export class ProjectItemBuilder
    extends SettingsDataItemBuilder<Project> {

    setData(value: Project): ProjectItemBuilder {
        super.setData(value);
        return this;
    }

    build(): ProjectViewItem {
        return new ProjectViewItem(this);
    }
}
