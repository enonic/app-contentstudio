import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type ProjectsTreeItemJson} from '../../resource/json/ProjectsTreeItemJson';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ProjectsTreeItem implements Equitable {

    private readonly name: string;

    private readonly parent: string;

    constructor(builder: ProjectTreeItemBuilder) {
        this.name = builder.name;
        this.parent = builder.parent;
    }

    getName(): string {
        return this.name;
    }

    getParent(): string {
        return this.parent;
    }

    static fromJson(json: ProjectsTreeItemJson): ProjectsTreeItem {
        return new ProjectTreeItemBuilder().fromJson(json).build();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectsTreeItem)) {
            return false;
        }

        const other: ProjectsTreeItem = o as ProjectsTreeItem;

        return ObjectHelper.objectEquals(this.name, other.name);
    }
}

export class ProjectTreeItemBuilder {
    name: string;

    parent: string;

    setName(value: string): ProjectTreeItemBuilder {
        this.name = value;
        return this;
    }

    setParent(value: string): ProjectTreeItemBuilder {
        this.parent = value;
        return this;
    }

    fromJson(json: ProjectsTreeItemJson): ProjectTreeItemBuilder {
        this.name = json.name;
        this.parent = json.parent;
        return this;
    }

    build(): ProjectsTreeItem {
        return new ProjectsTreeItem(this);
    }
}
