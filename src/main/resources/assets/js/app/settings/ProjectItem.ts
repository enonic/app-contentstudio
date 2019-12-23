import {SettingsItem, SettingsItemBuilder} from './SettingsItem';
import {ProjectItemJson} from './resource/json/ProjectItemJson';

export class ProjectItem
    extends SettingsItem {

    private projectName: string;

    constructor(builder: ProjectItemBuilder) {
        super(builder);

        this.projectName = builder.projectName;
    }

    getId(): string {
        return this.projectName;
    }

    static fromJson(json: ProjectItemJson): ProjectItem {
        return new ProjectItemBuilder().fromJson(json).build();
    }

}

export class ProjectItemBuilder
    extends SettingsItemBuilder {

    projectName: string;

    setProjectName(value: string): ProjectItemBuilder {
        this.projectName = value;
        return this;
    }

    fromJson(json: ProjectItemJson): ProjectItemBuilder {
        super.fromJson(json);
        this.projectName = json.projectName;
        return this;
    }

    build(): ProjectItem {
        return undefined;
    }

}
