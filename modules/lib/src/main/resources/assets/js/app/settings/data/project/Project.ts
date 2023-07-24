import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectJson} from '../../resource/json/ProjectJson';
import {ProjectPermissions} from './ProjectPermissions';
import {ProjectReadAccess} from './ProjectReadAccess';
import {Attachment, AttachmentBuilder} from '../../../attachment/Attachment';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectSiteConfigJson} from '../../resource/json/ProjectSiteConfigJson';
import {ApplicationConfigHelper} from './ApplicationConfigHelper';

export class Project
    implements Equitable {

    public static DEFAULT_PROJECT_NAME: string = 'default';

    private readonly name: string;

    private readonly displayName: string;

    private readonly description: string;

    private readonly parent: string;

    private readonly icon: Attachment;

    private readonly permissions: ProjectPermissions;

    private readonly readAccess: ProjectReadAccess;

    private readonly language: string;

    private readonly siteConfigs: ApplicationConfig[];

    constructor(builder: ProjectBuilder) {
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.parent = builder.parent;
        this.icon = builder.icon;
        this.permissions = builder.permissions;
        this.readAccess = builder.readAccess;
        this.language = builder.language;
        this.siteConfigs = builder.siteConfigs;
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

    getIcon(): Attachment {
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

    getParent(): string {
        return this.parent;
    }

    getSiteConfigs(): ApplicationConfig[] {
        return this.siteConfigs;
    }

    toJson(): ProjectJson {
        return {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            parent: this.parent,
            language: this.language,
            icon: this.icon ? this.icon.toJson() : null,
            permissions: this.permissions ? this.permissions.toJson() : null,
            readAccess: this.readAccess ? this.readAccess.toJson() : null,
            siteConfigs: this.siteConfigs?.map((config: ApplicationConfig) => {
                return {
                    key: config?.getApplicationKey().toString(),
                    config: config?.getConfig().toJson(),
                }
            })
        }
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
               ObjectHelper.equals(this.readAccess, other.readAccess) &&
               ObjectHelper.arrayEquals(this.siteConfigs, other.siteConfigs);
    }

}

export class ProjectBuilder {

    name: string;

    displayName: string;

    description: string;

    parent: string;

    icon: Attachment;

    permissions: ProjectPermissions;

    readAccess: ProjectReadAccess;

    language: string;

    siteConfigs: ApplicationConfig[];

    constructor(source?: Project) {
        if (source) {
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.parent = source.getParent();
            this.icon = source.getIcon();
            this.permissions = source.getPermissions();
            this.readAccess = source.getReadAccess();
            this.language = source.getLanguage();
            this.siteConfigs = source.getSiteConfigs() || [];
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

    setParent(value: string): ProjectBuilder {
        this.parent = value;
        return this;
    }

    setIcon(value: Attachment): ProjectBuilder {
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

    setSiteConfigs(value: ApplicationConfig[]): ProjectBuilder {
        this.siteConfigs = value;
        return this;
    }

    fromJson(json: ProjectJson): ProjectBuilder {
        this.name = json.name;
        this.displayName = json.displayName;
        this.description = json.description || '';
        this.parent = json.parent;
        this.icon = json.icon ? new AttachmentBuilder().fromJson(json.icon).build() : null;
        this.permissions = ProjectPermissions.fromJson(json.permissions);
        this.readAccess = ProjectReadAccess.fromJson(json.readAccess);
        this.language = json.language;
        this.siteConfigs =
            json.siteConfigs?.map((configJson: ProjectSiteConfigJson) => ApplicationConfigHelper.siteConfigJsonToAppConfig(configJson));

        return this;
    }

    build(): Project {
        return new Project(this);
    }

}
