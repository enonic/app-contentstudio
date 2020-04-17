import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectJson} from '../../resource/json/ProjectJson';
import {ProjectPermissions} from './ProjectPermissions';
import {ProjectReadAccess} from './ProjectReadAccess';

export class Project
    implements Equitable {

    public static DEFAULT_PROJECT_NAME: string = 'default';

    private name: string;

    private displayName: string;

    private description: string;

    private icon: string;

    private permissions: ProjectPermissions;

    private readAccess: ProjectReadAccess;

    private language: string;

    constructor(builder: ProjectBuilder) {
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.icon = builder.icon;
        this.permissions = builder.permissions;
        this.readAccess = builder.readAccess;
        this.language = builder.language;
    }

    static fromJson(json: ProjectJson): Project {
        return new ProjectBuilder().fromJson(json).build();
    }

    static create(): ProjectBuilder {
        return new ProjectBuilder();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getIcon(): string {
        return this.icon;
    }

    getPermissions(): ProjectPermissions {
        return this.permissions;
    }

    getReadAccess(): ProjectReadAccess {
        return this.readAccess;
    }

    getLanguage(): string {
        return this.language;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Project)) {
            return false;
        }

        const other: Project = <Project>o;

        return ObjectHelper.objectEquals(this.name, other.name) &&
            ObjectHelper.objectEquals(this.displayName, other.displayName) &&
            ObjectHelper.objectEquals(this.description, other.description) &&
            ObjectHelper.objectEquals(this.icon, other.icon) &&
            ObjectHelper.objectEquals(this.language, other.language) &&
            ObjectHelper.equals(this.permissions, other.permissions) &&
            ObjectHelper.equals(this.readAccess, other.readAccess);
    }

}

export class ProjectBuilder {

    name: string;

    displayName: string;

    description: string;

    icon: string;

    permissions: ProjectPermissions;

    readAccess: ProjectReadAccess;

    language: string;

    constructor(source?: Project) {
        if (source) {
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.icon = source.getIcon();
            this.permissions = source.getPermissions();
            this.readAccess = source.getReadAccess();
            this.language = source.getLanguage();
        }
    }

    setName(value: string): ProjectBuilder {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectBuilder {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectBuilder {
        this.description = value;
        return this;
    }

    setIcon(value: string): ProjectBuilder {
        this.icon = value;
        return this;
    }

    setPermissions(value: ProjectPermissions): ProjectBuilder {
        this.permissions = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): ProjectBuilder {
        this.readAccess = value;
        return this;
    }

    setLanguage(value: string): ProjectBuilder {
        this.language = value;
        return this;
    }

    fromJson(json: ProjectJson): ProjectBuilder {
        this.name = json.name;
        this.displayName = json.displayName;
        this.description = json.description;
        this.icon = json.icon;
        this.permissions = ProjectPermissions.fromJson(json.permissions);
        this.readAccess = ProjectReadAccess.fromJson(json.readAccess);
        this.language = json.language;

        return this;
    }

    build(): Project {
        return new Project(this);
    }

}
