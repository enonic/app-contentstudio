import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ContentId} from '../content/ContentId';
import {type DependencyType} from './DependencyType';
import {type Project} from '../settings/data/project/Project';
import {ProjectContext} from '../project/ProjectContext';
import {Branch} from '../versioning/Branch';

export class DependencyParams {

    private readonly id: ContentId;

    private readonly dependencyType: DependencyType;

    private readonly contentType?: ContentTypeName;

    private readonly project: Project;

    private readonly branch?: Branch;

    constructor(builder: DependencyParamsBuilder) {
        this.id = builder.id;
        this.dependencyType = builder.dependencyType;
        this.contentType = builder.contentType;
        this.project = builder.project || ProjectContext.get().getProject();
        this.branch = builder.branch || Branch.DRAFT;
    }

    getContentId(): ContentId {
        return this.id;
    }

    getDependencyType(): DependencyType {
        return this.dependencyType;
    }

    getContentType(): ContentTypeName {
        return this.contentType;
    }

    getProject(): Project {
        return this.project;
    }

    getBranch(): Branch {
        return this.branch;
    }

    static create(): DependencyParamsBuilder {
        return new DependencyParamsBuilder();
    }

}

export class DependencyParamsBuilder {
    id: ContentId;

    dependencyType: DependencyType;

    contentType: ContentTypeName;

    project: Project;

    branch: Branch;

    setContentId(value: ContentId): this {
        this.id = value;
        return this;
    }

    setDependencyType(value: DependencyType): this {
        this.dependencyType = value;
        return this;
    }

    setContentType(value: ContentTypeName): this {
        this.contentType = value;
        return this;
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    setBranch(value: Branch): this {
        this.branch = value;
        return this;
    }

    public build(): DependencyParams {
        return new DependencyParams(this);
    }
}
