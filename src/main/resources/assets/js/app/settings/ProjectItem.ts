import {SettingsItem, SettingsItemBuilder} from './SettingsItem';
import {ProjectItemJson} from './resource/json/ProjectItemJson';

export class ProjectItem
    extends SettingsItem {

    private name: string;

    constructor(builder: ProjectItemBuilder) {
        super(builder);

        this.name = builder.name;
    }

    getName(): string {
        return this.name;
    }

    getId(): string {
        return this.name;
    }

    static fromJson(json: ProjectItemJson): ProjectItem {
        return new ProjectItemBuilder().fromJson(json).build();
    }

}

export class ProjectItemBuilder
    extends SettingsItemBuilder {

    name: string;

    setName(value: string): ProjectItemBuilder {
        this.name = value;
        return this;
    }

    constructor(source?: ProjectItem) {
        super(source);

        if (!source || !source.getIconClass()) {
            this.setIconClass('icon-tree-2');
        }
    }

    fromJson(json: ProjectItemJson): ProjectItemBuilder {
        super.fromJson(json);
        this.name = json.name;
        return this;
    }

    build(): ProjectItem {
        return new ProjectItem(this);
    }

}
