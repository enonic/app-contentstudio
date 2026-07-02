import { type ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ContentId } from '../content/ContentId';
import { type DependencyType } from './DependencyType';
import { getActiveProjectName } from '../../v6/entities/project/activeProject.store';
import { Branch } from '../versioning/Branch';

export class DependencyParams {
    private readonly id: ContentId;

    private readonly dependencyType: DependencyType;

    private readonly contentType?: ContentTypeName;

    private readonly projectName: string;

    private readonly branch?: Branch;

    constructor(builder: DependencyParamsBuilder) {
        this.id = builder.id;
        this.dependencyType = builder.dependencyType;
        this.contentType = builder.contentType;
        this.projectName = builder.projectName || getActiveProjectName();
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

    getProjectName(): string {
        return this.projectName;
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

    projectName: string;

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

    setProjectName(value: string): this {
        this.projectName = value;
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
