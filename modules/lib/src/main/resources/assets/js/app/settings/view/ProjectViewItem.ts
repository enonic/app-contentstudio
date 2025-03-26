import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {Project} from '../data/project/Project';
import {SettingsDataItemBuilder, SettingsDataViewItem} from './SettingsDataViewItem';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {ProjectHelper} from '../data/project/ProjectHelper';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {SettingsType} from '../data/type/SettingsType';
import {SettingsTypes} from '../data/type/SettingsTypes';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';

export class ProjectViewItem
    extends SettingsDataViewItem<Project> {

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
        return ProjectIconUrlResolver.getDefaultIcon(this.data);
    }

    getIconUrl(): string {
        return this.data.getIcon() ? new ProjectIconUrlResolver()
            .setProjectName(this.getName())
            .setTimestamp(new Date().getTime())
            .resolve() : null;
    }

    getId(): string {
        return this.data.getName();
    }

    getPermissions(): ProjectPermissions {
        return this.data.getPermissions();
    }

    getReadAccess(): ProjectReadAccess {
        return this.data.getReadAccess();
    }

    getLanguage(): string {
        return this.data.getLanguage();
    }

    getType(): SettingsType {
        return this.data.hasParents() ? SettingsTypes.get().getLayer() : SettingsTypes.get().getProject();
    }

    isDefaultProject(): boolean {
        return ProjectHelper.isDefault(this.data);
    }

    getSiteConfigs(): ApplicationConfig[] {
        return this.data.getSiteConfigs();
    }

    isEditAllowed(loginResult: LoginResult): boolean {
        if (loginResult.isContentAdmin()) {
            return true;
        }

        if (!this.getPermissions()) {
            return false;
        }

        return loginResult.getPrincipals().some(key => this.getPermissions().isOwner(key));
    }

    isDeleteAllowed(loginResult: LoginResult): boolean {
        return loginResult.isContentAdmin() && !this.isDefaultProject();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectViewItem)) {
            return false;
        }

        const other: ProjectViewItem = o as ProjectViewItem;

        if (!super.equals(o)) {
            return false;
        }

        return ObjectHelper.equals(this.data, other.data);
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
