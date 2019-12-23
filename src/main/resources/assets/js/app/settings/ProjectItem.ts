import {SettingsItem, SettingsItemBuilder} from './SettingsItem';

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

}

export class ProjectItemBuilder
    extends SettingsItemBuilder {

    projectName: string;

    setProjectName(value: string): ProjectItemBuilder {
        this.projectName = value;
        return this;
    }

    build(): ProjectItem {
        return undefined;
    }

}
